import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Task } from "../store/slices/taskSlice";
import Constants from "expo-constants";
// import notifee, { AndroidImportance } from "@notifee/react-native" // Commented out for Expo Go compatibility
import { USE_STUB_NOTIFICATIONS } from "../config/featureFlags";

// Type definitions to match the real API
type NotificationPermission = "granted" | "denied" | "unavailable";
type ReminderTimeBeforeDue = {
  days?: number;
  hours?: number;
  minutes?: number;
};

// Configure notifications with fallback for Expo Go limitations
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ========== STUB IMPLEMENTATION ==========
const stubNotifications = {
  // Permission handling
  async requestPermissions(): Promise<NotificationPermission> {
    console.log("[STUB] Would request notification permissions");
    return "granted";
  },

  async getPermissions(): Promise<NotificationPermission> {
    console.log("[STUB] Would check notification permissions");
    return "granted";
  },

  // Channel setup (Android)
  async setupNotificationChannels(): Promise<void> {
    console.log("[STUB] Would set up notification channels on Android");
    // In real implementation, this would use notifee.createChannel
  },

  // Token registration for push notifications
  async registerForPushNotifications(): Promise<string | null> {
    console.log("[STUB] Would register for push notifications");
    return "expo-push-token-stub-12345";
  },

  // Task reminders
  async scheduleTaskReminder(task: Task): Promise<string | null> {
    console.log(`[STUB] Would schedule reminder for task: ${task.title}`);
    return `reminder-${Math.random().toString(36).substring(2, 9)}`;
  },

  async scheduleCustomTaskReminder(
    task: Task,
    timeBeforeDue: ReminderTimeBeforeDue
  ): Promise<string | null> {
    const { days = 0, hours = 0, minutes = 0 } = timeBeforeDue;
    console.log(
      `[STUB] Would schedule custom reminder for task: ${task.title} (${days}d ${hours}h ${minutes}m before due)`
    );
    return `custom-reminder-${Math.random().toString(36).substring(2, 9)}`;
  },

  async cancelTaskReminder(identifier: string): Promise<void> {
    console.log(`[STUB] Would cancel reminder with ID: ${identifier}`);
  },

  async cancelAllTaskReminders(): Promise<void> {
    console.log("[STUB] Would cancel all reminders");
  },
};

// ========== REAL IMPLEMENTATION ==========
// This would be the actual implementation using Notifee and Expo Notifications
// TODO: Implement real notification service when ready to integrate native modules
const realNotifications = {
  // We'll implement these when we're ready to use real notifications
  async requestPermissions(): Promise<NotificationPermission> {
    console.log("[REAL] Would request notification permissions");
    // TODO: Implement with actual Notifications API
    return "granted";
  },

  async getPermissions(): Promise<NotificationPermission> {
    console.log("[REAL] Would check notification permissions");
    // TODO: Implement with actual Notifications API
    return "granted";
  },

  async setupNotificationChannels(): Promise<void> {
    console.log("[REAL] Would set up notification channels on Android");
    // TODO: Implement with actual Notifee API
    if (Platform.OS === "android") {
      // Create channels when implemented
      // Will use notifee.createChannel when ejected from Expo
    }
  },

  async registerForPushNotifications(): Promise<string | null> {
    console.log("[REAL] Would register for push notifications");
    // TODO: Implement with actual Expo Notifications API
    return null;
  },

  async scheduleTaskReminder(task: Task): Promise<string | null> {
    console.log(`[REAL] Would schedule reminder for task: ${task.title}`);
    // TODO: Implement with actual Notifee API
    return null;
  },

  async scheduleCustomTaskReminder(
    task: Task,
    timeBeforeDue: ReminderTimeBeforeDue
  ): Promise<string | null> {
    const { days = 0, hours = 0, minutes = 0 } = timeBeforeDue;
    console.log(
      `[REAL] Would schedule custom reminder for task: ${task.title} (${days}d ${hours}h ${minutes}m before due)`
    );
    // TODO: Implement with actual Notifee API
    return null;
  },

  async cancelTaskReminder(identifier: string): Promise<void> {
    console.log(`[REAL] Would cancel reminder with ID: ${identifier}`);
    // TODO: Implement with actual Notifee API
  },

  async cancelAllTaskReminders(): Promise<void> {
    console.log("[REAL] Would cancel all reminders");
    // TODO: Implement with actual Notifee API
  },
};

// Export the appropriate implementation based on the feature flag
export const NotificationService = USE_STUB_NOTIFICATIONS
  ? stubNotifications
  : realNotifications;

