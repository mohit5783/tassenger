"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Modal,
  Portal,
  Text,
  Button,
  Surface,
  TouchableRipple,
} from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";

interface TimePickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (hours: number, minutes: number) => void;
  initialHours?: number;
  initialMinutes?: number;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
  initialHours = 12,
  initialMinutes = 0,
}) => {
  const { theme } = useTheme();
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [period, setPeriod] = useState<"AM" | "PM">(
    initialHours >= 12 ? "PM" : "AM"
  );

  // Reset to initial values when modal opens
  useEffect(() => {
    if (visible) {
      let displayHours = initialHours;
      if (displayHours > 12) {
        displayHours -= 12;
      } else if (displayHours === 0) {
        displayHours = 12;
      }
      setHours(displayHours);
      setMinutes(initialMinutes);
      setPeriod(initialHours >= 12 ? "PM" : "AM");
    }
  }, [visible, initialHours, initialMinutes]);

  const handleConfirm = () => {
    // Convert to 24-hour format
    let finalHours = hours;
    if (period === "PM" && hours < 12) {
      finalHours = hours + 12;
    } else if (period === "AM" && hours === 12) {
      finalHours = 0;
    }
    onConfirm(finalHours, minutes);
  };

  const renderHourSelector = () => {
    const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
    return (
      <View style={styles.pickerContainer}>
        <Text style={[styles.pickerLabel, { color: theme.colors.primary }]}>
          Hour
        </Text>
        <ScrollView
          style={styles.pickerScrollView}
          showsVerticalScrollIndicator={false}
        >
          {hourOptions.map((hour) => (
            <TouchableRipple
              key={hour}
              style={[
                styles.pickerItem,
                hours === hour && {
                  backgroundColor: theme.dark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
                },
              ]}
              onPress={() => setHours(hour)}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  { color: theme.colors.text },
                  hours === hour && {
                    color: theme.colors.primary,
                    fontWeight: "bold",
                  },
                ]}
              >
                {hour}
              </Text>
            </TouchableRipple>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMinuteSelector = () => {
    // Create minute options in increments of 5
    const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);
    return (
      <View style={styles.pickerContainer}>
        <Text style={[styles.pickerLabel, { color: theme.colors.primary }]}>
          Minute
        </Text>
        <ScrollView
          style={styles.pickerScrollView}
          showsVerticalScrollIndicator={false}
        >
          {minuteOptions.map((minute) => (
            <TouchableRipple
              key={minute}
              style={[
                styles.pickerItem,
                minutes === minute && {
                  backgroundColor: theme.dark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
                },
              ]}
              onPress={() => setMinutes(minute)}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  { color: theme.colors.text },
                  minutes === minute && {
                    color: theme.colors.primary,
                    fontWeight: "bold",
                  },
                ]}
              >
                {minute.toString().padStart(2, "0")}
              </Text>
            </TouchableRipple>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderPeriodSelector = () => {
    return (
      <View style={styles.periodContainer}>
        <TouchableRipple
          style={[
            styles.periodButton,
            period === "AM" && {
              backgroundColor: theme.dark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)",
            },
          ]}
          onPress={() => setPeriod("AM")}
        >
          <Text
            style={[
              styles.periodText,
              { color: theme.colors.text },
              period === "AM" && {
                color: theme.colors.primary,
                fontWeight: "bold",
              },
            ]}
          >
            AM
          </Text>
        </TouchableRipple>
        <TouchableRipple
          style={[
            styles.periodButton,
            period === "PM" && {
              backgroundColor: theme.dark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)",
            },
          ]}
          onPress={() => setPeriod("PM")}
        >
          <Text
            style={[
              styles.periodText,
              { color: theme.colors.text },
              period === "PM" && {
                color: theme.colors.primary,
                fontWeight: "bold",
              },
            ]}
          >
            PM
          </Text>
        </TouchableRipple>
      </View>
    );
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
            Select Time
          </Text>

          <View style={styles.timeContainer}>
            <View style={styles.timePickersContainer}>
              {renderHourSelector()}
              <Text
                style={[styles.timeSeparator, { color: theme.colors.text }]}
              >
                :
              </Text>
              {renderMinuteSelector()}
            </View>
            {renderPeriodSelector()}
          </View>

          <View style={styles.timePreview}>
            <Text
              style={[styles.timePreviewText, { color: theme.colors.primary }]}
            >
              {hours}:{minutes.toString().padStart(2, "0")} {period}
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
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timePickersContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 3,
  },
  pickerContainer: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  pickerScrollView: {
    height: 200,
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemText: {
    fontSize: 18,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
  periodContainer: {
    flex: 1,
    marginLeft: 16,
  },
  periodButton: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginVertical: 8,
  },
  periodText: {
    fontSize: 18,
    fontWeight: "500",
  },
  timePreview: {
    marginTop: 20,
    alignItems: "center",
  },
  timePreviewText: {
    fontSize: 24,
    fontWeight: "bold",
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

export default TimePickerModal;
