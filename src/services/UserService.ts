import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../api/firebase/config";
import * as Contacts from "expo-contacts";
import { formatPhoneNumber, comparePhoneNumbers } from "../utils/phoneUtils";

export interface UserProfile {
  id: string;
  displayName?: string;
  phoneNumber: string;
  photoURL?: string;
  email?: string;
  createdAt: number;
  updatedAt: number;
}

// Cache users to avoid repeated Firestore queries
const userCache = new Map<string, UserProfile>();

export const UserService = {
  /**
   * Get a user by ID
   */
  getUserById: async (userId: string): Promise<UserProfile | null> => {
    // Check cache first
    if (userCache.has(userId)) {
      return userCache.get(userId) || null;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", userId));

      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as UserProfile;
        userCache.set(userId, userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  },

  /**
   * Get multiple users by their IDs
   */
  getUsersByIds: async (userIds: string[]): Promise<UserProfile[]> => {
    if (!userIds.length) return [];

    // Filter out IDs that are already in cache
    const cachedUsers: UserProfile[] = [];
    const idsToFetch: string[] = [];

    userIds.forEach((id) => {
      if (userCache.has(id)) {
        const user = userCache.get(id);
        if (user) cachedUsers.push(user);
      } else {
        idsToFetch.push(id);
      }
    });

    // If all users are cached, return them
    if (idsToFetch.length === 0) {
      return cachedUsers;
    }

    try {
      const users: UserProfile[] = [...cachedUsers];

      // Firestore doesn't support large IN queries, so batch them
      const batchSize = 10;
      for (let i = 0; i < idsToFetch.length; i += batchSize) {
        const batch = idsToFetch.slice(i, i + batchSize);

        // Use a batched get if possible
        const userDocs = await Promise.all(
          batch.map((id) => getDoc(doc(db, "users", id)))
        );

        userDocs.forEach((doc) => {
          if (doc.exists()) {
            const data = doc.data();
            if (typeof data === "object" && data !== null) {
              const userData = { id: doc.id, ...data } as UserProfile;
              users.push(userData);
              userCache.set(doc.id, userData);
            }
          }
        });
      }

      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      return cachedUsers;
    }
  },

  /**
   * Search users by name or phone number
   */
  searchUsers: async (
    searchTerm: string,
    excludeIds: string[] = []
  ): Promise<UserProfile[]> => {
    try {
      // First try to match by phone number
      const phoneQuery = query(
        collection(db, "users"),
        where("phoneNumber", ">=", searchTerm),
        where("phoneNumber", "<=", searchTerm + "\uf8ff")
      );

      // Then try to match by display name
      const nameQuery = query(
        collection(db, "users"),
        where("displayName", ">=", searchTerm),
        where("displayName", "<=", searchTerm + "\uf8ff")
      );

      const [phoneResults, nameResults] = await Promise.all([
        getDocs(phoneQuery),
        getDocs(nameQuery),
      ]);

      const users = new Map<string, UserProfile>();

      // Add phone number matches
      phoneResults.forEach((doc) => {
        if (!excludeIds.includes(doc.id)) {
          const userData = { id: doc.id, ...doc.data() } as UserProfile;
          users.set(doc.id, userData);
          userCache.set(doc.id, userData);
        }
      });

      // Add name matches
      nameResults.forEach((doc) => {
        if (!excludeIds.includes(doc.id) && !users.has(doc.id)) {
          const userData = { id: doc.id, ...doc.data() } as UserProfile;
          users.set(doc.id, userData);
          userCache.set(doc.id, userData);
        }
      });

      return Array.from(users.values());
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  },

  /**
   * Checks if a phone number exists in the user's contacts
   * @param phoneNumber The phone number to check
   * @returns True if the phone number exists in contacts
   */
  checkPhoneInContacts: async (phoneNumber: string): Promise<boolean> => {
    try {
      const { status } = await Contacts.getPermissionsAsync();

      if (status !== "granted") {
        const { status: newStatus } = await Contacts.requestPermissionsAsync();
        if (newStatus !== "granted") {
          return false;
        }
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (data.length === 0) {
        return false;
      }

      // Format the input phone number for comparison
      const formattedInputNumber = formatPhoneNumber(phoneNumber);

      // Check if the phone number exists in any contact
      for (const contact of data) {
        if (contact.phoneNumbers) {
          for (const phoneNumberObj of contact.phoneNumbers) {
            const contactNumber = formatPhoneNumber(
              phoneNumberObj.number || ""
            );
            if (comparePhoneNumbers(contactNumber, formattedInputNumber)) {
              return true;
            }
          }
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking contacts:", error);
      return false;
    }
  },

  /**
   * Clear the user cache
   */
  clearCache: () => {
    userCache.clear();
  },
};

export default UserService;
