"use client";

import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as ReduxProvider } from "react-redux";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  RobotoMono_400Regular,
  RobotoMono_500Medium,
} from "@expo-google-fonts/roboto-mono";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";

import { store } from "./src/store";
import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import RootNavigator from "./src/navigation/RootNavigator";
import { View, Text } from "react-native";
import { registerForPushNotificationsAsync } from "./src/services/NotificationService";

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Wrapper component to access theme context
const AppContent = () => {
  const { paperTheme } = useTheme();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log("Push notification token:", token);
      }
    });

    // Handle notification response
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { taskId } = response.notification.request.content.data;
        if (taskId) {
          // Navigate to task detail when notification is tapped
          // This would require a navigation ref setup, which we'll skip for now
          console.log("Notification tapped for task:", taskId);
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="auto" />
          <RootNavigator />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    RobotoMono_400Regular,
    RobotoMono_500Medium,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading fonts...</Text>
      </View>
    );
  }

  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ReduxProvider>
  );
}
