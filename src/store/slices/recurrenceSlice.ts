import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
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
  RecurrencePattern,
  RecurrenceOptions,
} from "../../types/recurrence";
import { RecurrenceService } from "../../services/RecurrenceService";
import { createTask, updateTask } from "./taskSlice";

interface RecurrenceState {
  patterns: RecurrencePattern[];
  currentPattern: RecurrencePattern | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RecurrenceState = {
  patterns: [],
  currentPattern: null,
  isLoading: false,
  error: null,
};

// Create a new recurrence pattern and initial task
export const createRecurringTask = createAsyncThunk(
  "recurrence/createRecurringTask",
  async (
    {
      taskData,
      recurrenceOptions,
    }: {
      taskData: any;
      recurrenceOptions: RecurrenceOptions;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      // First, create the task template
      const taskResult = await dispatch(
        createTask({
          ...taskData,
          isRecurring: true,
        })
      ).unwrap();

      const taskId = taskResult.id;
      const timestamp = Date.now();

      // Create the recurrence pattern
      const patternRef = await addDoc(
        collection(db, "taskRecurrencePatterns"),
        {
          type: recurrenceOptions.type,
          frequency: recurrenceOptions.frequency,
          endType: recurrenceOptions.endType,
          endDate: recurrenceOptions.endDate
            ? recurrenceOptions.endDate.getTime()
            : undefined,
          endCount: recurrenceOptions.endCount,
          createdBy: taskData.createdBy,
          createdAt: timestamp,
          updatedAt: timestamp,
          taskTemplateId: taskId,
        }
      );

      // Update the task with the recurrence pattern ID
      await dispatch(
        updateTask({
          taskId,
          updates: {
            recurrencePatternId: patternRef.id,
            recurrenceIndex: 1, // First occurrence
          },
        })
      );

      return {
        id: patternRef.id,
        type: recurrenceOptions.type,
        frequency: recurrenceOptions.frequency,
        endType: recurrenceOptions.endType,
        endDate: recurrenceOptions.endDate
          ? recurrenceOptions.endDate.getTime()
          : undefined,
        endCount: recurrenceOptions.endCount,
        createdBy: taskData.createdBy,
        createdAt: timestamp,
        updatedAt: timestamp,
        taskTemplateId: taskId,
      } as RecurrencePattern;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to create recurring task"
      );
    }
  }
);

// Generate the next occurrence of a recurring task
export const generateNextOccurrence = createAsyncThunk(
  "recurrence/generateNextOccurrence",
  async (
    { taskId, completedDate }: { taskId: string; completedDate: Date },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      // Get the task
      const taskRef = doc(db, "tasks", taskId);
      const taskSnap = await getDoc(taskRef);

      if (!taskSnap.exists()) {
        return rejectWithValue("Task not found");
      }

      const task = { id: taskSnap.id, ...taskSnap.data() } as any;

      // If not a recurring task, do nothing
      if (!task.isRecurring || !task.recurrencePatternId) {
        return rejectWithValue("Not a recurring task");
      }

      // Get the recurrence pattern
      const patternRef = doc(
        db,
        "taskRecurrencePatterns",
        task.recurrencePatternId
      );
      const patternSnap = await getDoc(patternRef);

      if (!patternSnap.exists()) {
        return rejectWithValue("Recurrence pattern not found");
      }

      const pattern = {
        id: patternSnap.id,
        ...patternSnap.data(),
      } as RecurrencePattern;

      // Check if we've reached the end of the recurrence
      const nextIndex = (task.recurrenceIndex || 1) + 1;
      if (
        RecurrenceService.hasRecurrenceEnded(pattern, nextIndex, completedDate)
      ) {
        return { message: "Recurrence has ended" };
      }

      // Calculate the next occurrence date
      const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();
      const nextDueDate = RecurrenceService.calculateNextOccurrenceDate(
        pattern,
        dueDate
      );

      // Create the next task occurrence
      const { id, createdAt, updatedAt, completedAt, ...taskTemplate } = task;

      const nextTask = {
        ...taskTemplate,
        dueDate: nextDueDate.getTime(),
        status: "todo", // Always start as todo
        recurrenceIndex: nextIndex,
      };

      // Create the new task
      const result = await dispatch(createTask(nextTask)).unwrap();

      return result;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to generate next occurrence"
      );
    }
  }
);

