import * as Contacts from "expo-contacts";
import * as SMS from "expo-sms";
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../api/firebase/config";
import { Linking, Platform } from "react-native";
import { formatPhoneNumber, comparePhoneNumbers } from "../utils/phoneUtils";
import {
  STORAGE_KEYS,
  saveToStorage,
  loadFromStorage,
  isDataStale,
  updateTimestamp,
} from "../utils/storageUtils";
import { contactsEventEmitter } from "../utils/eventEmitter";

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  hasApp: boolean;
  userId?: string;
  email?: string;
  photoURL?: string;
}

// Interface for app users from Firestore
interface AppUser {
  id: string;
  phoneNumber: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: number;
}

// Interface for cached app users
interface AppUserCache {
  users: AppUser[];
  timestamp: number;
  lastUserId?: string; // For pagination if needed
}

export const requestContactsPermission = async (): Promise<boolean> => {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === "granted";
};

export const getContacts = async (
  forceRefresh = false,
  onProgressUpdate?: (message: string, percentage?: number) => void
): Promise<Contact[]> => {
  // Emit progress update
  contactsEventEmitter.emit("progress", { message: "Checking permissions..." });

  const { status } = await Contacts.getPermissionsAsync();

  if (status !== "granted") {
    contactsEventEmitter.emit("progress", {
      message: "Requesting contacts permission...",
    });
    const { status: newStatus } = await Contacts.requestPermissionsAsync();
    if (newStatus !== "granted") {
      contactsEventEmitter.emit("progress", { message: "Permission denied" });
      throw new Error("Permission not granted");
    }
  }

  // IMPROVEMENT: Return cached contacts immediately if available
  // This allows showing something while loading fresh data
  if (!forceRefresh) {
    contactsEventEmitter.emit("progress", {
      message: "Checking cached contacts...",
    });
    const cachedContacts = await loadFromStorage<Contact[]>(
      STORAGE_KEYS.CONTACTS
    );
    if (cachedContacts && cachedContacts.length > 0) {
      // Emit these cached contacts immediately so UI can update
      contactsEventEmitter.emit("partialContacts", {
        contacts: cachedContacts,
        isCache: true,
      });

      // Check if cache is still valid
      const isContactsStale = await isDataStale(
        STORAGE_KEYS.CONTACTS_LAST_UPDATED,
        24
      ); // 24 hours
      if (!isContactsStale) {
        contactsEventEmitter.emit("progress", {
          message: "Using cached contacts",
          complete: true,
        });
        return cachedContacts;
      }

      // If cache is stale, continue loading but we've already shown something to the user
      contactsEventEmitter.emit("progress", {
        message: "Refreshing contacts data...",
      });
    }
  }

  // IMPROVEMENT: Get cached app users immediately
  // This allows matching contacts with app users faster
  const cachedAppUsers = await loadFromStorage<AppUserCache>(
    STORAGE_KEYS.APP_USERS
  );
  let appUserMap = new Map<string, AppUser>();

  if ((cachedAppUsers?.users ?? []).length > 0) {
    // Create a map for faster lookups
    cachedAppUsers?.users.forEach((user) => {
      appUserMap.set(user.phoneNumber, user);
    });
  }

  // IMPROVEMENT: Load contacts in smaller batches with UI updates between batches
  contactsEventEmitter.emit("progress", {
    message: "Loading contacts...",
    percentage: 0,
  });

  const pageSize = 50; // Smaller batch size for better performance
  let pageOffset = 0;
  const allContacts: Contact[] = [];
  let hasMoreContacts = true;
  let pageCount = 0;
  let processedCount = 0;
  const phoneNumberSet = new Set<string>(); // To track unique phone numbers

  // Fetch contacts in batches to handle large contact lists
  while (hasMoreContacts) {
    pageCount++;
    contactsEventEmitter.emit("progress", {
      message: `Loading contacts (batch ${pageCount})...`,
      percentage: Math.min(pageCount * 5, 50), // Show progress percentage
    });

    const { data, hasNextPage } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Name,
        Contacts.Fields.Emails,
        Contacts.Fields.Image,
      ],
      pageSize,
      pageOffset,
    });

    // IMPROVEMENT: Process this batch immediately
    const batchContacts: Contact[] = [];

    data.forEach((contact) => {
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        // Get the first phone number
        const phoneNumber = formatPhoneNumber(
          contact.phoneNumbers[0].number || ""
        );

        if (phoneNumber && !phoneNumberSet.has(phoneNumber)) {
          phoneNumberSet.add(phoneNumber);
          processedCount++;

          // Check if this contact is an app user
          const appUser = appUserMap.get(phoneNumber);
          const newContact: Contact = {
            id: contact.id || `phone-${phoneNumber}`,
            name: contact.name || "Unknown",
            phoneNumber,
            hasApp: !!appUser,
            userId: appUser?.id,
            email:
              contact.emails && contact.emails.length > 0
                ? contact.emails[0].email
                : undefined,
            photoURL:
              contact.imageAvailable && contact.image
                ? contact.image.uri
                : undefined,
          };

          batchContacts.push(newContact);
          allContacts.push(newContact);
        }
      }
    });

    // IMPROVEMENT: Emit these contacts immediately so UI can update
    if (batchContacts.length > 0) {
      contactsEventEmitter.emit("partialContacts", {
        contacts: batchContacts,
        batchNumber: pageCount,
        isPartial: true,
      });
    }

    hasMoreContacts = hasNextPage;
    pageOffset += pageSize;

    // Safety limit to prevent infinite loops
    if (pageOffset > 10000) {
      break;
    }

    // IMPROVEMENT: Add a small delay to allow UI to breathe
    if (hasMoreContacts) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  // If we don't have any cached app users or we're forcing a refresh,
  // fetch app users from Firestore
  if (appUserMap.size === 0 || forceRefresh) {
    contactsEventEmitter.emit("progress", {
      message: "Fetching app users...",
      percentage: 60,
    });

    const appUsers = await getAppUsers(forceRefresh);

    // Create a map of phone numbers to app users for faster lookup
    appUserMap = new Map<string, AppUser>();
    appUsers.forEach((user) => {
      appUserMap.set(user.phoneNumber, user);
    });

    // Match contacts with app users
    contactsEventEmitter.emit("progress", {
      message: "Matching contacts with app users...",
      percentage: 80,
    });

    let appUsersFound = 0;
    const updatedContacts: Contact[] = [];

    allContacts.forEach((contact) => {
      const appUser = appUserMap.get(contact.phoneNumber);
      const wasAppUser = contact.hasApp;

      if (appUser && !wasAppUser) {
        contact.hasApp = true;
        contact.userId = appUser.id;
        appUsersFound++;
        updatedContacts.push(contact);
      }
    });

    // If we found new app users, emit an update
    if (updatedContacts.length > 0) {
      contactsEventEmitter.emit("partialContacts", {
        contacts: updatedContacts,
        isAppUserUpdate: true,
      });

      contactsEventEmitter.emit("progress", {
        message: `Found ${appUsersFound} new app users`,
        percentage: 90,
      });
    }
  }

  // Update progress
  contactsEventEmitter.emit("progress", {
    message: "Sorting contacts...",
    percentage: 90,
  });

  // Sort contacts: app users first, then alphabetically
  const sortedContacts = allContacts.sort((a, b) => {
    if (a.hasApp && !b.hasApp) return -1;
    if (!a.hasApp && b.hasApp) return 1;
    return a.name.localeCompare(b.name);
  });

  // Cache the contacts
  await saveToStorage(STORAGE_KEYS.CONTACTS, sortedContacts);
  await updateTimestamp(STORAGE_KEYS.CONTACTS_LAST_UPDATED);

  contactsEventEmitter.emit("progress", {
    message: "Contacts loaded successfully",
    complete: true,
    percentage: 100,
  });

  return sortedContacts;
};

