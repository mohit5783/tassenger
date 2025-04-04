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

export const getContacts = async (forceRefresh = false): Promise<Contact[]> => {
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
      throw new Error("Contacts permission not granted");
    }
  }

  // Check if we have cached contacts and they're not stale
  if (!forceRefresh) {
    contactsEventEmitter.emit("progress", {
      message: "Checking cached contacts...",
    });
    const isContactsStale = await isDataStale(
      STORAGE_KEYS.CONTACTS_LAST_UPDATED,
      24
    ); // 24 hours

    if (!isContactsStale) {
      const cachedContacts = await loadFromStorage<Contact[]>(
        STORAGE_KEYS.CONTACTS
      );
      if (cachedContacts && cachedContacts.length > 0) {
        contactsEventEmitter.emit("progress", {
          message: "Using cached contacts",
        });
        return cachedContacts;
      }
    }
  }

  // If we get here, we need to load contacts from the device
  contactsEventEmitter.emit("progress", { message: "Loading contacts..." });

  // Use pagination to handle large contact lists
  const pageSize = 100;
  let pageOffset = 0;
  let allContacts: Contacts.Contact[] = [];
  let hasMoreContacts = true;
  let pageCount = 0;

  // Fetch contacts in batches to handle large contact lists
  while (hasMoreContacts) {
    pageCount++;
    contactsEventEmitter.emit("progress", {
      message: `Loading contacts (page ${pageCount})...`,
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

    allContacts = [...allContacts, ...data];
    hasMoreContacts = hasNextPage;
    pageOffset += pageSize;

    // Safety limit to prevent infinite loops
    if (pageOffset > 10000) {
      break;
    }
  }

  if (allContacts.length === 0) {
    return [];
  }

  // Update progress
  contactsEventEmitter.emit("progress", { message: "Processing contacts..." });

  // Extract phone numbers and names
  const contacts: Contact[] = [];
  const phoneNumberSet = new Set<string>(); // To track unique phone numbers

  allContacts.forEach((contact) => {
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      // Get the first phone number
      const phoneNumber = formatPhoneNumber(
        contact.phoneNumbers[0].number || ""
      );

      if (phoneNumber && !phoneNumberSet.has(phoneNumber)) {
        phoneNumberSet.add(phoneNumber);

        const newContact: Contact = {
          id: contact.id || `phone-${phoneNumber}`, // Ensure id is always a string
          name: contact.name || "Unknown",
          phoneNumber,
          hasApp: false,
          email:
            contact.emails && contact.emails.length > 0
              ? contact.emails[0].email
              : undefined,
          photoURL:
            contact.imageAvailable && contact.image
              ? contact.image.uri
              : undefined,
        };
        contacts.push(newContact);
      }
    }
  });

  // NEW APPROACH: Fetch all app users and match locally
  contactsEventEmitter.emit("progress", { message: "Fetching app users..." });

  // Get app users (either from cache or Firestore)
  const appUsers = await getAppUsers(forceRefresh);

  // Match contacts with app users
  contactsEventEmitter.emit("progress", {
    message: "Matching contacts with app users...",
  });

  // Create a map of phone numbers to app users for faster lookup
  const appUserMap = new Map<string, AppUser>();
  appUsers.forEach((user) => {
    appUserMap.set(user.phoneNumber, user);
  });

  // Match contacts with app users
  let appUsersFound = 0;
  contacts.forEach((contact) => {
    const appUser = appUserMap.get(contact.phoneNumber);
    if (appUser) {
      contact.hasApp = true;
      contact.userId = appUser.id;
      appUsersFound++;
    }
  });

  // Update progress
  contactsEventEmitter.emit("progress", { message: "Sorting contacts..." });

  // Sort contacts: app users first, then alphabetically
  const sortedContacts = contacts.sort((a, b) => {
    if (a.hasApp && !b.hasApp) return -1;
    if (!a.hasApp && b.hasApp) return 1;
    return a.name.localeCompare(b.name);
  });

  // Cache the contacts
  await saveToStorage(STORAGE_KEYS.CONTACTS, sortedContacts);
  await updateTimestamp(STORAGE_KEYS.CONTACTS_LAST_UPDATED);

  contactsEventEmitter.emit("progress", {
    message: "Contacts loaded successfully",
  });

  return sortedContacts;
};

/**
 * Get all app users, either from cache or from Firestore
 */
const getAppUsers = async (forceRefresh = false): Promise<AppUser[]> => {
  // Check if we have cached app users and they're not stale
  if (!forceRefresh) {
    const isAppUsersCacheStale = await isDataStale(
      STORAGE_KEYS.APP_USERS_TIMESTAMP,
      12
    ); // 12 hours

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

    return appUsers;
  } catch (error) {
    console.error("Error fetching app users:", error);
    return [];
  }
};

/**
 * Get only new app users since the last fetch
 * This can be used for delta syncs
 */
const getNewAppUsers = async (): Promise<AppUser[]> => {
  const cachedAppUsers = await loadFromStorage<AppUserCache>(
    STORAGE_KEYS.APP_USERS
  );
  if (!cachedAppUsers) {
    // If no cache exists, fetch all app users
    return getAppUsers(true);
  }

  try {
    // Fetch only new app users since the last fetch
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("createdAt", ">", cachedAppUsers.timestamp),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

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

    if (newAppUsers.length > 0) {
      // Update the cache with new app users
      cachedAppUsers.users = [...newAppUsers, ...cachedAppUsers.users];
      cachedAppUsers.timestamp = Date.now();

      await saveToStorage(STORAGE_KEYS.APP_USERS, cachedAppUsers);
      await updateTimestamp(STORAGE_KEYS.APP_USERS_TIMESTAMP);
    }

    return cachedAppUsers.users;
  } catch (error) {
    console.error("Error fetching new app users:", error);
    return cachedAppUsers.users;
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
