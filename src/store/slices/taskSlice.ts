import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../../api/firebase/config";
import type {
  TaskAssignment,
  TaskGroupStatus,
  TaskRejection,
} from "../../types/group";
import {
  sendPushNotification,
  sendTaskUpdateNotification,
  sendRecurringTaskNotification,
  scheduleApproachingDeadlineNotification,
} from "../../services/NotificationService";

// Update the TaskStatus type to include group statuses
export type TaskStatus =
  | "todo"
  | "inProgress"
  | "review"
  | "pending"
  | "completed"
  | TaskGroupStatus;
export type TaskPriority = "low" | "medium" | "high";
// export type TaskCategory = "work" | "personal" | "shopping" | "health" | "finance" | "other"

// Define the reminder interface
export interface TaskReminder {
  id: string;
  value: string;
  label?: string; // Add optional label property
}

// Update the Task interface to include group-related fields
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  // category: TaskCategory
  // tags?: string[]
  createdBy: string;
  assignedTo?: string;
  assignedToName?: string;
  groupId?: string; // ID of the group this task belongs to
  groupName?: string; // Name of the group this task belongs to
  assignment?: TaskAssignment; // Enhanced assignment details
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
  completedAt?: number;
  reminderSet?: boolean;
  reminderIdentifier?: string | null;
  reminderIdentifiers?: string[]; // Add this line for multiple reminders
  reminders?: TaskReminder[]; // Add this line for structured reminders
  parentTaskId?: string; // For subtasks
  subtasks?: string[]; // IDs of subtasks
  dependencies?: string[]; // IDs of dependent tasks
  // Recurring task properties
  isRecurring?: boolean;
  recurrencePatternId?: string;
  recurrenceIndex?: number;
  recurrencePattern?: any; // For storing recurrence options
}

// Add more functionality to the initial state
interface TaskState {
  tasks: Task[];
  filteredTasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  rejections: TaskRejection[];
  activeFilters: {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    // category?: TaskCategory[]
    // tags?: string[]
    assignedTo?: string[];
    groupId?: string[];
    reviewerId?: string[];
    dateRange?: {
      start?: number;
      end?: number;
    };
  };
}

// Extend the initial state
const initialState: TaskState = {
  tasks: [],
  filteredTasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  searchQuery: "",
  rejections: [],
  activeFilters: {},
};

export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">,
    { rejectWithValue }
  ) => {
    try {
      const timestamp = Date.now();

      // Create a clean object without undefined values
      const cleanData = Object.entries(taskData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      // Add required fields
      const dataToSave = {
        ...cleanData,
        // category: cleanData.category || "other",
        // tags: cleanData.tags || [],
        createdAt: timestamp,
        updatedAt: timestamp,
        reminderSet: false,
        reminderIdentifier: null,
      };

      const taskRef = await addDoc(collection(db, "tasks"), dataToSave);

      // Send push notification to assignee
      if (taskData.assignedTo && taskData.assignedTo !== taskData.createdBy) {
        await sendPushNotification(
          taskData.assignedTo,
          "New Task Assigned",
          `You’ve been assigned a new task: “${taskData.title}”`
        );
      }

      return {
        id: taskRef.id,
        ...dataToSave,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create task");
    }
  }
);

export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (userId: string, { rejectWithValue }) => {
    try {
      // Fetch tasks created by the user
      const createdTasksQuery = query(
        collection(db, "tasks"),
        where("createdBy", "==", userId),
        orderBy("createdAt", "desc")
      );

      // Fetch tasks assigned to the user
      const assignedTasksQuery = query(
        collection(db, "tasks"),
        where("assignedTo", "==", userId),
        orderBy("createdAt", "desc")
      );

      const [createdTasksSnapshot, assignedTasksSnapshot] = await Promise.all([
        getDocs(createdTasksQuery),
        getDocs(assignedTasksQuery),
      ]);

      // Combine and deduplicate tasks
      const tasksMap = new Map();

      createdTasksSnapshot.forEach((doc) => {
        tasksMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      assignedTasksSnapshot.forEach((doc) => {
        if (!tasksMap.has(doc.id)) {
          tasksMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });

      return Array.from(tasksMap.values()) as Task[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch tasks");
    }
  }
);

export const fetchTask = createAsyncThunk(
  "tasks/fetchTask",
  async (taskId: string, { rejectWithValue }) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      const taskSnap = await getDoc(taskRef);

      if (taskSnap.exists()) {
        return { id: taskSnap.id, ...taskSnap.data() } as Task;
      } else {
        return rejectWithValue("Task not found");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch task");
    }
  }
);

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async (
    { taskId, updates }: { taskId: string; updates: Partial<Task> },
    { rejectWithValue, getState }
  ) => {
    try {
      const { auth } = getState() as { auth: { user: any } };
      const userId = auth.user?.id;

      // Get the current task to compare changes
      const taskRef = doc(db, "tasks", taskId);
      const taskSnap = await getDoc(taskRef);

      if (!taskSnap.exists()) {
        return rejectWithValue("Task not found");
      }

      const currentTask = taskSnap.data() as Task;

      // Track which fields were updated for notifications
      const updatedFields: string[] = [];
      Object.keys(updates).forEach((key) => {
        if (
          JSON.stringify(updates[key as keyof Task]) !==
          JSON.stringify(currentTask[key as keyof Task])
        ) {
          updatedFields.push(key);
        }
      });

      // Update the task
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: Date.now(),
      });

      // Send notifications for task updates
      if (updatedFields.length > 0 && userId) {
        // Don't include technical fields in notifications
        const notifiableFields = updatedFields.filter(
          (field) =>
            ![
              "updatedAt",
              "reminderSet",
              "reminderIdentifier",
              "reminderIdentifiers",
            ].includes(field)
        );

        if (notifiableFields.length > 0) {
          await sendTaskUpdateNotification(
            { ...currentTask, ...updates, id: taskId },
            notifiableFields,
            userId
          );
        }
      }

      // If due date was updated, schedule approaching deadline notification
      if (updates.dueDate && updates.dueDate !== currentTask.dueDate) {
        // Schedule notifications at 24, 12, and 2 hours before deadline
        await scheduleApproachingDeadlineNotification(
          { ...currentTask, ...updates, id: taskId },
          24
        );
        await scheduleApproachingDeadlineNotification(
          { ...currentTask, ...updates, id: taskId },
          12
        );
        await scheduleApproachingDeadlineNotification(
          { ...currentTask, ...updates, id: taskId },
          2
        );
      }

      return { taskId, updates };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update task");
    }
  }
);

