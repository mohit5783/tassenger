import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Task } from "../store/slices/taskSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../api/firebase/config";

// Add these constants for the notification settings
const NOTIFICATIONS_KEY = "tassenger_notifications";
const SOUND_KEY = "tassenger_notification_sound";
const NOTIFICATION_PREFERENCES_KEY = "tassenger_notification_preferences";
const MAX_RETRY_COUNT = 3;

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFERENCES = {
  enabled: true,
  sound: true,
  taskAssigned: true,
  taskUpdated: true,
  taskReminder: true,
  taskApproachingDeadline: true,
  taskRecurring: true,
  messageReceived: true,
  messageRead: true,
  groupMention: true,
  onboarding: true,
  muted: {
    tasks: [], // Array of task IDs to mute
    chats: [], // Array of conversation IDs to mute
    groups: [], // Array of group IDs to mute
  },
};

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

    await Notifications.setNotificationChannelAsync("task-updates", {
      name: "Task Updates",
      description: "Notifications for task updates and changes",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 100, 100, 100],
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("messages", {
      name: "Messages",
      description: "Notifications for new messages",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100, 100, 100],
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("read-receipts", {
      name: "Read Receipts",
      description: "Notifications when your messages are read",
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
    });

    await Notifications.setNotificationChannelAsync("onboarding", {
      name: "Onboarding",
      description: "Welcome and feature discovery notifications",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("updates", {
      name: "Updates",
      description: "General app updates and announcements",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
    });
  }
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Check if notifications are enabled
    const notificationsEnabled = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    if (notificationsEnabled === "false") {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    // Get notification preferences
    const preferencesJson = await AsyncStorage.getItem(
      NOTIFICATION_PREFERENCES_KEY
    );
    const preferences = preferencesJson
      ? JSON.parse(preferencesJson)
      : DEFAULT_NOTIFICATION_PREFERENCES;

    // Check if this notification type is enabled
    const notificationType =
      notification.request.content.data?.type || "default";
    if (preferences[notificationType] === false) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    // Check if this specific item is muted
    const itemId = notification.request.content.data?.itemId;
    const itemType = notification.request.content.data?.itemType;

    if (
      itemId &&
      itemType &&
      preferences.muted &&
      preferences.muted[`${itemType}s`]?.includes(itemId)
    ) {
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
      sound: "default",
      data: {
        taskId: task.id,
        type: "taskReminder",
        itemId: task.id,
        itemType: "task",
      },
      // Add snooze action
      ...(Platform.OS === "android" && {
        actions: [
          {
            buttonTitle: "Snooze",
            identifier: "snooze",
            options: {
              isDismissable: true,
            },
          },
        ],
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
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

  // Create a simple identifier without UUID
  const identifier = `reminder_${task.id}_${Date.now()}_${Math.floor(
    Math.random() * 10000
  )}`;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder",
        body: `"${task.title}" is due ${timeDescription}`,
        sound: "default",
        data: {
          taskId: task.id,
          type: "taskReminder",
          itemId: task.id,
          itemType: "task",
        },
        // Add snooze action
        ...(Platform.OS === "android" && {
          actions: [
            {
              buttonTitle: "Snooze",
              identifier: "snooze",
              options: {
                isDismissable: true,
              },
            },
          ],
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
      identifier: identifier, // Use our custom identifier
    });

    return identifier;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
}

/**
 * Schedule a notification for a task approaching its deadline
 * @param task The task that's approaching its deadline
 * @param leadTime The lead time in hours before the deadline
 */
export async function scheduleApproachingDeadlineNotification(
  task: Task,
  leadTime = 24
) {
  if (!task.dueDate) return null;

  const dueDate = new Date(task.dueDate);
  const notificationDate = new Date(dueDate);
  notificationDate.setHours(notificationDate.getHours() - leadTime);

  // Don't schedule if the notification time is in the past
  if (notificationDate <= new Date()) return null;

  const identifier = `deadline_${task.id}_${leadTime}`;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Deadline Approaching",
        body: `"${task.title}" is due in ${leadTime} hours`,
        sound: "default",
        data: {
          taskId: task.id,
          type: "taskApproachingDeadline",
          itemId: task.id,
          itemType: "task",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate,
      },
      identifier: identifier,
    });

    return identifier;
  } catch (error) {
    console.error("Error scheduling deadline notification:", error);
    return null;
  }
}

export async function cancelTaskReminder(identifier: string) {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function cancelAllTaskReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Sends a push notification to a user
 * @param userId The ID of the user to send the notification to
 * @param title The title of the notification
 * @param message The message of the notification
 * @param data Additional data to include with the notification
 * @param retryCount Number of retry attempts (internal use)
 */
export const sendPushNotification = async (
  userId: string,
  title: string,
  message: string,
  data: any = {},
  retryCount = 0
): Promise<string | null> => {
  try {
    // Get the user's push token from Firestore
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error("User not found");
      return null;
    }

    const userData = userSnap.data();
    const pushToken = userData.pushToken;

    if (!pushToken) {
      console.warn("User does not have a push token");
      return null;
    }

    // Check user's notification preferences
    const notificationType = data.type || "default";
    const userPreferencesRef = doc(
      db,
      "users",
      userId,
      "preferences",
      "notifications"
    );
    const userPreferencesSnap = await getDoc(userPreferencesRef);

    let shouldSend = true;
    if (userPreferencesSnap.exists()) {
      const preferences = userPreferencesSnap.data();

      // Check if this notification type is enabled
      if (preferences[notificationType] === false) {
        shouldSend = false;
      }

      // Check if this specific item is muted
      const itemId = data.itemId;
      const itemType = data.itemType;

      if (
        itemId &&
        itemType &&
        preferences.muted &&
        preferences.muted[`${itemType}s`]?.includes(itemId)
      ) {
        shouldSend = false;
      }
    }

    if (!shouldSend) {
      console.log(
        `Notification suppressed due to user preferences: ${notificationType}`
      );
      return null;
    }

    // Send the push notification using Expo's API
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        sound: "default",
        data: { userId, ...data },
      },
      trigger: null, // Send immediately
    });

    // Store the notification in Firestore
    const notificationRef = await addDoc(
      collection(db, "users", userId, "notifications"),
      {
        title,
        message,
        read: false,
        time: new Date().toISOString(),
        userId,
        ...data,
      }
    );

    console.log("Notification sent and stored:", notificationRef.id);
    return notificationRef.id;
  } catch (error) {
    console.error("Error sending push notification:", error);

    // Implement retry mechanism
    if (retryCount < MAX_RETRY_COUNT) {
      console.log(
        `Retrying notification (attempt ${
          retryCount + 1
        }/${MAX_RETRY_COUNT})...`
      );
      // Exponential backoff: wait longer between each retry
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendPushNotification(userId, title, message, data, retryCount + 1);
    } else {
      console.error(
        `Failed to send notification after ${MAX_RETRY_COUNT} attempts`
      );
      // Log the failure for monitoring
      try {
        await addDoc(collection(db, "notificationFailures"), {
          userId,
          title,
          message,
          data,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        });
      } catch (logError) {
        console.error("Failed to log notification failure:", logError);
      }
      return null;
    }
  }
};