// Fetch recurrence patterns for a user
export const fetchRecurrencePatterns = createAsyncThunk(
  "recurrence/fetchRecurrencePatterns",
  async (userId: string, { rejectWithValue }) => {
    try {
      const patternsQuery = query(
        collection(db, "taskRecurrencePatterns"),
        where("createdBy", "==", userId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(patternsQuery);

      const patterns: RecurrencePattern[] = [];
      snapshot.forEach((doc) => {
        patterns.push({ id: doc.id, ...doc.data() } as RecurrencePattern);
      });

      return patterns;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch recurrence patterns"
      );
    }
  }
);

// Update a recurrence pattern
export const updateRecurrencePattern = createAsyncThunk(
  "recurrence/updateRecurrencePattern",
  async (
    {
      patternId,
      updates,
    }: { patternId: string; updates: Partial<RecurrencePattern> },
    { rejectWithValue }
  ) => {
    try {
      const patternRef = doc(db, "taskRecurrencePatterns", patternId);

      await updateDoc(patternRef, {
        ...updates,
        updatedAt: Date.now(),
      });

      return { patternId, updates };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to update recurrence pattern"
      );
    }
  }
);

// Delete a recurrence pattern
export const deleteRecurrencePattern = createAsyncThunk(
  "recurrence/deleteRecurrencePattern",
  async (patternId: string, { rejectWithValue }) => {
    try {
      const patternRef = doc(db, "taskRecurrencePatterns", patternId);
      await deleteDoc(patternRef);

      return patternId;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to delete recurrence pattern"
      );
    }
  }
);

const recurrenceSlice = createSlice({
  name: "recurrence",
  initialState,
  reducers: {
    clearCurrentPattern: (state) => {
      state.currentPattern = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create recurring task
      .addCase(createRecurringTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        createRecurringTask.fulfilled,
        (state, action: PayloadAction<RecurrencePattern>) => {
          state.isLoading = false;
          state.patterns.unshift(action.payload);
          state.currentPattern = action.payload;
        }
      )
      .addCase(
        createRecurringTask.rejected,
        (state, action: PayloadAction<any>) => {
          state.isLoading = false;
          state.error = action.payload as string;
        }
      )

      // Fetch recurrence patterns
      .addCase(fetchRecurrencePatterns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchRecurrencePatterns.fulfilled,
        (state, action: PayloadAction<RecurrencePattern[]>) => {
          state.isLoading = false;
          state.patterns = action.payload;
        }
      )
      .addCase(
        fetchRecurrencePatterns.rejected,
        (state, action: PayloadAction<any>) => {
          state.isLoading = false;
          state.error = action.payload as string;
        }
      )

      // Update recurrence pattern
      .addCase(updateRecurrencePattern.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateRecurrencePattern.fulfilled,
        (
          state,
          action: PayloadAction<{
            patternId: string;
            updates: Partial<RecurrencePattern>;
          }>
        ) => {
          state.isLoading = false;
          const { patternId, updates } = action.payload;

          // Update in patterns array
          state.patterns = state.patterns.map((pattern) =>
            pattern.id === patternId ? { ...pattern, ...updates } : pattern
          );

          // Update current pattern if it's the one being updated
          if (state.currentPattern && state.currentPattern.id === patternId) {
            state.currentPattern = { ...state.currentPattern, ...updates };
          }
        }
      )
      .addCase(
        updateRecurrencePattern.rejected,
        (state, action: PayloadAction<any>) => {
          state.isLoading = false;
          state.error = action.payload as string;
        }
      )

      // Delete recurrence pattern
      .addCase(deleteRecurrencePattern.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        deleteRecurrencePattern.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.patterns = state.patterns.filter(
            (pattern) => pattern.id !== action.payload
          );

          if (
            state.currentPattern &&
            state.currentPattern.id === action.payload
          ) {
            state.currentPattern = null;
          }
        }
      )
      .addCase(
        deleteRecurrencePattern.rejected,
        (state, action: PayloadAction<any>) => {
          state.isLoading = false;
          state.error = action.payload as string;
        }
      )

      // Generate next occurrence
      .addCase(generateNextOccurrence.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateNextOccurrence.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(
        generateNextOccurrence.rejected,
        (state, action: PayloadAction<any>) => {
          state.isLoading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export const { clearCurrentPattern, clearError } = recurrenceSlice.actions;
export default recurrenceSlice.reducer;