export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (taskId: string, { rejectWithValue }) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await deleteDoc(taskRef);
      return taskId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete task");
    }
  }
);

// New async thunks for group-based task operations

// Create a task within a group
export const createGroupTask = createAsyncThunk(
  "tasks/createGroupTask",
  async (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt"> & {
      assigneeId: string;
      assigneeName?: string;
      reviewerId?: string;
      reviewerName?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const timestamp = Date.now();

      // Create the assignment object
      const assignment: TaskAssignment = {
        assigneeId: taskData.assigneeId,
        assigneeName: taskData.assigneeName,
        reviewerId: taskData.reviewerId,
        reviewerName: taskData.reviewerName,
        assignedAt: timestamp,
        lastStatusChangeAt: timestamp,
      };

      // Remove the fields that are now in the assignment object
      const {
        assigneeId,
        assigneeName,
        reviewerId,
        reviewerName,
        ...restTaskData
      } = taskData;

      const taskRef = await addDoc(collection(db, "tasks"), {
        ...restTaskData,
        status: "assigned", // Initial status for group tasks
        assignment,
        createdAt: timestamp,
        updatedAt: timestamp,
        reminderSet: false,
        reminderIdentifier: null,
      });

      // Send push notification to assignee
      if (taskData.assigneeId && taskData.createdBy !== taskData.assigneeId) {
        await sendPushNotification(
          taskData.assigneeId,
          "New Task Assigned",
          `You’ve been assigned a new task: “${taskData.title}”`
        );
      }

      return {
        id: taskRef.id,
        ...restTaskData,
        status: "assigned" as TaskStatus,
        assignment,
        createdAt: timestamp,
        updatedAt: timestamp,
        reminderSet: false,
        reminderIdentifier: null,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create group task");
    }
  }
);