/**
 * Send a notification when a task is updated
 * @param task The updated task
 * @param updatedFields Array of field names that were updated
 * @param updatedBy User ID of who updated the task
 */
export const sendTaskUpdateNotification = async (
  task: Task,
  updatedFields: string[],
  updatedBy: string
) => {
  // Don't notify the person who made the update
  if (task.assignedTo && task.assignedTo !== updatedBy) {
    const fieldLabels = {
      title: "title",
      description: "description",
      status: "status",
      priority: "priority",
      dueDate: "due date",
      assignedTo: "assignee",
    };

    // Create a readable list of updated fields
    const updatedFieldsText = updatedFields
      .map((field) => fieldLabels[field as keyof typeof fieldLabels] || field)
      .join(", ");

    await sendPushNotification(
      task.assignedTo,
      "Task Updated",
      `Task "${task.title}" has been updated (${updatedFieldsText})`,
      {
        type: "taskUpdated",
        itemId: task.id,
        itemType: "task",
        updatedFields,
      }
    );
  }

  // Also notify the creator if they're not the one who updated it
  if (task.createdBy !== updatedBy && task.createdBy !== task.assignedTo) {
    const fieldLabels = {
      title: "title",
      description: "description",
      status: "status",
      priority: "priority",
      dueDate: "due date",
      assignedTo: "assignee",
    };

    // Create a readable list of updated fields
    const updatedFieldsText = updatedFields
      .map((field) => fieldLabels[field as keyof typeof fieldLabels] || field)
      .join(", ");

    await sendPushNotification(
      task.createdBy,
      "Task Updated",
      `Task "${task.title}" has been updated (${updatedFieldsText})`,
      {
        type: "taskUpdated",
        itemId: task.id,
        itemType: "task",
        updatedFields,
      }
    );
  }
};

/**
 * Send a notification when a recurring task is generated
 * @param task The newly generated recurring task
 */
export const sendRecurringTaskNotification = async (task: Task) => {
  if (task.assignedTo) {
    await sendPushNotification(
      task.assignedTo,
      "New Recurring Task",
      `A new recurring task "${task.title}" has been created`,
      {
        type: "taskRecurring",
        itemId: task.id,
        itemType: "task",
      }
    );
  }
};

/**
 * Send a notification when your message has been read
 * @param messageId ID of the message that was read
 * @param conversationId ID of the conversation
 * @param readBy User ID of who read the message
 * @param senderId User ID of who sent the message
 */
export const sendMessageReadNotification = async (
  messageId: string,
  conversationId: string,
  readBy: string,
  senderId: string,
  readerName: string
) => {
  // Don't notify if the sender is the one who read the message
  if (readBy === senderId) return;

  await sendPushNotification(
    senderId,
    "Message Read",
    `${readerName} has read your message`,
    {
      type: "messageRead",
      itemId: conversationId,
      itemType: "chat",
      messageId,
      readBy,
    }
  );
};

