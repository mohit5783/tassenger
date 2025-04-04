"use client";

import { useState } from "react";
import { StyleSheet, ScrollView, View, Alert } from "react-native";
import {
  List,
  Switch,
  Divider,
  Appbar,
  RadioButton,
  Button,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SettingsScreen = ({ navigation }: any) => {
  const {
    theme,
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
    setTaskReminderDefault,
  } = useTheme();

  // These settings are not yet implemented functionally
  const [highContrast, setHighContrast] = useState(false);
  const [dataSync, setDataSync] = useState("wifi");
  const [autoBackup, setAutoBackup] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const clearCache = async () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached data. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear AsyncStorage cache except for theme and other settings
              const keys = await AsyncStorage.getAllKeys();
              const settingsKeys = [
                "tassenger_theme_mode",
                "tassenger_large_text",
                "tassenger_read_receipts",
                "tassenger_notifications",
                "tassenger_notification_sound",
                "tassenger_task_reminder_default",
              ];
              const keysToRemove = keys.filter(
                (key) => !settingsKeys.includes(key)
              );

              if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
              }

              Alert.alert("Success", "Cache cleared successfully");
            } catch (error) {
              console.error("Error clearing cache:", error);
              Alert.alert("Error", "Failed to clear cache");
            }
          },
        },
      ]
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction
          color={theme.colors.onPrimary}
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="Settings" color={theme.colors.onPrimary} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Appearance Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.dark ? "#1E1E1E" : "white" },
          ]}
        >
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>
              Appearance
            </List.Subheader>
            <List.Item
              title="Dark Mode"
              description="Use dark theme throughout the app"
              right={() => (
                <Switch
                  value={theme.dark}
                  onValueChange={toggleTheme}
                  color={theme.colors.primary}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Large Text"
              description="Increase text size for better readability"
              right={() => (
                <Switch
                  value={largeText}
                  onValueChange={toggleLargeText}
                  color={theme.colors.primary}
                />
              )}
            />
            <List.Item
              title="High Contrast"
              description="Improve visibility with higher contrast"
              right={() => (
                <Switch
                  value={highContrast}
                  onValueChange={setHighContrast}
                  color={theme.colors.primary}
                />
              )}
            />
          </List.Section>
        </View>

        {/* Task Settings Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.dark ? "#1E1E1E" : "white" },
          ]}
        >
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>
              Task Settings
            </List.Subheader>
            <List.Item
              title="Default Reminder Time"
              description="Set when task reminders are sent by default"
              onPress={() => {}}
            />
            <View style={styles.radioGroup}>
              <RadioButton.Group
                onValueChange={(value) => setTaskReminderDefault(value)}
                value={taskReminderDefault}
              >
                <RadioButton.Item
                  label="At time of task"
                  value="attime"
                  labelStyle={{ color: theme.colors.text }}
                  color={theme.colors.primary}
                />
                <RadioButton.Item
                  label="10 minutes before"
                  value="10min"
                  labelStyle={{ color: theme.colors.text }}
                  color={theme.colors.primary}
                />
                <RadioButton.Item
                  label="1 hour before"
                  value="1hour"
                  labelStyle={{ color: theme.colors.text }}
                  color={theme.colors.primary}
                />
                <RadioButton.Item
                  label="1 day before"
                  value="1day"
                  labelStyle={{ color: theme.colors.text }}
                  color={theme.colors.primary}
                />
              </RadioButton.Group>
            </View>
            <Divider />
          </List.Section>
        </View>

        {/* Notifications Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.dark ? "#1E1E1E" : "white" },
          ]}
        >
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>
              Notifications
            </List.Subheader>
            <List.Item
              title="Push Notifications"
              description="Receive notifications for task updates"
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  color={theme.colors.primary}
                />
              )}
            />
            <List.Item
              title="Sound"
              description="Play sound for notifications"
              right={() => (
                <Switch
                  value={soundEnabled}
                  onValueChange={toggleSound}
                  color={theme.colors.primary}
                  disabled={!notificationsEnabled}
                />
              )}
            />
            <Divider />
          </List.Section>
        </View>

        {/* Chat Settings Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.dark ? "#1E1E1E" : "white" },
          ]}
        >
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>
              Chat Settings
            </List.Subheader>
            <List.Item
              title="Read Receipts"
              description="Let others know when you've read their messages"
              right={() => (
                <Switch
                  value={readReceipts}
                  onValueChange={toggleReadReceipts}
                  color={theme.colors.primary}
                />
              )}
            />
            <Divider />
          </List.Section>
        </View>

        {/* Security Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.dark ? "#1E1E1E" : "white" },
          ]}
        >
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>
              Security
            </List.Subheader>
            <List.Item
              title="Biometric Authentication"
              description="Use fingerprint or face ID to secure the app"
              right={() => (
                <Switch
                  value={biometricEnabled}
                  onValueChange={setBiometricEnabled}
                  color={theme.colors.primary}
                />
              )}
            />
            <List.Item
              title="Change Password"
              description="Update your account password"
              onPress={() => {}}
            />
            <Divider />
          </List.Section>
        </View>

        {/* Data & Storage Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.dark ? "#1E1E1E" : "white" },
          ]}
        >
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>
              Data & Storage
            </List.Subheader>
            <List.Item
              title="Data Sync"
              description="Choose when to sync data with the server"
              onPress={() => {}}
            />
            <View style={styles.radioGroup}>
              <RadioButton.Group
                onValueChange={(value) => setDataSync(value)}
                value={dataSync}
              >
                <RadioButton.Item
                  label="Always (uses more data)"
                  value="always"
                  labelStyle={{ color: theme.colors.text }}
                  color={theme.colors.primary}
                />
                <RadioButton.Item
                  label="Only on Wi-Fi"
                  value="wifi"
                  labelStyle={{ color: theme.colors.text }}
                  color={theme.colors.primary}
                />
                <RadioButton.Item
                  label="Manual sync only"
                  value="manual"
                  labelStyle={{ color: theme.colors.text }}
                  color={theme.colors.primary}
                />
              </RadioButton.Group>
            </View>
            <Divider />
            <List.Item
              title="Auto Backup"
              description="Automatically backup your data weekly"
              right={() => (
                <Switch
                  value={autoBackup}
                  onValueChange={setAutoBackup}
                  color={theme.colors.primary}
                />
              )}
            />
            <List.Item
              title="Clear Cache"
              description="Free up space by clearing cached data"
              onPress={clearCache}
            />
            <Divider />
          </List.Section>
        </View>

        {/* Backup & Restore Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.dark ? "#1E1E1E" : "white" },
          ]}
        >
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>
              Backup & Restore
            </List.Subheader>
            <View style={styles.backupButtons}>
              <Button
                mode="outlined"
                icon="backup-restore"
                style={styles.backupButton}
                onPress={() =>
                  Alert.alert(
                    "Backup",
                    "This will backup all your data to the cloud."
                  )
                }
              >
                Backup Now
              </Button>
              <Button
                mode="outlined"
                icon="cloud-download"
                style={styles.backupButton}
                onPress={() =>
                  Alert.alert(
                    "Restore",
                    "This will restore your data from the latest backup."
                  )
                }
              >
                Restore
              </Button>
            </View>
            <Divider />
          </List.Section>
        </View>

        {/* Privacy Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.dark ? "#1E1E1E" : "white" },
          ]}
        >
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>
              Privacy & Legal
            </List.Subheader>
            <List.Item title="Privacy Policy" onPress={() => {}} />
            <List.Item title="Terms of Service" onPress={() => {}} />
            <List.Item
              title="Data Usage"
              description="Manage how your data is used"
              onPress={() => {}}
            />
            <Divider />
          </List.Section>
        </View>

        {/* About Section */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.dark ? "#1E1E1E" : "white",
              marginBottom: 20,
            },
          ]}
        >
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>
              About
            </List.Subheader>
            <List.Item
              title="App Version"
              description="1.0.0"
              onPress={() => {}}
            />
            <List.Item
              title="Send Feedback"
              description="Help us improve Tassenger"
              onPress={() => {}}
            />
            <Divider />
          </List.Section>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 8,
    borderRadius: 8,
  },
  radioGroup: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backupButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
  },
  backupButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default SettingsScreen;
