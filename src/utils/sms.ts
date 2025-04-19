import * as SMS from "expo-sms";
import { Linking, Platform } from "react-native";

/**
 * Sends an SMS invitation using either expo-sms or Linking API
 * @param phoneNumber The phone number to send the SMS to
 * @param contactName The name of the contact to include in the message
 * @returns True if the SMS was sent successfully
 */
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
