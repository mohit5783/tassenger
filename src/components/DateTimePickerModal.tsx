"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
  Modal,
  Portal,
  Text,
  Button,
  Surface,
  Divider,
} from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";
import DateTimePicker from "@react-native-community/datetimepicker";
import TimePickerModal from "./TimePickerModal";

interface DateTimePickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
}

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
  initialDate = new Date(),
}) => {
  const { theme } = useTheme();
  const [date, setDate] = useState(initialDate);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Reset to initial date when modal opens
  useEffect(() => {
    if (visible) {
      setDate(initialDate);
    }
  }, [visible, initialDate]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      // Keep the time from the current date
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds());
      setDate(newDate);
    }
  };

  const handleTimeConfirm = (hours: number, minutes: number) => {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0);
    setDate(newDate);
    setShowTimePicker(false);
  };

  const handleConfirm = () => {
    onConfirm(date);
  };

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
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Select Date & Time
          </Text>

          <View
            style={[
              styles.datePickerContainer,
              { backgroundColor: theme.dark ? "#1E1E1E" : "#FFFFFF" },
            ]}
          >
            <DateTimePicker
              value={date}
              mode="date"
              display="inline"
              onChange={handleDateChange}
              style={styles.datePicker}
              // Use accentColor instead of textColor for better cross-platform support
              accentColor={theme.colors.primary}
              // For iOS, we need to set the text color differently
              textColor={theme.dark ? "#FFFFFF" : "#000000"}
              // Set a contrasting background color to ensure text visibility
              themeVariant={theme.dark ? "dark" : "light"}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.timeSection}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Time
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              icon="clock-outline"
              style={styles.timeButton}
            >
              {date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Button>
          </View>

          <View style={styles.previewSection}>
            <Text
              style={[
                styles.previewLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Selected:
            </Text>
            <Text style={[styles.previewText, { color: theme.colors.text }]}>
              {date.toLocaleDateString()} at{" "}
              {date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button onPress={onDismiss} style={styles.button}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
            >
              Confirm
            </Button>
          </View>
        </Surface>
      </Modal>

      <TimePickerModal
        visible={showTimePicker}
        onDismiss={() => setShowTimePicker(false)}
        onConfirm={handleTimeConfirm}
        initialHours={date.getHours()}
        initialMinutes={date.getMinutes()}
      />
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
  datePickerContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  datePicker: {
    width: "100%",
  },
  divider: {
    marginVertical: 16,
  },
  timeSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  timeButton: {
    marginTop: 8,
  },
  previewSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 8,
  },
  previewLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
    fontWeight: "500",
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

export default DateTimePickerModal;