/**
 * Send a notification when a user is mentioned in a group chat
 * @param userId User ID of the mentioned user
 * @param mentionedBy User ID of who mentioned the user
 * @param conversationId ID of the conversation
 * @param messageText Text of the message
 */
export const sendGroupMentionNotification = async (
  userId: string,
  mentionedBy: string,
  mentionerName: string,
  conversationId: string,
  conversationTitle: string,
  messageText: string
) => {
  await sendPushNotification(
    userId,
    `${mentionerName} mentioned you`,
    `In ${conversationTitle}: ${messageText}`,
    {
      type: "groupMention",
      itemId: conversationId,
      itemType: "chat",
      mentionedBy,
    }
  );
};

/**
 * Send an onboarding notification to a new user
 * @param userId User ID of the new user
 * @param notificationType Type of onboarding notification
 */
export const sendOnboardingNotification = async (
  userId: string,
  notificationType: "welcome" | "feature_discovery" | "tip",
  title: string,
  message: string
) => {
  await sendPushNotification(userId, title, message, {
    type: "onboarding",
    onboardingType: notificationType,
  });
};

/**
 * Get user notification preferences
 * @param userId User ID
 * @returns User notification preferences
 */
export const getUserNotificationPreferences = async (userId: string) => {
  try {
    const userPreferencesRef = doc(
      db,
      "users",
      userId,
      "preferences",
      "notifications"
    );
    const userPreferencesSnap = await getDoc(userPreferencesRef);

    if (userPreferencesSnap.exists()) {
      // Merge with default preferences to ensure all fields exist
      return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...userPreferencesSnap.data(),
      };
    } else {
      // If no preferences exist, create default preferences
      const defaultPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
      await setDoc(userPreferencesRef, defaultPreferences);
      return defaultPreferences;
    }
  } catch (error) {
    console.error("Error getting user notification preferences:", error);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
};

/**
 * Update user notification preferences
 * @param userId User ID
 * @param preferences Updated preferences
 */
export const updateUserNotificationPreferences = async (
  userId: string,
  preferences: any
) => {
  try {
    const userPreferencesRef = doc(
      db,
      "users",
      userId,
      "preferences",
      "notifications"
    );
    const userPreferencesSnap = await getDoc(userPreferencesRef);

    if (userPreferencesSnap.exists()) {
      await updateDoc(userPreferencesRef, preferences);
    } else {
      await setDoc(userPreferencesRef, preferences);
    }
    return true;
  } catch (error) {
    console.error("Error updating user notification preferences:", error);
    return false;
  }
};

/**
 * Mute notifications for a specific item
 * @param userId User ID
 * @param itemId ID of the item to mute
 * @param itemType Type of the item (task, chat, group)
 */
export const muteNotificationsForItem = async (
  userId: string,
  itemId: string,
  itemType: "task" | "chat" | "group"
) => {
  try {
    const userPreferencesRef = doc(
      db,
      "users",
      userId,
      "preferences",
      "notifications"
    );
    const userPreferencesSnap = await getDoc(userPreferencesRef);

    const preferences = userPreferencesSnap.exists()
      ? userPreferencesSnap.data()
      : DEFAULT_NOTIFICATION_PREFERENCES;

    // Initialize muted array if it doesn't exist
    if (!preferences.muted) {
      preferences.muted = {
        tasks: [],
        chats: [],
        groups: [],
      };
    }

    // Add the item to the appropriate muted array if it's not already there
    const arrayName = `${itemType}s`;
    if (!preferences.muted[arrayName].includes(itemId)) {
      preferences.muted[arrayName].push(itemId);
      await updateDoc(userPreferencesRef, { muted: preferences.muted });
    }

    return true;
  } catch (error) {
    console.error(`Error muting ${itemType} ${itemId}:`, error);
    return false;
  }
};

/**
 * Unmute notifications for a specific item
 * @param userId User ID
 * @param itemId ID of the item to unmute
 * @param itemType Type of the item (task, chat, group)
 */
export const unmuteNotificationsForItem = async (
  userId: string,
  itemId: string,
  itemType: "task" | "chat" | "group"
) => {
  try {
    const userPreferencesRef = doc(
      db,
      "users",
      userId,
      "preferences",
      "notifications"
    );
    const userPreferencesSnap = await getDoc(userPreferencesRef);

    if (!userPreferencesSnap.exists()) return true; // Nothing to unmute

    const preferences = userPreferencesSnap.data();

    // If muted array doesn't exist, nothing to unmute
    if (!preferences.muted) return true;

    // Remove the item from the appropriate muted array
    const arrayName = `${itemType}s`;
    if (preferences.muted[arrayName]?.includes(itemId)) {
      preferences.muted[arrayName] = preferences.muted[arrayName].filter(
        (id: string) => id !== itemId
      );
      await updateDoc(userPreferencesRef, { muted: preferences.muted });
    }

    return true;
  } catch (error) {
    console.error(`Error unmuting ${itemType} ${itemId}:`, error);
    return false;
  }
};
