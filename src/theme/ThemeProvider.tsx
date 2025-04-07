"use client";

import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { Appearance } from "react-native";
import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

// WhatsApp colors - updated to use the correct teal colors
const whatsappColors = {
  tealGreen: "#075E54", // WhatsApp primary teal color
  lightGreen: "#25D366", // WhatsApp accent green color
  tealGreenDark: "#054C44", // Darker teal for dark mode
  chatBackground: "#ECE5DD", // WhatsApp chat background
};

// Settings keys for AsyncStorage
const THEME_STORAGE_KEY = "tassenger_theme_mode";
const LARGE_TEXT_KEY = "tassenger_large_text";
const READ_RECEIPTS_KEY = "tassenger_read_receipts";
const NOTIFICATIONS_KEY = "tassenger_notifications";
const SOUND_KEY = "tassenger_notification_sound";
const TASK_REMINDER_KEY = "tassenger_task_reminder_default";

// Default font scale factor
const LARGE_TEXT_SCALE = 1.2;

interface ThemeContextType {
  theme: {
    dark: boolean;
    colors: {
      primary: string;
      background: string;
      card: string;
      text: string;
      textSecondary: string;
      border: string;
      notification: string;
      outline: string;
      error: string;
      onPrimary: string;
      onBackground: string;
      customColors: {
        task: {
          todo: string;
          inProgress: string;
          completed: string;
          review: string;
          pending: string;
        };
      };
    };
    fontScale: number;
  };
  paperTheme: typeof MD3LightTheme;
  toggleTheme: () => void;
  largeText: boolean;
  toggleLargeText: () => void;
  readReceipts: boolean;
  toggleReadReceipts: () => void;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  taskReminderDefault: string;
  setTaskReminderDefault: (value: string) => void;
}

