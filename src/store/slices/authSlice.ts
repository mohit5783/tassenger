import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
// Import the AuthService instead of Firebase directly
import {
  sendVerificationCode,
  verifyCode,
  signOut as authSignOut,
  getCurrentUser,
} from "../../services/AuthService";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../api/firebase/config";

interface UserProfile {
  id: string;
  phoneNumber: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
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

// Update the sendOTP thunk
export const sendOTP = createAsyncThunk(
  "auth/sendOTP",
  async (
    {
      phoneNumber,
      recaptchaVerifier,
    }: { phoneNumber: string; recaptchaVerifier: any },
    { rejectWithValue }
  ) => {
    try {
      const { verificationId } = await sendVerificationCode(
        phoneNumber,
        recaptchaVerifier
      );
      return verificationId;
    } catch (error: any) {
      console.error("Error in sendOTP:", error);
      return rejectWithValue(
        error.message || "Failed to send verification code"
      );
    }
  }
);

// Update the verifyOTP thunk
export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async (
    { verificationId, otp }: { verificationId: string; otp: string },
    { rejectWithValue }
  ) => {
    try {
      const { user } = await verifyCode(verificationId, otp);
      return user;
    } catch (error: any) {
      console.error("Error in verifyOTP:", error);
      return rejectWithValue(error.message || "Failed to verify code");
    }
  }
);

// Update the signOut thunk
export const signOut = createAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      await authSignOut();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to sign out");
    }
  }
);

// Update the checkAuth thunk
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const user = await getCurrentUser();
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
      const userRef = doc(db, "users", userId);
      await setDoc(
        userRef,
        {
          ...data,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
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
      // Send OTP
      .addCase(sendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verificationId = action.payload;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.verificationId = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
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
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update User Profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      });
  },
});

export const { clearError, clearVerificationId, setMockUser } =
  authSlice.actions;
export default authSlice.reducer;
