// This file would be used in your backend service, not in the React Native app
// It's included here for reference on how to send push notifications

import admin from "firebase-admin";

// Initialize Firebase Admin SDK (this should be done once in your backend)
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
// });

/**
 * Send a push notification to a specific user
 * @param userId The user ID to send the notification to
 * @param title The notification title
 * @param body The notification body
 * @param data Additional data to send with the notification
 */
export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  try {
    // Get the user's FCM token from your database
    // const userRef = admin.firestore().collection('users').doc(userId);
    // const userDoc = await userRef.get();
    // const fcmToken = userDoc.data()?.fcmToken;

    // For demonstration purposes, we'll assume we have the token
    const fcmToken = "user-fcm-token";

    if (!fcmToken) {
      console.log(`No FCM token found for user ${userId}`);
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
    return response;
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
}

/**
 * Send a push notification to multiple users
 * @param userIds Array of user IDs to send the notification to
 * @param title The notification title
 * @param body The notification body
 * @param data Additional data to send with the notification
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  try {
    // Get the FCM tokens for all users
    // const usersSnapshot = await admin.firestore().collection('users')
    //   .where('id', 'in', userIds)
    //   .get();

    // const tokens: string[] = [];
    // usersSnapshot.forEach(doc => {
    //   const fcmToken = doc.data()?.fcmToken;
    //   if (fcmToken) tokens.push(fcmToken);
    // });

    // For demonstration purposes, we'll assume we have the tokens
    const tokens = ["token1", "token2", "token3"];

    if (tokens.length === 0) {
      console.log("No FCM tokens found for the specified users");
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens,
    };

    // Fix: Use sendEachForMulticast instead of sendMulticast
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`${response.successCount} messages were sent successfully`);
    return response;
  } catch (error) {
    console.error("Error sending push notifications:", error);
    throw error;
  }
}

/**
 * Send a push notification to a topic
 * @param topic The topic to send the notification to
 * @param title The notification title
 * @param body The notification body
 * @param data Additional data to send with the notification
 */
export async function sendPushNotificationToTopic(
  topic: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      topic,
    };

    const response = await admin.messaging().send(message);
    console.log("Successfully sent message to topic:", response);
    return response;
  } catch (error) {
    console.error("Error sending push notification to topic:", error);
    throw error;
  }
}
