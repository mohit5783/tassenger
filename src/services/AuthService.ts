import { USE_STUB_AUTH } from "../config/featureFlags";

// Type definitions to match the real API
interface AuthUser {
  id: string;
  phoneNumber: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  createdAt: number;
  updatedAt: number;
}

interface AuthResult {
  user: AuthUser;
  isNewUser?: boolean;
}

interface VerificationResult {
  verificationId: string;
}

// ========== STUB IMPLEMENTATION ==========
const stubAuth = {
  // Phone authentication
  async sendVerificationCode(
    phoneNumber: string,
    recaptchaVerifier?: any
  ): Promise<VerificationResult> {
    console.log(`[STUB] Would send verification code to: ${phoneNumber}`);
    // Simulate async delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { verificationId: "stub-verification-id-12345" };
  },

  async verifyCode(verificationId: string, code: string): Promise<AuthResult> {
    console.log(
      `[STUB] Would verify code: ${code} for verification ID: ${verificationId}`
    );
    // Simulate async delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const timestamp = Date.now();
    return {
      user: {
        id: "stub-user-id-12345",
        phoneNumber: "+1234567890",
        displayName: "Stub User",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      isNewUser: Math.random() > 0.5, // Randomly determine if new user
    };
  },

  // User management
  async getCurrentUser(): Promise<AuthUser | null> {
    console.log("[STUB] Would get current user");
    // Return a stub user
    return {
      id: "stub-user-id-12345",
      phoneNumber: "+1234567890",
      displayName: "Stub User",
      createdAt: Date.now() - 86400000, // 1 day ago
      updatedAt: Date.now(),
    };
  },

  async updateUserProfile(
    userId: string,
    updates: Partial<AuthUser>
  ): Promise<void> {
    console.log(`[STUB] Would update user profile for ID: ${userId}`, updates);
    // Simulate async delay
    await new Promise((resolve) => setTimeout(resolve, 800));
  },

  async signOut(): Promise<void> {
    console.log("[STUB] Would sign out user");
    // Simulate async delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  },

  // Auth state observer
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    console.log("[STUB] Would set up auth state observer");
    // Immediately call with stub user
    setTimeout(() => {
      callback({
        id: "stub-user-id-12345",
        phoneNumber: "+1234567890",
        displayName: "Stub User",
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now(),
      });
    }, 0);

    // Return unsubscribe function
    return () => {
      console.log("[STUB] Would unsubscribe from auth state changes");
    };
  },
};

// ========== REAL IMPLEMENTATION ==========
// This would be the actual implementation using Firebase Auth
// TODO: Implement real auth service when ready to integrate native modules
const realAuth = {
  // We'll implement these when we're ready to use real auth
  // For now, they just call the stub methods to avoid errors
  async sendVerificationCode(
    phoneNumber: string,
    recaptchaVerifier?: any
  ): Promise<VerificationResult> {
    return stubAuth.sendVerificationCode(phoneNumber, recaptchaVerifier);
  },

  async verifyCode(verificationId: string, code: string): Promise<AuthResult> {
    return stubAuth.verifyCode(verificationId, code);
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    return stubAuth.getCurrentUser();
  },

  async updateUserProfile(
    userId: string,
    updates: Partial<AuthUser>
  ): Promise<void> {
    return stubAuth.updateUserProfile(userId, updates);
  },

  async signOut(): Promise<void> {
    return stubAuth.signOut();
  },

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return stubAuth.onAuthStateChanged(callback);
  },
};

// Export the appropriate implementation based on the feature flag
export const AuthService = USE_STUB_AUTH ? stubAuth : realAuth;

// Convenience exports for commonly used functions
export const {
  sendVerificationCode,
  verifyCode,
  getCurrentUser,
  updateUserProfile,
  signOut,
  onAuthStateChanged,
} = AuthService;
