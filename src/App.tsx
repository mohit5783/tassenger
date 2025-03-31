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
import { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { View, Text } from "react-native";

import { store } from "./store";
import { ThemeProvider, useTheme } from "./theme/ThemeProvider";
import RootNavigator from "./navigation/RootNavigator";
import {
  setupNotificationChannelsExpo,
  registerForPushNotificationsAsync,
} from "./services/NotificationService";

// Wrapper component to access theme context
const AppContent = () => {
  const { paperTheme } = useTheme();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Set up notification channels using Expo-compatible implementation
        await setupNotificationChannelsExpo();

        // Register for push notifications
        const expoPushToken = await registerForPushNotificationsAsync();
        if (expoPushToken) {
          console.log("Expo Push Token:", expoPushToken);
          // You could store this token in your backend
        }
      } catch (error) {
        console.error("Error setting up notifications:", error);
      }
    };

    setupNotifications();

    // Note: FCM listeners are removed for now since we're using stubs
    // We'll add them back when we implement real notifications
  }, []);

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="auto" />
          <NavigationContainer ref={navigationRef}>
            <RootNavigator />
          </NavigationContainer>
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
