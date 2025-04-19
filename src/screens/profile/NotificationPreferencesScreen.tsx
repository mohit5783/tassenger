"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Appbar,
  Switch,
  List,
  Divider,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppSelector } from "../../store/hooks";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from "../../services/NotificationService";

// Define the type for notification preferences
type NotificationPreferences = typeof DEFAULT_NOTIFICATION_PREFERENCES;

const NotificationPreferencesScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const userPreferences = (await getUserNotificationPreferences(
        user.id
      )) as NotificationPreferences;
      setPreferences(userPreferences);
    } catch (error) {
      console.error("Error loading notification preferences:", error);
      Alert.alert("Error", "Failed to load notification preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePreference = (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateUserNotificationPreferences(user.id, preferences);
      Alert.alert("Success", "Notification preferences saved successfully");
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      Alert.alert("Error", "Failed to save notification preferences");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header style={{ backgroundColor: "black" }}>
          <Appbar.BackAction
            color="white"
            onPress={() => navigation.goBack()}
          />
          <Appbar.Content title="Notification Settings" color="white" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
        <Appbar.Content title="Notification Settings" color="white" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <List.Section>
          <List.Subheader>General</List.Subheader>
          <List.Item
            title="Enable Notifications"
            description="Turn on/off all notifications"
            right={() => (
              <Switch
                value={preferences.enabled !== false}
                onValueChange={(value) =>
                  handleTogglePreference("enabled", value)
                }
              />
            )}
          />
          <List.Item
            title="Sound"
            description="Play sound with notifications"
            right={() => (
              <Switch
                value={preferences.sound !== false}
                onValueChange={(value) =>
                  handleTogglePreference("sound", value)
                }
                disabled={preferences.enabled === false}
              />
            )}
          />
          <Divider />

          <List.Subheader>Task Notifications</List.Subheader>
          <List.Item
            title="Task Assignment"
            description="When you're assigned a new task"
            right={() => (
              <Switch
                value={preferences.taskAssigned !== false}
                onValueChange={(value) =>
                  handleTogglePreference("taskAssigned", value)
                }
                disabled={preferences.enabled === false}
              />
            )}
          />
          <List.Item
            title="Task Updates"
            description="When a task you're involved with is updated"
            right={() => (
              <Switch
                value={preferences.taskUpdated !== false}
                onValueChange={(value) =>
                  handleTogglePreference("taskUpdated", value)
                }
                disabled={preferences.enabled === false}
              />
            )}
          />
          <List.Item
            title="Task Reminders"
            description="Reminders for upcoming tasks"
            right={() => (
              <Switch
                value={preferences.taskReminder !== false}
                onValueChange={(value) =>
                  handleTogglePreference("taskReminder", value)
                }
                disabled={preferences.enabled === false}
              />
            )}
          />
          <List.Item
            title="Approaching Deadlines"
            description="When a task deadline is approaching"
            right={() => (
              <Switch
                value={preferences.taskApproachingDeadline !== false}
                onValueChange={(value) =>
                  handleTogglePreference("taskApproachingDeadline", value)
                }
                disabled={preferences.enabled === false}
              />
            )}
          />
          <List.Item
            title="Recurring Tasks"
            description="When a new recurring task is generated"
            right={() => (
              <Switch
                value={preferences.taskRecurring !== false}
                onValueChange={(value) =>
                  handleTogglePreference("taskRecurring", value)
                }
                disabled={preferences.enabled === false}
              />
            )}
          />
          <Divider />

          <List.Subheader>Chat Notifications</List.Subheader>
          <List.Item
            title="New Messages"
            description="When you receive a new message"
            right={() => (
              <Switch
                value={preferences.messageReceived !== false}
                onValueChange={(value) =>
                  handleTogglePreference("messageReceived", value)
                }
                disabled={preferences.enabled === false}
              />
            )}
          />
          <List.Item
            title="Read Receipts"
            description="When someone reads your message"
            right={() => (
              <Switch
                value={preferences.messageRead !== false}
                onValueChange={(value) =>
                  handleTogglePreference("messageRead", value)
                }
                disabled={preferences.enabled === false}
              />
            )}
          />
          <List.Item
            title="Group Mentions"
            description="When you're mentioned in a group chat"
            right={() => (
              <Switch
                value={preferences.groupMention !== false}
                onValueChange={(value) =>
                  handleTogglePreference("groupMention", value)
                }
                disabled={preferences.enabled === false}
              />
            )}
          />
          <Divider />

          <List.Subheader>Other</List.Subheader>
          <List.Item
            title="Onboarding & Tips"
            description="Welcome messages and feature tips"
            right={() => (
              <Switch
                value={preferences.onboarding !== false}
                onValueChange={(value) =>
                  handleTogglePreference("onboarding", value)
                }
                disabled={preferences.enabled === false}
              />
            )}
          />
        </List.Section>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSavePreferences}
            loading={isSaving}
            disabled={isSaving}
            style={[
              styles.saveButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            Save Preferences
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
    marginBottom: 24,
  },
  saveButton: {
    paddingVertical: 8,
  },
});

export default NotificationPreferencesScreen;
