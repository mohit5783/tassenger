import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../api/firebase/config";
import {
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";

// User profile interface
export interface UserProfile {
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

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
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
            resolve(userSnap.data() as UserProfile);
          } else {
            // Create new user profile if it doesn't exist
            const timestamp = Date.now();
            const userProfile: UserProfile = {
              id: user.uid,
              email: user.email || "",
              phoneNumber: user.phoneNumber || "",
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
              salutation: "",
              sex: "",
              occupation: "",
              bio: "",
              hasCompletedProfile: true, // Mark as complete for simplicity
              isPhoneVerified: false,
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
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> => {
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
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

/**
 * Monitor auth state changes
 */
export const onAuthStateChanged = (
  callback: (user: UserProfile | null) => void
): (() => void) => {
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
        callback(userSnap.data() as UserProfile);
      } else {
        // Create new user profile if it doesn't exist
        const timestamp = Date.now();
        const userProfile: UserProfile = {
          id: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber || "",
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || "",
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
};