// Update task status in the group workflow
export const updateTaskStatus = createAsyncThunk(
  "tasks/updateTaskStatus",
  async (
    {
      taskId,
      newStatus,
      rejectionReason,
    }: {
      taskId: string;
      newStatus: TaskStatus;
      rejectionReason?: string;
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const { auth } = getState() as { auth: { user: any } };
      if (!auth.user) return rejectWithValue("User not authenticated");

      const taskRef = doc(db, "tasks", taskId);
      const taskSnap = await getDoc(taskRef);

      if (!taskSnap.exists()) {
        return rejectWithValue("Task not found");
      }

      const taskData = taskSnap.data() as Task;
      const timestamp = Date.now();

      // Update the base task status
      const updates: any = {
        status: newStatus,
        updatedAt: timestamp,
        "assignment.lastStatusChangeAt": timestamp,
      };

      // Special handling for different status transitions
      if (newStatus === "completed" || newStatus === "reviewed") {
        updates.completedAt = timestamp;
      }

      // Record a task rejection if the status is being changed to reopened
      if (newStatus === "reviewRejected" && rejectionReason) {
        const rejectionRef = await addDoc(
          collection(db, "tasks", taskId, "rejections"),
          {
            taskId,
            reviewerId: auth.user.id,
            reviewerName: auth.user.displayName || auth.user.phoneNumber,
            reason: rejectionReason,
            timestamp,
          }
        );

        // Also store the latest rejection reason in the task itself
        updates.latestRejection = {
          id: rejectionRef.id,
          reviewerId: auth.user.id,
          reviewerName: auth.user.displayName || auth.user.phoneNumber,
          reason: rejectionReason,
          timestamp,
        };
      }

      // Send push notification to creator
      if (taskData.createdBy !== auth.user.id) {
        await sendPushNotification(
          taskData.createdBy,
          "Task Status Updated",
          `${auth.user.displayName || auth.user.phoneNumber} moved task “${
            taskData.title
          }” from *${taskData.status}* to *${newStatus}*`
        );
      }

      await updateDoc(taskRef, updates);

      return { taskId, updates };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update task status");
    }
  }
);

// Fetch task rejections
export const fetchTaskRejections = createAsyncThunk(
  "tasks/fetchTaskRejections",
  async (taskId: string, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, "tasks", taskId, "rejections"),
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(q);
      const rejections: TaskRejection[] = [];

      snapshot.forEach((doc) => {
        rejections.push({ id: doc.id, ...doc.data() } as TaskRejection);
      });

      return rejections;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch task rejections"
      );
    }
  }
);

// Helper function to filter tasks based on search query and filters
const filterTasks = (
  tasks: Task[],
  searchQuery: string,
  activeFilters: TaskState["activeFilters"]
) => {
  let result = [...tasks];

  // Apply search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
    );
  }

  // Apply status filter
  if (activeFilters.status && activeFilters.status.length > 0) {
    result = result.filter((task) =>
      activeFilters.status?.includes(task.status)
    );
  }

  // Apply priority filter
  if (activeFilters.priority && activeFilters.priority.length > 0) {
    result = result.filter((task) =>
      activeFilters.priority?.includes(task.priority)
    );
  }

  // Apply assignee filter
  if (activeFilters.assignedTo && activeFilters.assignedTo.length > 0) {
    result = result.filter((task) => {
      if (activeFilters.assignedTo?.includes("unassigned")) {
        return (
          !task.assignedTo ||
          activeFilters.assignedTo?.includes(task.assignedTo)
        );
      }
      return (
        task.assignedTo && activeFilters.assignedTo?.includes(task.assignedTo)
      );
    });
  }

  // Apply date range filter
  if (activeFilters.dateRange) {
    const { start, end } = activeFilters.dateRange;
    if (start) {
      result = result.filter((task) => !task.dueDate || task.dueDate >= start);
    }
    if (end) {
      result = result.filter((task) => !task.dueDate || task.dueDate <= end);
    }
  }

  return result;
};

