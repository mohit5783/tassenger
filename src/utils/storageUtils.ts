import AsyncStorage from "@react-native-async-storage/async-storage";

// Keys for AsyncStorage
export const STORAGE_KEYS = {
  CONTACTS: "tassenger_contacts",
  APP_USERS: "tassenger_app_users",
  APP_USERS_TIMESTAMP: "tassenger_app_users_timestamp",
  CONTACTS_LAST_UPDATED: "tassenger_contacts_last_updated",
};

// Save data to AsyncStorage
export const saveToStorage = async (key: string, data: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error saving to storage (${key}):`, error);
  }
};

// Load data from AsyncStorage\
export const loadFromStorage = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error loading from storage (${key}):`, error);
    return null;
  }
};

// Check if data is stale (older than specified hours)
export const isDataStale = async (
  key: string,
  staleHours = 24
): Promise<boolean> => {
  try {
    const timestamp = await AsyncStorage.getItem(key);
    if (!timestamp) return true;

    const lastUpdated = Number.parseInt(timestamp, 10);
    const now = Date.now();
    const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);

    return hoursSinceUpdate > staleHours;
  } catch (error) {
    console.error(`Error checking if data is stale (${key}):`, error);
    return true;
  }
};

// Update timestamp for a specific key
export const updateTimestamp = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, Date.now().toString());
  } catch (error) {
    console.error(`Error updating timestamp (${key}):`, error);
  }
};
