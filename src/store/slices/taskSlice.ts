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

export type TaskStatus =
  | "todo"
  | "inProgress"
  | "review"
  | "pending"
  | "completed"
  | TaskGroupStatus;
export type TaskPriority = "low" | "medium" | "high";
export type TaskCategory =
  | "work"
  | "personal"
  | "shopping"
  | "health"
  | "finance"
  | "other";

// Enhanced Task interface with group-related fields
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  tags?: string[];
  createdBy: string;
  assignedTo?: string;
  assignedToName?: string;
  groupId?: string; // ID of the group this task belongs to
  assignment?: TaskAssignment; // Enhanced assignment details
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
  completedAt?: number;
  reminderSet?: boolean;
  reminderIdentifier?: string | null;
  reminderIdentifiers?: string[]; // Add this line for multiple reminders
  parentTaskId?: string; // For subtasks
  subtasks?: string[]; // IDs of subtasks
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
    category?: TaskCategory[];
    tags?: string[];
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
        category: cleanData.category || "other",
        tags: cleanData.tags || [],
        createdAt: timestamp,
        updatedAt: timestamp,
        reminderSet: false,
        reminderIdentifier: null,
      };

      const taskRef = await addDoc(collection(db, "tasks"), dataToSave);

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
    { rejectWithValue }
  ) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: Date.now(),
      });

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
      if (newStatus === "reopened" && rejectionReason) {
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

  // Apply category filter
  if (activeFilters.category && activeFilters.category.length > 0) {
    result = result.filter((task) =>
      activeFilters.category?.includes(task.category)
    );
  }

  // Apply tags filter
  if (activeFilters.tags && activeFilters.tags.length > 0) {
    result = result.filter(
      (task) =>
        task.tags && activeFilters.tags?.some((tag) => task.tags?.includes(tag))
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
    addTag: (state, action) => {
      const { taskId, tag } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) {
        if (!task.tags) task.tags = [];
        if (!task.tags.includes(tag)) {
          task.tags.push(tag);
        }
      }
    },
    removeTag: (state, action) => {
      const { taskId, tag } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task && task.tags) {
        task.tags = task.tags.filter((t) => t !== tag);
      }
    },
    // Add new reducer to filter tasks by group
    filterTasksByGroup: (state, action) => {
      const groupId = action.payload;
      if (groupId) {
        state.activeFilters.groupId = [groupId];
        state.filteredTasks = state.tasks.filter(
          (task) => task.groupId === groupId
        );
      } else {
        delete state.activeFilters.groupId;
        state.filteredTasks = filterTasks(
          state.tasks,
          state.searchQuery,
          state.activeFilters
        );
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
  addTag,
  removeTag,
  filterTasksByGroup,
} = taskSlice.actions;

export default taskSlice.reducer;
