"use client";

import type React from "react";
import { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import {
  Modal,
  Portal,
  Text,
  Button,
  Surface,
  RadioButton,
  TextInput,
} from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";

interface NotificationPickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (selectedReminders: string[]) => void;
  initialSelected?: string[];
}

const NotificationPickerModal: React.FC<NotificationPickerModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
  initialSelected = [],
}) => {
  const { theme } = useTheme();
  const [selectedOption, setSelectedOption] =
    useState<string[]>(initialSelected);
  const [customVisible, setCustomVisible] = useState(false);
  const [days, setDays] = useState("0");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");

  const defaultReminderTimes = [
    { id: "at_time", label: "At time of event" },
    { id: "10_min_before", label: "10 minutes before" },
    { id: "30_min_before", label: "30 minutes before" },
    { id: "1_hour_before", label: "1 hour before" },
    { id: "1_day_before", label: "1 day before" },
    { id: "2_days_before", label: "2 days before" },
  ];

  const handleConfirm = () => {
    onConfirm(selectedOption);
  };

  const handleToggleOption = (optionId: string) => {
    setSelectedOption((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      }
      return [...prev, optionId];
    });
  };

  const handleAddCustomReminder = () => {
    // In a real app, you would add the custom reminder to the list
    // For now, just close the custom modal
    setCustomVisible(false);
  };

  const renderMainOptions = () => (
    <ScrollView>
      {defaultReminderTimes.map((reminder) => (
        <TouchableOpacity
          key={reminder.id}
          style={styles.reminderItem}
          onPress={() => handleToggleOption(reminder.id)}
          activeOpacity={0.7}
        >
          <Text style={{ color: theme.colors.text }}>{reminder.label}</Text>
          <RadioButton
            value={reminder.id}
            status={
              selectedOption.includes(reminder.id) ? "checked" : "unchecked"
            }
            onPress={() => handleToggleOption(reminder.id)}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={styles.addCustomButton}
        onPress={() => setCustomVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={{ color: theme.colors.primary }}>Add Custom Reminder</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCustomOptions = () => (
    <View>
      <Text style={[styles.customTitle, { color: theme.colors.text }]}>
        Custom notification
      </Text>
      <View style={styles.inputsContainer}>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            label="Days"
            value={days}
            onChangeText={setDays}
            keyboardType="number-pad"
            mode="outlined"
          />
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            label="Hours"
            value={hours}
            onChangeText={setHours}
            keyboardType="number-pad"
            mode="outlined"
          />
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            label="Minutes"
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="number-pad"
            mode="outlined"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button onPress={() => setCustomVisible(false)}>Cancel</Button>
        <Button
          mode="contained"
          onPress={handleAddCustomReminder}
          style={{ backgroundColor: theme.colors.primary }}
        >
          Save
        </Button>
      </View>
    </View>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface
          style={[
            styles.surface,
            { backgroundColor: theme.dark ? "#1E1E1E" : "#FFFFFF" },
          ]}
        >
          {customVisible ? renderCustomOptions() : renderMainOptions()}

          {!customVisible && (
            <View style={styles.buttonContainer}>
              <Button onPress={onDismiss} style={styles.button}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirm}
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                OK
              </Button>
            </View>
          )}
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    alignItems: "center",
    justifyContent: "center",
    margin: 20,
  },
  surface: {
    padding: 20,
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  reminderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  addCustomButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  customTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  inputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  inputGroup: {
    flex: 1,
    marginRight: 8,
  },
  input: {
    width: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  button: {
    marginLeft: 12,
  },
});

export default NotificationPickerModal;
