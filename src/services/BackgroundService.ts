import { AppState, type AppStateStatus } from "react-native";
import { store } from "../store";
import { checkForNewAppUsers } from "../store/slices/contactsSlice";

// Time constants
const CHECK_INTERVAL_ACTIVE = 5 * 60 * 1000; // 5 minutes when app is active
const CHECK_INTERVAL_BACKGROUND = 30 * 60 * 1000; // 30 minutes when app is in background
const MIN_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes minimum between checks

let lastCheckTime = 0;
let checkInterval: NodeJS.Timeout | null = null;
let appStateSubscription: any = null;

/**
 * Start the background service that periodically checks for new app users
 */
export const startBackgroundService = () => {
  // Set up app state change listener
  appStateSubscription = AppState.addEventListener(
    "change",
    handleAppStateChange
  );

  // Start the check interval
  scheduleNextCheck(CHECK_INTERVAL_ACTIVE);
};

/**
 * Stop the background service
 */
export const stopBackgroundService = () => {
  // Remove app state change listener
  if (appStateSubscription) {
    appStateSubscription.remove();
  }

  // Clear the check interval
  if (checkInterval) {
    clearTimeout(checkInterval);
    checkInterval = null;
  }
};

/**
 * Handle app state changes
 */
const handleAppStateChange = (state: AppStateStatus) => {
  if (state === "active") {
    // App came to foreground, check for new users if enough time has passed
    const now = Date.now();
    if (now - lastCheckTime > MIN_CHECK_INTERVAL) {
      checkForNewUsers();
    }

    // Reset check interval to more frequent checks
    scheduleNextCheck(CHECK_INTERVAL_ACTIVE);
  } else if (state === "background") {
    // App went to background, set longer check interval
    scheduleNextCheck(CHECK_INTERVAL_BACKGROUND);
  }
};

/**
 * Schedule the next check for new app users
 */
const scheduleNextCheck = (interval: number) => {
  if (checkInterval) {
    clearTimeout(checkInterval);
  }

  checkInterval = setTimeout(() => {
    checkForNewUsers();
    scheduleNextCheck(interval);
  }, interval);
};

/**
 * Check for new app users
 */
const checkForNewUsers = async () => {
  try {
    // Only check if we're logged in
    const state = store.getState();
    if (state.auth.user) {
      await store.dispatch(checkForNewAppUsers()).unwrap();
      lastCheckTime = Date.now();
    }
  } catch (error) {
    console.error("Error checking for new app users:", error);
  }
};
