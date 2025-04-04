import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import * as EmailAuthService from "../../services/EmailAuthService";

// Use the appropriate auth service
const AuthService = EmailAuthService;

interface UserProfile {
  id: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  salutation?: string;
  sex?: string;
  occupation?: string;
  bio?: string;
  isPhoneVerified?: boolean;
  phoneVerifiedAt?: number;
  hasCompletedProfile?: boolean;
  createdAt: number;
  updatedAt: number;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  verificationId: string | null;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  verificationId: null,
  error: null,
};

// Email auth thunks
export const signUp = createAsyncThunk(
  "auth/signUp",
  async (
    {
      email,
      password,
      displayName,
      phoneNumber,
      hasCompletedProfile = false,
    }: {
      email: string;
      password: string;
      displayName?: string;
      phoneNumber?: string;
      hasCompletedProfile?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await EmailAuthService.signUp(
        email,
        password,
        displayName,
        phoneNumber,
        hasCompletedProfile
      );
      return result;
    } catch (error: any) {
      console.error("Error in signUp:", error);
      return rejectWithValue(error.message || "Failed to sign up");
    }
  }
);

export const signIn = createAsyncThunk(
  "auth/signIn",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await EmailAuthService.signIn(email, password);
      return result;
    } catch (error: any) {
      console.error("Error in signIn:", error);
      return rejectWithValue(error.message || "Failed to sign in");
    }
  }
);

// Common thunks
export const signOut = createAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.signOut();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to sign out");
    }
  }
);

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const user = await AuthService.getCurrentUser();
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to check auth status");
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (
    {
      userId,
      data,
    }: { userId: string; data: Partial<Omit<UserProfile, "id" | "createdAt">> },
    { rejectWithValue }
  ) => {
    try {
      await AuthService.updateUserProfile(userId, data);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update user profile");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearVerificationId: (state) => {
      state.verificationId = null;
    },
    // Add this new reducer for development purposes
    setMockUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign Up
      .addCase(signUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false;
        // Don't set user or isAuthenticated on signup - user needs to sign in
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Sign In
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        // Always set authenticated to true on successful sign in
        state.isAuthenticated = true;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Sign Out
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        // If user exists, mark as authenticated
        state.isAuthenticated = !!action.payload;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update User Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearVerificationId, setMockUser } =
  authSlice.actions;
export default authSlice.reducer;
