"use client";

import type React from "react";
import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Switch, Button } from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";

interface NotificationSettingsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  reminderTimes: Array<{
    id: string;
    days?: number;
    hours?: number;
    minutes?: number;
    label: string;
  }>;
  selectedReminders: string[];
  onSelectReminder: (reminderId: string, selected: boolean) => void;
  onAddCustomReminder?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  enabled,
  onToggle,
  reminderTimes,
  selectedReminders,
  onSelectReminder,
  onAddCustomReminder,
}) => {
  const { theme } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Notification Settings
        </Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          color={theme.colors.primary}
        />
      </View>

      {enabled && (
        <>
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>
            When to remind?
          </Text>

          <View style={styles.remindersList}>
            {reminderTimes.map((reminder) => (
              <View
                key={reminder.id}
                style={[
                  styles.reminderItem,
                  { borderBottomColor: theme.colors.border },
                ]}
              >
                <Text style={{ color: theme.colors.text }}>
                  {reminder.label}
                </Text>
                <Switch
                  value={selectedReminders.includes(reminder.id)}
                  onValueChange={(selected) =>
                    onSelectReminder(reminder.id, selected)
                  }
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {onAddCustomReminder && (
            <Button
              mode="outlined"
              onPress={onAddCustomReminder}
              style={styles.customButton}
              textColor={theme.colors.text}
            >
              Add Custom Reminder
            </Button>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  remindersList: {
    marginBottom: 16,
  },
  reminderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  customButton: {
    marginTop: 8,
  },
});

export default NotificationSettings;
