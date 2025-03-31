"use client";

import type React from "react";
import { useState } from "react";
import { View, StyleSheet, Modal } from "react-native";
import { Text, Button, TextInput } from "react-native-paper";
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

  const handleSave = () => {
    const daysNum = Number.parseInt(days) || 0;
    const hoursNum = Number.parseInt(hours) || 0;
    const minutesNum = Number.parseInt(minutes) || 0;

    // Ensure at least one value is greater than 0
    if (daysNum > 0 || hoursNum > 0 || minutesNum > 0) {
      onSave(daysNum, hoursNum, minutesNum);
      resetForm();
    }
  };

  const resetForm = () => {
    setDays("0");
    setHours("0");
    setMinutes("0");
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <View style={styles.centeredView}>
        <View
          style={[styles.modalView, { backgroundColor: theme.colors.card }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Custom Reminder
          </Text>
          <Text
            style={[
              styles.modalSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Set a custom time before the due date
          </Text>

          <View style={styles.inputsContainer}>
            <View style={styles.inputGroup}>
              <TextInput
                label="Days"
                value={days}
                onChangeText={setDays}
                keyboardType="number-pad"
                style={styles.input}
                mode="outlined"
                theme={{ colors: { text: theme.colors.text } }}
              />
              <Text
                style={[
                  styles.inputLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Days
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                label="Hours"
                value={hours}
                onChangeText={setHours}
                keyboardType="number-pad"
                style={styles.input}
                mode="outlined"
                theme={{ colors: { text: theme.colors.text } }}
              />
              <Text
                style={[
                  styles.inputLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Hours
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                label="Minutes"
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                style={styles.input}
                mode="outlined"
                theme={{ colors: { text: theme.colors.text } }}
              />
              <Text
                style={[
                  styles.inputLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Minutes
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              onPress={handleDismiss}
              style={styles.button}
              textColor={theme.colors.text}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              disabled={
                Number.parseInt(days) === 0 &&
                Number.parseInt(hours) === 0 &&
                Number.parseInt(minutes) === 0
              }
            >
              Save
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "80%",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.7,
  },
  inputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  input: {
    width: "100%",
  },
  inputLabel: {
    marginTop: 4,
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    marginLeft: 10,
  },
});

export default CustomReminderModal;
