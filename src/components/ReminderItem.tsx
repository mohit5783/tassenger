"use client";

import type React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "../theme/ThemeProvider";
import { X } from "react-native-feather";

interface ReminderItemProps {
  id: string;
  value: string;
  onRemove: (id: string) => void;
  onChange: (id: string, value: string) => void;
}

const reminderOptions = [
  "At time of event",
  "5 minutes before",
  "10 minutes before",
  "15 minutes before",
  "30 minutes before",
  "1 hour before",
  "1 day before",
  "2 days before",
];

const ReminderItem: React.FC<ReminderItemProps> = ({
  id,
  value,
  onRemove,
  onChange,
}) => {
  const { theme } = useTheme();

  const handleChange = (newValue: string) => {
    onChange(id, newValue);
  };

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={value}
        style={[styles.picker, { color: theme.colors.text }]}
        dropdownIconColor={theme.colors.text}
        onValueChange={handleChange}
      >
        {reminderOptions.map((option) => (
          <Picker.Item key={option} label={option} value={option} />
        ))}
      </Picker>

      <TouchableOpacity
        onPress={() => onRemove(id)}
        style={styles.removeButton}
      >
        <X width={16} height={16} stroke={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  picker: {
    flex: 1,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default ReminderItem;
