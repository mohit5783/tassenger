import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../api/firebase/config";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { UserService } from "./UserService";
import { createConversation } from "../store/slices/chatSlice"; // Import createConversation
import { store } from "../store"; // Import the Redux store

// User profile interface
export interface UserProfile {
  id: string;
  email?: string;
  phoneNumber?: string;
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

interface AuthResult {
  user: UserProfile;
  isNewUser?: boolean;
}

/**
 * Sign up with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  displayName?: string,
  phoneNumber?: string,
  hasCompletedProfile = false
): Promise<AuthResult> => {
  try {
    // First, check if the phone number already exists in the database
    if (phoneNumber) {
      const formattedPhone = phoneNumber.trim();
      // Query Firestore to check if this phone number is already registered
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phoneNumber", "==", formattedPhone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error(
          "This phone number is already registered. Please use a different phone number."
        );
      }
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    // Update display name if provided
    if (displayName && firebaseUser) {
      await updateProfile(firebaseUser, { displayName });
    }

    // Create user profile in Firestore
    const timestamp = Date.now();
    const userProfile: UserProfile = {
      id: firebaseUser.uid,
      email: firebaseUser.email || email,
      displayName: displayName || firebaseUser.displayName || "",
      phoneNumber: phoneNumber || "",
      photoURL: firebaseUser.photoURL || "",
      salutation: "",
      sex: "",
      occupation: "",
      bio: "",
      hasCompletedProfile, // Use the provided value
      isPhoneVerified: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const userRef = doc(db, "users", firebaseUser.uid);
    await setDoc(userRef, userProfile);

    // Trigger automatic chat creation
    await createChatsWithExistingContacts(firebaseUser.uid, phoneNumber || "");

    return { user: userProfile, isNewUser: true };
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    // Get user profile from Firestore
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    let userProfile: UserProfile;
    let isNewUser = false;

    if (userSnap.exists()) {
      userProfile = userSnap.data() as UserProfile;

      // Update last login time
      await updateDoc(userRef, {
        updatedAt: Date.now(),
      });
    } else {
      // Create user profile if it doesn't exist
      isNewUser = true;
      const timestamp = Date.now();
      userProfile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
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
    }

    return { user: userProfile, isNewUser };
  } catch (error) {
    console.error("Error signing in:", error);
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
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
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

    // Update Firebase Auth profile if display name or photo URL is provided
    if (auth.currentUser && (updates.displayName || updates.photoURL)) {
      await updateProfile(auth.currentUser, {
        displayName: updates.displayName,
        photoURL: updates.photoURL,
      });
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * NEW FUNCTION: Create chats with existing contacts
 * This function runs when a new user signs up and creates chats with existing contacts
 */
const createChatsWithExistingContacts = async (
  newUserId: string,
  newUserPhoneNumber: string
): Promise<void> => {
  try {
    // Get all users
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    // Iterate through each user
    for (const userDoc of usersSnapshot.docs) {
      const user = userDoc.data() as UserProfile;

      // Skip the new user
      if (user.id === newUserId) continue;

      // Check if the existing user has the new user's phone number in their contacts
      const hasContact = await UserService.checkPhoneInContacts(
        newUserPhoneNumber
      );

      if (hasContact) {
        // Check if a conversation already exists between these two users
        const q = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.id),
          where("isGroup", "==", false)
        );

        const querySnapshot = await getDocs(q);
        const existingConversation = querySnapshot.docs.find((doc) => {
          const data = doc.data();
          return data.participants.includes(newUserId);
        });

        if (!existingConversation) {
          // Create a new conversation
          const participants = [user.id, newUserId];
          const participantNames: Record<string, string> = {
            [user.id]: user.displayName || user.phoneNumber || "You",
            [newUserId]: "New User", // Placeholder name
          };

          await store.dispatch(
            createConversation({
              participants,
              participantNames,
              isGroup: false,
            })
          );

          console.log(`Created chat between ${user.id} and ${newUserId}`);
        }
      }
    }
  } catch (error) {
    console.error("Error creating chats with existing contacts:", error);
  }
};