/**
 * Get all app users, either from cache or from Firestore
 */
const getAppUsers = async (forceRefresh = false): Promise<AppUser[]> => {
  // Check if we have cached app users and they're not stale
  if (!forceRefresh) {
    // IMPROVEMENT: Reduce cache lifetime from 12 hours to 2 hours
    const isAppUsersCacheStale = await isDataStale(
      STORAGE_KEYS.APP_USERS_TIMESTAMP,
      2
    ); // 2 hours instead of 12

    if (!isAppUsersCacheStale) {
      const cachedAppUsers = await loadFromStorage<AppUserCache>(
        STORAGE_KEYS.APP_USERS
      );
      if (cachedAppUsers && cachedAppUsers.users.length > 0) {
        return cachedAppUsers.users;
      }
    }
  }

  try {
    contactsEventEmitter.emit("progress", {
      message: "Fetching app users from server...",
      percentage: 65,
    });

    // Fetch all app users from Firestore
    // Note: This approach works for small to medium user bases
    // For very large user bases (100K+), we might need to implement pagination
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"), limit(10000));
    const querySnapshot = await getDocs(q);

    const appUsers: AppUser[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.phoneNumber) {
        appUsers.push({
          id: doc.id,
          phoneNumber: formatPhoneNumber(userData.phoneNumber),
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          createdAt: userData.createdAt,
        });
      }
    });

    // Cache the app users
    const appUserCache: AppUserCache = {
      users: appUsers,
      timestamp: Date.now(),
      lastUserId:
        appUsers.length > 0 ? appUsers[appUsers.length - 1].id : undefined,
    };

    await saveToStorage(STORAGE_KEYS.APP_USERS, appUserCache);
    await updateTimestamp(STORAGE_KEYS.APP_USERS_TIMESTAMP);

    contactsEventEmitter.emit("progress", {
      message: `Found ${appUsers.length} app users`,
      percentage: 70,
    });

    return appUsers;
  } catch (error) {
    console.error("Error fetching app users:", error);
    contactsEventEmitter.emit("progress", {
      message: "Error fetching app users",
      percentage: 70,
    });
    return [];
  }
};

