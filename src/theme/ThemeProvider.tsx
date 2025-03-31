"use client";

import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { Appearance, type ColorSchemeName } from "react-native";
import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

// App colors
const appColors = {
  primary: {
    light: "#075E54", // Teal green
    dark: "#128C7E", // Slightly lighter teal for dark mode
  },
  secondary: {
    light: "#25D366", // Light green
    dark: "#25D366", // Same light green for dark mode
  },
  background: {
    light: "#FFFFFF",
    dark: "#121212", // Dark background
  },
  surface: {
    light: "#FFFFFF",
    dark: "#1E1E1E", // Dark surface
  },
  text: {
    light: "#000000",
    dark: "#FFFFFF", // White text for dark mode
  },
  textSecondary: {
    light: "#5F5F5F",
    dark: "#AAAAAA", // Light gray text for dark mode
  },
  card: {
    light: "#FFFFFF",
    dark: "#2C2C2C", // Dark card background
  },
  divider: {
    light: "#E0E0E0",
    dark: "#333333", // Dark divider
  },
};

// Task status colors
const taskStatusColors = {
  todo: {
    light: "#E6E6E6",
    dark: "#444444",
  },
  inProgress: {
    light: "#FFC107",
    dark: "#FFC107",
  },
  completed: {
    light: "#25D366",
    dark: "#25D366",
  },
  review: {
    light: "#2196F3",
    dark: "#2196F3",
  },
  pending: {
    light: "#9C27B0",
    dark: "#9C27B0",
  },
};

const ThemeContext = createContext({
  theme: {
    dark: false,
    colors: {
      primary: appColors.primary.light,
      secondary: appColors.secondary.light,
      background: appColors.background.light,
      surface: appColors.surface.light,
      text: appColors.text.light,
      textSecondary: appColors.textSecondary.light,
      card: appColors.card.light,
      border: appColors.divider.light,
      notification: "#FF453A",
      outline: "#A9A9A9",
      error: "#FF0000",
      onPrimary: "#FFFFFF",
      onBackground: "#000000",
      customColors: {
        task: {
          todo: taskStatusColors.todo.light,
          inProgress: taskStatusColors.inProgress.light,
          completed: taskStatusColors.completed.light,
          review: taskStatusColors.review.light,
          pending: taskStatusColors.pending.light,
        },
      },
    },
  },
  paperTheme: MD3LightTheme,
  toggleTheme: () => {},
  colorScheme: "light" as ColorSchemeName,
});

export const ThemeProvider = ({ children }: any) => {
  // Use system theme by default
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );
  const isDarkTheme = colorScheme === "dark";

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const theme = useMemo(
    () => ({
      dark: isDarkTheme,
      colors: {
        primary: isDarkTheme ? appColors.primary.dark : appColors.primary.light,
        secondary: isDarkTheme
          ? appColors.secondary.dark
          : appColors.secondary.light,
        background: isDarkTheme
          ? appColors.background.dark
          : appColors.background.light,
        surface: isDarkTheme ? appColors.surface.dark : appColors.surface.light,
        card: isDarkTheme ? appColors.card.dark : appColors.card.light,
        text: isDarkTheme ? appColors.text.dark : appColors.text.light,
        textSecondary: isDarkTheme
          ? appColors.textSecondary.dark
          : appColors.textSecondary.light,
        border: isDarkTheme ? appColors.divider.dark : appColors.divider.light,
        notification: "#FF453A",
        outline: isDarkTheme ? "#666666" : "#A9A9A9",
        error: "#FF0000",
        onPrimary: "#FFFFFF",
        onBackground: isDarkTheme ? "#FFFFFF" : "#000000",
        customColors: {
          task: {
            todo: isDarkTheme
              ? taskStatusColors.todo.dark
              : taskStatusColors.todo.light,
            inProgress: isDarkTheme
              ? taskStatusColors.inProgress.dark
              : taskStatusColors.inProgress.light,
            completed: isDarkTheme
              ? taskStatusColors.completed.dark
              : taskStatusColors.completed.light,
            review: isDarkTheme
              ? taskStatusColors.review.dark
              : taskStatusColors.review.light,
            pending: isDarkTheme
              ? taskStatusColors.pending.dark
              : taskStatusColors.pending.light,
          },
        },
      },
    }),
    [isDarkTheme]
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
              surface: theme.colors.surface,
              error: theme.colors.error,
              text: theme.colors.text,
              onPrimary: theme.colors.onPrimary,
              outline: theme.colors.outline,
            },
          }
        : {
            ...MD3LightTheme,
            colors: {
              ...MD3LightTheme.colors,
              primary: theme.colors.primary,
              background: theme.colors.background,
              surface: theme.colors.surface,
              error: theme.colors.error,
              text: theme.colors.text,
              onPrimary: theme.colors.onPrimary,
              outline: theme.colors.outline,
            },
          },
    [isDarkTheme, theme]
  );

  const toggleTheme = () => {
    setColorScheme(isDarkTheme ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider
      value={{ theme, paperTheme, toggleTheme, colorScheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