// Add reducer cases
const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setCurrentTask: (state, action) => {
      state.currentTask = action.payload;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.filteredTasks = filterTasks(
        state.tasks,
        state.searchQuery,
        state.activeFilters
      );
    },
    setFilters: (state, action) => {
      state.activeFilters = action.payload;
      state.filteredTasks = filterTasks(
        state.tasks,
        state.searchQuery,
        state.activeFilters
      );
    },
    clearFilters: (state) => {
      state.activeFilters = {};
      state.filteredTasks = filterTasks(state.tasks, state.searchQuery, {});
    },
    // Remove addTag and removeTag reducers
    filterTasksByGroup: (state, action) => {
      const groupId = action.payload;

      // First, clear any existing filters to start fresh
      // This is important to prevent filter persistence between screens
      state.activeFilters = {};

      if (groupId) {
        // When viewing a group, only show tasks with this exact groupId
        state.activeFilters.groupId = [groupId];
        state.filteredTasks = state.tasks.filter(
          (task) =>
            // Ensure the task has a groupId and it matches the requested groupId
            task.groupId && task.groupId === groupId
        );
      } else {
        // When not filtering by group, show all tasks
        delete state.activeFilters.groupId;
        state.filteredTasks = [...state.tasks];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create task
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks.unshift(action.payload);
        state.filteredTasks = filterTasks(
          state.tasks,
          state.searchQuery,
          state.activeFilters
        );
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
        state.filteredTasks = filterTasks(
          action.payload,
          state.searchQuery,
          state.activeFilters
        );
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch single task
      .addCase(fetchTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update task
      .addCase(updateTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isLoading = false;
        const { taskId, updates } = action.payload;

        // Update in tasks array
        state.tasks = state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        );
        state.filteredTasks = filterTasks(
          state.tasks,
          state.searchQuery,
          state.activeFilters
        );

        // Update current task if it's the one being updated
        if (state.currentTask && state.currentTask.id === taskId) {
          state.currentTask = { ...state.currentTask, ...updates };
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = state.tasks.filter((task) => task.id !== action.payload);
        state.filteredTasks = filterTasks(
          state.tasks,
          state.searchQuery,
          state.activeFilters
        );
        if (state.currentTask && state.currentTask.id === action.payload) {
          state.currentTask = null;
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Group task creation
      .addCase(createGroupTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGroupTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks.unshift(action.payload);
        state.filteredTasks = filterTasks(
          state.tasks,
          state.searchQuery,
          state.activeFilters
        );
      })
      .addCase(createGroupTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update task status
      .addCase(updateTaskStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const { taskId, updates } = action.payload;

        // Update task in state
        state.tasks = state.tasks.map((task) => {
          if (task.id === taskId) {
            return { ...task, ...updates };
          }
          return task;
        });

        state.filteredTasks = filterTasks(
          state.tasks,
          state.searchQuery,
          state.activeFilters
        );

        // Update current task if it's the one being updated
        if (state.currentTask && state.currentTask.id === taskId) {
          state.currentTask = { ...state.currentTask, ...updates };
        }
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch task rejections
      .addCase(fetchTaskRejections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTaskRejections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rejections = action.payload;
      })
      .addCase(fetchTaskRejections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Make sure to export the new actions
export const {
  setCurrentTask,
  clearCurrentTask,
  clearError,
  setSearchQuery,
  setFilters,
  clearFilters,
  filterTasksByGroup,
} = taskSlice.actions;

export default taskSlice.reducer;

export const generateNextOccurrence = createAsyncThunk(
  "recurrence/generateNextOccurrence",
  async (
    { taskId, completedDate }: { taskId: string; completedDate: Date },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      const taskSnap = await getDoc(taskRef);

      if (!taskSnap.exists()) {
        return rejectWithValue("Task not found");
      }

      const task = taskSnap.data() as Task;

      if (!task.isRecurring || !task.recurrencePattern) {
        return rejectWithValue(
          "Task is not recurring or recurrence pattern is missing"
        );
      }

      const { patternType, interval, daysOfWeek, dayOfMonth, monthOfYear } =
        task.recurrencePattern;

      let nextDueDate: Date | null = null;
      const nextIndex = (task.recurrenceIndex || 0) + 1;

      const calculateNextDueDate = (
        currentDate: Date,
        patternType: string,
        interval: number
      ): Date | null => {
        const newDate = new Date(currentDate);

        switch (patternType) {
          case "daily":
            newDate.setDate(newDate.getDate() + interval);
            break;
          case "weekly":
            newDate.setDate(newDate.getDate() + interval * 7);
            break;
          case "monthly":
            newDate.setMonth(newDate.getMonth() + interval);
            break;
          case "yearly":
            newDate.setFullYear(newDate.getFullYear() + interval);
            break;
          default:
            return null;
        }

        return newDate;
      };

      nextDueDate = calculateNextDueDate(completedDate, patternType, interval);

      // Create the next task occurrence
      const { id, createdAt, updatedAt, completedAt, ...taskTemplate } = task;

      const nextTask = {
        ...taskTemplate,
        dueDate: nextDueDate ? nextDueDate.getTime() : undefined,
        status: "todo" as TaskStatus,
        recurrenceIndex: nextIndex,
      };

      // Create the new task
      const result = await dispatch(createTask(nextTask)).unwrap();

      // Send notification about the new recurring task
      if (result) {
        await sendRecurringTaskNotification(result);
      }

      return result;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to generate next occurrence"
      );
    }
  }
);