const defaultContextValue: ThemeContextType = {
  theme: {
    dark: false,
    colors: {
      primary: whatsappColors.tealGreen,
      background: "#FFFFFF",
      card: "#F0F0F0",
      text: "#000000",
      textSecondary: "#5F5F5F",
      border: "#CCCCCC",
      notification: "#FF453A",
      outline: "#A9A9A9",
      error: "#FF0000",
      onPrimary: "#FFFFFF",
      onBackground: "#000000",
      customColors: {
        task: {
          todo: "#E6E6E6",
          inProgress: "#FFC107",
          completed: whatsappColors.lightGreen,
          review: "#2196F3",
          pending: "#9C27B0",
        },
      },
    },
    fontScale: 1,
  },
  paperTheme: MD3LightTheme,
  toggleTheme: () => {},
  largeText: false,
  toggleLargeText: () => {},
  readReceipts: true,
  toggleReadReceipts: () => {},
  notificationsEnabled: true,
  toggleNotifications: () => {},
  soundEnabled: true,
  toggleSound: () => {},
  taskReminderDefault: "1hour",
  setTaskReminderDefault: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

export const ThemeProvider = ({ children }: any) => {
  // Load saved preferences from AsyncStorage
  const [initialized, setInitialized] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(
    Appearance.getColorScheme() === "dark"
  );
  const [largeText, setLargeText] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [taskReminderDefault, setTaskReminderDefault] = useState("1hour");

  // Load saved preferences on mount
  useEffect(() => {
    const loadSavedPreferences = async () => {
      try {
        // Load theme preference
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setIsDarkTheme(savedTheme === "dark");
        }

        // Load large text preference
        const savedLargeText = await AsyncStorage.getItem(LARGE_TEXT_KEY);
        if (savedLargeText !== null) {
          setLargeText(savedLargeText === "true");
        }

        // Load read receipts preference
        const savedReadReceipts = await AsyncStorage.getItem(READ_RECEIPTS_KEY);
        if (savedReadReceipts !== null) {
          setReadReceipts(savedReadReceipts === "true");
        }

        // Load notifications preference
        const savedNotifications = await AsyncStorage.getItem(
          NOTIFICATIONS_KEY
        );
        if (savedNotifications !== null) {
          setNotificationsEnabled(savedNotifications === "true");
        }

        // Load sound preference
        const savedSound = await AsyncStorage.getItem(SOUND_KEY);
        if (savedSound !== null) {
          setSoundEnabled(savedSound === "true");
        }

        // Load task reminder default
        const savedTaskReminder = await AsyncStorage.getItem(TASK_REMINDER_KEY);
        if (savedTaskReminder !== null) {
          setTaskReminderDefault(savedTaskReminder);
        }

        setInitialized(true);
      } catch (error) {
        console.error("Error loading saved preferences:", error);
        setInitialized(true);
      }
    };

    loadSavedPreferences();
  }, []);

  const theme = useMemo(
    () => ({
      dark: isDarkTheme,
      colors: {
        // Use neon green for primary color in dark mode, teal in light mode
        primary: isDarkTheme ? "#00C2A8" : whatsappColors.tealGreen,
        background: isDarkTheme ? "#121212" : "#F7F7F7",
        card: isDarkTheme ? "#1E1E1E" : "#FFFFFF",
        text: isDarkTheme ? "#FFFFFF" : "#000000",
        textSecondary: isDarkTheme ? "#A9A9A9" : "#5F5F5F",
        border: isDarkTheme ? "#333333" : "#CCCCCC",
        notification: "#FF453A",
        outline: isDarkTheme ? "#666666" : "#A9A9A9",
        error: "#FF0000",
        onPrimary: isDarkTheme ? "#000000" : "#FFFFFF", // Black text on neon green for better contrast in dark mode
        onBackground: isDarkTheme ? "#FFFFFF" : "#000000",
        customColors: {
          task: {
            todo: isDarkTheme ? "#6B7280" : "#9CA3AF", // Gray that works in both themes
            inProgress: isDarkTheme ? "#FFCC00" : "#FFC107", // Yellow for in-progress
            completed: isDarkTheme ? "#50FF50" : whatsappColors.lightGreen, // Keep the green for completed
            review: isDarkTheme ? "#00C2A8" : "#2196F3",
            pending: isDarkTheme ? "#CCFF00" : "#9C27B0",
          },
        },
      },
      fontScale: largeText ? LARGE_TEXT_SCALE : 1,
    }),
    [isDarkTheme, largeText]
  );

  // Create a Paper theme that matches our custom theme
  const paperTheme = useMemo(
    () =>
      isDarkTheme
        ? {
            ...MD3DarkTheme,
            colors: {
              ...MD3DarkTheme.colors,
              primary: theme.colors.primary,
              background: theme.colors.background,
              error: theme.colors.error,
              text: theme.colors.text,
              onPrimary: theme.colors.onPrimary,
            },
            fonts: {
              ...MD3DarkTheme.fonts,
              // Apply font scaling to all font variants
              bodyLarge: {
                ...MD3DarkTheme.fonts.bodyLarge,
                fontSize: 16 * theme.fontScale,
              },
              bodyMedium: {
                ...MD3DarkTheme.fonts.bodyMedium,
                fontSize: 14 * theme.fontScale,
              },
              bodySmall: {
                ...MD3DarkTheme.fonts.bodySmall,
                fontSize: 12 * theme.fontScale,
              },
              labelLarge: {
                ...MD3DarkTheme.fonts.labelLarge,
                fontSize: 14 * theme.fontScale,
              },
              labelMedium: {
                ...MD3DarkTheme.fonts.labelMedium,
                fontSize: 12 * theme.fontScale,
              },
              labelSmall: {
                ...MD3DarkTheme.fonts.labelSmall,
                fontSize: 11 * theme.fontScale,
              },
              titleLarge: {
                ...MD3DarkTheme.fonts.titleLarge,
                fontSize: 20 * theme.fontScale,
              },
              titleMedium: {
                ...MD3DarkTheme.fonts.titleMedium,
                fontSize: 16 * theme.fontScale,
              },
              titleSmall: {
                ...MD3DarkTheme.fonts.titleSmall,
                fontSize: 14 * theme.fontScale,
              },
            },
          }
        : {
            ...MD3LightTheme,
            colors: {
              ...MD3LightTheme.colors,
              primary: theme.colors.primary,
              background: theme.colors.background,
              error: theme.colors.error,
              text: theme.colors.text,
              onPrimary: theme.colors.onPrimary,
            },
            fonts: {
              ...MD3LightTheme.fonts,
              // Apply font scaling to all font variants
              bodyLarge: {
                ...MD3LightTheme.fonts.bodyLarge,
                fontSize: 16 * theme.fontScale,
              },
              bodyMedium: {
                ...MD3LightTheme.fonts.bodyMedium,
                fontSize: 14 * theme.fontScale,
              },
              bodySmall: {
                ...MD3LightTheme.fonts.bodySmall,
                fontSize: 12 * theme.fontScale,
              },
              labelLarge: {
                ...MD3LightTheme.fonts.labelLarge,
                fontSize: 14 * theme.fontScale,
              },
              labelMedium: {
                ...MD3LightTheme.fonts.labelMedium,
                fontSize: 12 * theme.fontScale,
              },
              labelSmall: {
                ...MD3LightTheme.fonts.labelSmall,
                fontSize: 11 * theme.fontScale,
              },
              titleLarge: {
                ...MD3LightTheme.fonts.titleLarge,
                fontSize: 20 * theme.fontScale,
              },
              titleMedium: {
                ...MD3LightTheme.fonts.titleMedium,
                fontSize: 16 * theme.fontScale,
              },
              titleSmall: {
                ...MD3LightTheme.fonts.titleSmall,
                fontSize: 14 * theme.fontScale,
              },
            },
          },
    [isDarkTheme, theme]
  );

  const toggleTheme = async () => {
    const newThemeValue = !isDarkTheme;
    setIsDarkTheme(newThemeValue);
    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        newThemeValue ? "dark" : "light"
      );
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const toggleLargeText = async () => {
    const newValue = !largeText;
    setLargeText(newValue);
    try {
      await AsyncStorage.setItem(LARGE_TEXT_KEY, newValue ? "true" : "false");
    } catch (error) {
      console.error("Error saving large text preference:", error);
    }
  };

  const toggleReadReceipts = async () => {
    const newValue = !readReceipts;
    setReadReceipts(newValue);
    try {
      await AsyncStorage.setItem(
        READ_RECEIPTS_KEY,
        newValue ? "true" : "false"
      );
    } catch (error) {
      console.error("Error saving read receipts preference:", error);
    }
  };

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    try {
      await AsyncStorage.setItem(
        NOTIFICATIONS_KEY,
        newValue ? "true" : "false"
      );
    } catch (error) {
      console.error("Error saving notifications preference:", error);
    }
  };

  const toggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    try {
      await AsyncStorage.setItem(SOUND_KEY, newValue ? "true" : "false");
    } catch (error) {
      console.error("Error saving sound preference:", error);
    }
  };

  const updateTaskReminderDefault = async (value: string) => {
    setTaskReminderDefault(value);
    try {
      await AsyncStorage.setItem(TASK_REMINDER_KEY, value);
    } catch (error) {
      console.error("Error saving task reminder preference:", error);
    }
  };

  // Don't render until we've loaded preferences
  if (!initialized) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        paperTheme,
        toggleTheme,
        largeText,
        toggleLargeText,
        readReceipts,
        toggleReadReceipts,
        notificationsEnabled,
        toggleNotifications,
        soundEnabled,
        toggleSound,
        taskReminderDefault,
        setTaskReminderDefault: updateTaskReminderDefault,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