/**
 * NEW FUNCTION: Refresh app users to discover new users
 * This specifically checks for users who have joined since the last update
 */
export const refreshAppUsers = async (): Promise<AppUser[]> => {
  try {
    contactsEventEmitter.emit("progress", {
      message: "Checking for new app users...",
    });

    // Get the timestamp of our last app users update
    const lastUpdateTimestamp =
      (await loadFromStorage<number>(STORAGE_KEYS.APP_USERS_TIMESTAMP)) || 0;

    // Query Firestore for users created after our last update
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("createdAt", ">", lastUpdateTimestamp),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    // If no new users, return early
    if (querySnapshot.empty) {
      contactsEventEmitter.emit("progress", {
        message: "No new app users found",
      });
      return [];
    }

    // Process new users
    const newAppUsers: AppUser[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.phoneNumber) {
        newAppUsers.push({
          id: doc.id,
          phoneNumber: formatPhoneNumber(userData.phoneNumber),
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          createdAt: userData.createdAt,
        });
      }
    });

    // Update our cached app users
    const cachedAppUsers = (await loadFromStorage<AppUserCache>(
      STORAGE_KEYS.APP_USERS
    )) || { users: [], timestamp: 0 };

    // Add new users and remove duplicates
    const existingPhoneNumbers = new Set(
      cachedAppUsers.users.map((user) => user.phoneNumber)
    );
    const uniqueNewUsers = newAppUsers.filter(
      (user) => !existingPhoneNumbers.has(user.phoneNumber)
    );

    if (uniqueNewUsers.length > 0) {
      cachedAppUsers.users = [...uniqueNewUsers, ...cachedAppUsers.users];
      cachedAppUsers.timestamp = Date.now();

      await saveToStorage(STORAGE_KEYS.APP_USERS, cachedAppUsers);
      await updateTimestamp(STORAGE_KEYS.APP_USERS_TIMESTAMP);

      contactsEventEmitter.emit("progress", {
        message: `Found ${uniqueNewUsers.length} new app users`,
      });

      // Update contact list with new app users
      await updateContactsWithNewAppUsers(uniqueNewUsers);
    }

    return uniqueNewUsers;
  } catch (error) {
    console.error("Error refreshing app users:", error);
    return [];
  }
};

/**
 * NEW FUNCTION: Update contacts with new app users
 * This updates the cached contacts when new app users are discovered
 */
const updateContactsWithNewAppUsers = async (
  newAppUsers: AppUser[]
): Promise<void> => {
  // Load cached contacts
  const cachedContacts =
    (await loadFromStorage<Contact[]>(STORAGE_KEYS.CONTACTS)) || [];
  let updated = false;
  const updatedContacts: Contact[] = [];

  // Create a map for faster lookups
  const phoneToAppUser = new Map<string, AppUser>();
  newAppUsers.forEach((user) => {
    phoneToAppUser.set(user.phoneNumber, user);
  });

  // Update contacts that match new app users
  cachedContacts.forEach((contact) => {
    const matchingAppUser = phoneToAppUser.get(contact.phoneNumber);
    if (matchingAppUser && !contact.hasApp) {
      contact.hasApp = true;
      contact.userId = matchingAppUser.id;
      updated = true;
      updatedContacts.push(contact);
    }
  });

  // Save updated contacts if changes were made
  if (updated) {
    await saveToStorage(STORAGE_KEYS.CONTACTS, cachedContacts);
    contactsEventEmitter.emit("contactsUpdated", {
      contacts: cachedContacts,
      updatedContacts: updatedContacts,
    });
  }
};

/**
 * Checks if a phone number exists in the user's contacts
 * @param phoneNumber The phone number to check
 * @returns True if the phone number exists in contacts
 */
export const checkPhoneInContacts = async (
  phoneNumber: string
): Promise<boolean> => {
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
          const contactNumber = formatPhoneNumber(phoneNumberObj.number || "");
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
};

export const sendInviteSMS = async (
  phoneNumber: string,
  contactName: string
): Promise<boolean> => {
  try {
    const isAvailable = await SMS.isAvailableAsync();
    const message = `Hi ${contactName}, I'm using Tassenger to manage tasks and chat. Join me by downloading the app: https://tassenger.app/download`;

    if (isAvailable) {
      // Use expo-sms if available
      const { result } = await SMS.sendSMSAsync([phoneNumber], message);
      return result === "sent";
    } else {
      // Fallback to Linking API
      let url = "";

      if (Platform.OS === "ios") {
        url = `sms:${phoneNumber}&body=${encodeURIComponent(message)}`;
      } else {
        url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        console.warn("Cannot open SMS app");
        return false;
      }
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
};

// Force refresh contacts and app users cache
export const refreshContacts = async (): Promise<Contact[]> => {
  return getContacts(true);
};
