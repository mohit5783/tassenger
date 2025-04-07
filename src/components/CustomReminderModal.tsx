"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
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
  const [days, setDays] = useState("0");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setDays("0");
      setHours("0");
      setMinutes("0");
    }
  }, [visible]);

  const handleSave = () => {
    // Convert to numbers with default of 0 if empty or NaN
    const daysNum = Number.parseInt(days) || 0;
    const hoursNum = Number.parseInt(hours) || 0;
    const minutesNum = Number.parseInt(minutes) || 0;

    // Only save if at least one value is greater than 0
    if (daysNum > 0 || hoursNum > 0 || minutesNum > 0) {
      onSave(daysNum, hoursNum, minutesNum);
    } else {
      // If all values are 0, set at least minutes to 1
      onSave(0, 0, 1);
    }
  };

  const handleDismiss = () => {
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
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
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                Save
              </Button>
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    justifyContent: "flex-end",
    flex: 1,
  },
  keyboardAvoidingView: {
    width: "100%",
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: 24,
    borderRadius: 12,
    maxHeight: "80%",
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
    marginTop: 8,
  },
  button: {
    marginLeft: 12,
  },
});

export default CustomReminderModal;
