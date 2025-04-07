"use client";

import type React from "react";
import { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Switch, Divider } from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";
import { Bell, Plus } from "react-native-feather";

interface ReminderTime {
  id: string;
  days?: number;
  hours?: number;
  minutes?: number;
  label: string;
}

interface NotificationSettingsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  reminderTimes: ReminderTime[];
  selectedReminders: string[];
  onSelectReminder: (reminderId: string, selected: boolean) => void;
  onAddCustomReminder: () => void;
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
  const [expanded, setExpanded] = useState(true);

  const toggleExpanded = () => {
    if (!enabled) {
      onToggle(true);
      setExpanded(true);
    } else {
      setExpanded(!expanded);
    }
  };

  const handleAddCustomClick = () => {
    onAddCustomReminder();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.dark ? "#1E1E1E" : "#F5F5F5",
          borderRadius: 12,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.headerRow}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Bell
            width={20}
            height={20}
            stroke={theme.colors.primary}
            style={styles.icon}
          />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Notification Settings
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={(value) => {
            onToggle(value);
            if (value) setExpanded(true);
          }}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      {enabled && expanded && (
        <View style={styles.expandedContent}>
          <Divider style={styles.divider} />

          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            When to remind?
          </Text>

          {reminderTimes.map((reminder) => (
            <TouchableOpacity
              key={reminder.id}
              style={styles.reminderItem}
              onPress={() =>
                onSelectReminder(
                  reminder.id,
                  !selectedReminders.includes(reminder.id)
                )
              }
              activeOpacity={0.7}
            >
              <Text style={{ color: theme.colors.text }}>{reminder.label}</Text>
              <Switch
                value={selectedReminders.includes(reminder.id)}
                onValueChange={(selected) =>
                  onSelectReminder(reminder.id, selected)
                }
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addCustomButton}
            onPress={handleAddCustomClick}
            activeOpacity={0.7}
          >
            <Plus
              width={18}
              height={18}
              stroke={theme.colors.primary}
              style={styles.addIcon}
            />
            <Text style={{ color: theme.colors.primary }}>
              Add Custom Reminder
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    marginVertical: 12,
  },
  reminderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  divider: {
    marginBottom: 8,
  },
  addCustomButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 12,
  },
  addIcon: {
    marginRight: 8,
  },
});

export default NotificationSettings;
