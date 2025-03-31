// import messaging from "@react-native-firebase/messaging" // Commented out for Expo Go compatibility
// import notifee from "@notifee/react-native" // Commented out for Expo Go compatibility
import { USE_STUB_NOTIFICATIONS } from "../config/featureFlags";
import * as Notifications from "expo-notifications";

// ========== STUB IMPLEMENTATION ==========
const stubMessaging = {
  async requestUserPermission(): Promise<boolean> {
    console.log("[STUB] Would request FCM permission");
    return true;
  },

  async getFCMToken(): Promise<string | null> {
    console.log("[STUB] Would get FCM token");
    return "fcm-token-stub-12345";
  },

  setupFCMListeners(navigation: any): () => void {
    console.log("[STUB] Would set up FCM listeners");

    // Return unsubscribe function
    return () => {
      console.log("[STUB] Would unsubscribe from FCM listeners");
    };
  },
};

// ========== REAL IMPLEMENTATION ==========
// This would be the actual implementation using Firebase Messaging
// TODO: Implement real messaging service when ready to integrate native modules
const realMessaging = {
  async requestUserPermission(): Promise<boolean> {
    // TODO: Implement with actual Firebase Messaging
    return stubMessaging.requestUserPermission();
  },

  async getFCMToken(): Promise<string | null> {
    // TODO: Implement with actual Firebase Messaging
    return stubMessaging.getFCMToken();
  },

  setupFCMListeners(navigation: any): () => void {
    // TODO: Implement with actual Firebase Messaging
    return stubMessaging.setupFCMListeners(navigation);
  },
};

// Export the appropriate implementation based on the feature flag
const MessagingService = USE_STUB_NOTIFICATIONS ? stubMessaging : realMessaging;

// Convenience exports for commonly used functions
export const { requestUserPermission, getFCMToken, setupFCMListeners } =
  MessagingService;

// Expo-compatible implementation for displaying notifications
export async function displayPushNotification(remoteMessage: any) {
  const { notification, data } = remoteMessage;

  if (!notification) return;

  // Use Expo Notifications for Expo Go compatibility
  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: data,
    },
    trigger: null, // Show immediately
  });
}

export function handleNotificationNavigation(
  remoteMessage: any,
  navigation: any
) {
  const { data } = remoteMessage;

  if (data?.taskId) {
    navigation.navigate("Tasks", {
      screen: "TaskDetail",
      params: { taskId: data.taskId },
    });
  } else if (data?.groupId) {
    navigation.navigate("Groups", {
      screen: "GroupDetail",
      params: { groupId: data.groupId },
    });
  } else if (data?.conversationId) {
    navigation.navigate("Chat", {
      screen: "ConversationDetail",
      params: { conversationId: data.conversationId },
    });
  }
}
