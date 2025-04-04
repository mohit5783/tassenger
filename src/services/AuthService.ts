import { USE_STUB_AUTH } from "../config/featureFlags";
import {
  PhoneAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "../api/firebase/config";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

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
// Real implementation using Firebase Auth
const realAuth = {
  async sendVerificationCode(
    phoneNumber: string,
    recaptchaVerifier: any
  ): Promise<VerificationResult> {
    try {
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current
      );
      return { verificationId };
    } catch (error) {
      console.error("Error sending verification code:", error);
      throw error;
    }
  },

  async verifyCode(verificationId: string, code: string): Promise<AuthResult> {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      // Check if user profile exists in Firestore
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      let userProfile: AuthUser;
      let isNewUser = false;

      if (userSnap.exists()) {
        // User exists, return profile
        userProfile = userSnap.data() as AuthUser;
      } else {
        // Create new user profile
        isNewUser = true;
        const timestamp = Date.now();
        userProfile = {
          id: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber || "",
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        await setDoc(userRef, userProfile);
      }

      return { user: userProfile, isNewUser };
    } catch (error) {
      console.error("Error verifying code:", error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    return new Promise((resolve, reject) => {
      const unsubscribe = firebaseOnAuthStateChanged(
        auth,
        async (user) => {
          unsubscribe();

          if (!user) {
            resolve(null);
            return;
          }

          try {
            // Get user profile from Firestore
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              resolve(userSnap.data() as AuthUser);
            } else {
              // Create new user profile if it doesn't exist
              const timestamp = Date.now();
              const userProfile: AuthUser = {
                id: user.uid,
                phoneNumber: user.phoneNumber || "",
                createdAt: timestamp,
                updatedAt: timestamp,
              };

              await setDoc(userRef, userProfile);
              resolve(userProfile);
            }
          } catch (error) {
            reject(error);
          }
        },
        reject
      );
    });
  },

  async updateUserProfile(
    userId: string,
    updates: Partial<AuthUser>
  ): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }

      try {
        // Get user profile from Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          callback(userSnap.data() as AuthUser);
        } else {
          // Create new user profile if it doesn't exist
          const timestamp = Date.now();
          const userProfile: AuthUser = {
            id: firebaseUser.uid,
            phoneNumber: firebaseUser.phoneNumber || "",
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          await setDoc(userRef, userProfile);
          callback(userProfile);
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
        callback(null);
      }
    });
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