// Convenience exports for commonly used functions
export const {
  requestPermissions,
  getPermissions,
  registerForPushNotifications,
} = NotificationService;

export const setupNotificationChannels =
  NotificationService.setupNotificationChannels;
export const scheduleTaskReminder = NotificationService.scheduleTaskReminder;
export const scheduleCustomTaskReminder =
  NotificationService.scheduleCustomTaskReminder;
export const cancelTaskReminder = NotificationService.cancelTaskReminder;
export const cancelAllTaskReminders =
  NotificationService.cancelAllTaskReminders;

// Expo-compatible implementation for registerForPushNotificationsAsync
export async function registerForPushNotificationsAsync() {
  let token;

  try {
    // Check if we're running in Expo Go
    const isExpoGo =
      !Constants.appOwnership || Constants.appOwnership === "expo";

    if (isExpoGo) {
      console.log(
        "Running in Expo Go - push notifications have limited functionality"
      );
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }

    // Only try to get token if not in Expo Go
    if (!isExpoGo) {
      try {
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: Constants?.expoConfig?.extra?.eas?.projectId,
          })
        ).data;
      } catch (e) {
        console.log("Error getting push token:", e);
      }
    }
  } catch (e) {
    console.log("Error in notification permissions:", e);
  }

  return token;
}

// Expo-compatible implementations for the other functions
// These will be replaced by the real implementations when ejecting from Expo

export async function setupNotificationChannelsExpo() {
  if (Platform.OS === "android") {
    // Create a default channel using Expo's API
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default Channel",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });

    // Create a task reminders channel
    await Notifications.setNotificationChannelAsync("task-reminders", {
      name: "Task Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  }
}

export async function scheduleTaskReminderExpo(task: Task) {
  if (!task.dueDate) return null;

  try {
    const dueDate = new Date(task.dueDate);
    const reminderDate = new Date(dueDate);
    reminderDate.setHours(reminderDate.getHours() - 1); // Remind 1 hour before due date

    // Don't schedule if the reminder time is in the past
    if (reminderDate <= new Date()) return null;

    // Use Expo Notifications for Expo Go compatibility
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder",
        body: `"${task.title}" is due in 1 hour`,
        data: { taskId: task.id },
      },
      // trigger: {
      //   date: reminderDate,
      // },
      trigger: null, // Trigger kepts null bcoz all other setting are giving error
    });

    return identifier;
  } catch (e) {
    console.log("Error scheduling notification:", e);
    return null;
  }
}

export async function scheduleCustomTaskReminderExpo(
  task: Task,
  timeBeforeDue: { days?: number; hours?: number; minutes?: number }
) {
  if (!task.dueDate) return null;

  try {
    const dueDate = new Date(task.dueDate);
    const reminderDate = new Date(dueDate);

    // Calculate time before due date
    if (timeBeforeDue.days)
      reminderDate.setDate(reminderDate.getDate() - timeBeforeDue.days);
    if (timeBeforeDue.hours)
      reminderDate.setHours(reminderDate.getHours() - timeBeforeDue.hours);
    if (timeBeforeDue.minutes)
      reminderDate.setMinutes(
        reminderDate.getMinutes() - timeBeforeDue.minutes
      );

    // Don't schedule if the reminder time is in the past
    if (reminderDate <= new Date()) return null;

    // Format the time difference for the notification message
    let timeMessage = "";
    if (timeBeforeDue.days)
      timeMessage += `${timeBeforeDue.days} day${
        timeBeforeDue.days > 1 ? "s" : ""
      } `;
    if (timeBeforeDue.hours)
      timeMessage += `${timeBeforeDue.hours} hour${
        timeBeforeDue.hours > 1 ? "s" : ""
      } `;
    if (timeBeforeDue.minutes)
      timeMessage += `${timeBeforeDue.minutes} minute${
        timeBeforeDue.minutes > 1 ? "s" : ""
      } `;

    // Use Expo Notifications for Expo Go compatibility
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder",
        body: `"${task.title}" is due in ${timeMessage.trim()}`,
        data: { taskId: task.id },
      },
      trigger: null // Trigger kepts null bcoz all other are giving error
    });

    return identifier;
  } catch (e) {
    console.log("Error scheduling custom notification:", e);
    return null;
  }
}

export async function cancelTaskReminderExpo(identifier: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (e) {
    console.log("Error canceling notification:", e);
  }
}

export async function cancelAllTaskRemindersExpo() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.log("Error canceling all notifications:", e);
  }
}
