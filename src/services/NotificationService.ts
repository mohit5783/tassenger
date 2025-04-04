import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Task } from "../store/slices/taskSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Add these constants for the notification settings
const NOTIFICATIONS_KEY = "tassenger_notifications";
const SOUND_KEY = "tassenger_notification_sound";

/**
 * Sets up notification channels for Android using Expo's API
 */
export async function setupNotificationChannelsExpo() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });

    await Notifications.setNotificationChannelAsync("task-reminders", {
      name: "Task Reminders",
      description: "Notifications for task due dates and reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("messages", {
      name: "Messages",
      description: "Notifications for new messages",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100, 100, 100],
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("updates", {
      name: "Updates",
      description: "General app updates and announcements",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
  }
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => {
    // Check if notifications are enabled
    const notificationsEnabled = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    if (notificationsEnabled === "false") {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    // Check if sound is enabled
    const soundEnabled = await AsyncStorage.getItem(SOUND_KEY);
    const shouldPlaySound = soundEnabled !== "false";

    return {
      shouldShowAlert: true,
      shouldPlaySound,
      shouldSetBadge: true,
    };
  },
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return null;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;

  return token;
}

export async function scheduleTaskReminder(task: Task) {
  if (!task.dueDate) return null;

  const dueDate = new Date(task.dueDate);
  const reminderDate = new Date(dueDate);
  reminderDate.setHours(reminderDate.getHours() - 1); // Remind 1 hour before due date

  // Don't schedule if the reminder time is in the past
  if (reminderDate <= new Date()) return null;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Task Reminder",
      body: `"${task.title}" is due in 1 hour`,
      data: { taskId: task.id },
    },
    trigger: null,
  });

  return identifier;
}

/**
 * Schedule a custom reminder for a task with specific time before due date
 * @param task The task to schedule a reminder for
 * @param timeOffset Object containing days, hours, and minutes before due date
 * @returns Notification identifier or null if scheduling failed
 */
export async function scheduleCustomTaskReminder(
  task: Task,
  timeOffset: { days?: number; hours?: number; minutes?: number }
) {
  if (!task.dueDate) return null;

  const dueDate = new Date(task.dueDate);
  const reminderDate = new Date(dueDate);

  // Apply the time offset
  if (timeOffset.days) {
    reminderDate.setDate(reminderDate.getDate() - timeOffset.days);
  }

  if (timeOffset.hours) {
    reminderDate.setHours(reminderDate.getHours() - timeOffset.hours);
  }

  if (timeOffset.minutes) {
    reminderDate.setMinutes(reminderDate.getMinutes() - timeOffset.minutes);
  }

  // Don't schedule if the reminder time is in the past
  if (reminderDate <= new Date()) return null;

  // Create a human-readable description of the reminder time
  let timeDescription = "";
  if (timeOffset.days && timeOffset.days > 0) {
    timeDescription += `${timeOffset.days} day${
      timeOffset.days > 1 ? "s" : ""
    } `;
  }
  if (timeOffset.hours && timeOffset.hours > 0) {
    timeDescription += `${timeOffset.hours} hour${
      timeOffset.hours > 1 ? "s" : ""
    } `;
  }
  if (timeOffset.minutes && timeOffset.minutes > 0) {
    timeDescription += `${timeOffset.minutes} minute${
      timeOffset.minutes > 1 ? "s" : ""
    } `;
  }

  // If no offset was provided, assume it's at the time of the task
  if (!timeDescription) {
    timeDescription = "now";
  } else {
    timeDescription += "before";
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Task Reminder",
      body: `"${task.title}" is due ${timeDescription}`,
      data: { taskId: task.id },
    },
    trigger: null,
  });

  return identifier;
}

export async function cancelTaskReminder(identifier: string) {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function cancelAllTaskReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
