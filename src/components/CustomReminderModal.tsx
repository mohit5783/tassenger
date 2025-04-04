"use client";

import type React from "react";
import { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Modal,
  Portal,
  Text,
  Button,
  Surface,
  TextInput,
} from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";

interface CustomReminderModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (days: number, hours: number, minutes: number) => void;
}

const CustomReminderModal: React.FC<CustomReminderModalProps> = ({
  visible,
  onDismiss,
  onSave,
}) => {
  const { theme } = useTheme();
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");

  const handleSave = () => {
    const daysNum = Number.parseInt(days) || 0;
    const hoursNum = Number.parseInt(hours) || 0;
    const minutesNum = Number.parseInt(minutes) || 0;

    if (daysNum === 0 && hoursNum === 0 && minutesNum === 0) {
      // At least one value must be greater than 0
      return;
    }

    onSave(daysNum, hoursNum, minutesNum);
    resetForm();
  };

  const resetForm = () => {
    setDays("");
    setHours("");
    setMinutes("");
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface
          style={[
            styles.modalContent,
            { backgroundColor: theme.dark ? "#1E1E1E" : "#FFFFFF" },
          ]}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Custom Reminder
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Set a custom time before the due date
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
              <Text
                style={[
                  styles.inputLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                days
              </Text>
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
              <Text
                style={[
                  styles.inputLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                hours
              </Text>
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
              <Text
                style={[
                  styles.inputLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                minutes
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleDismiss}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              disabled={days === "" && hours === "" && minutes === ""}
            >
              Save
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    padding: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  inputsContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginRight: 12,
  },
  inputLabel: {
    width: 60,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    marginLeft: 12,
  },
});

export default CustomReminderModal;
