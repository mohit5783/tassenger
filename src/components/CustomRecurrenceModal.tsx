"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import {
  Modal,
  Text,
  Button,
  RadioButton,
  TextInput,
  Menu,
  Surface,
  Portal,
} from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, addMonths } from "date-fns";
import type {
  RecurrenceOptions,
  RecurrenceType,
  EndType,
} from "../types/recurrence";

interface CustomRecurrenceModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (options: RecurrenceOptions | null) => void;
  initialDate: Date;
  initialOptions: RecurrenceOptions | null;
}

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const RECURRENCE_TYPES: { value: RecurrenceType; label: string }[] = [
  { value: "daily", label: "day" },
  { value: "weekly", label: "week" },
  { value: "monthly", label: "month" },
  { value: "yearly", label: "year" },
];

const CustomRecurrenceModal: React.FC<CustomRecurrenceModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
  initialDate,
  initialOptions,
}) => {
  const { theme } = useTheme();

  // Recurrence type and frequency
  const [frequency, setFrequency] = useState<string>(
    (initialOptions?.frequency || 1).toString()
  );
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    initialOptions?.type || "weekly"
  );

  // Selected days for weekly recurrence
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialOptions?.weekDays || [initialDate.getDay()]
  );

  // End options
  const [endType, setEndType] = useState<EndType>(
    initialOptions?.endType || "never"
  );
  const [endDate, setEndDate] = useState<Date>(
    initialOptions?.endDate || addMonths(new Date(), 3)
  );
  const [endCount, setEndCount] = useState<string>(
    (initialOptions?.endCount || 10).toString()
  );

  // UI state
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [typeMenuVisible, setTypeMenuVisible] = useState<boolean>(false);

  // Reset form when modal opens with initialOptions
  useEffect(() => {
    if (visible) {
      if (initialOptions) {
        setRecurrenceType(initialOptions.type || "weekly");
        setFrequency((initialOptions.frequency || 1).toString());
        setEndType(initialOptions.endType || "never");
        setEndDate(initialOptions.endDate || addMonths(new Date(), 3));
        setEndCount((initialOptions.endCount || 10).toString());
        setSelectedDays(initialOptions.weekDays || [initialDate.getDay()]);
      } else {
        // Default values
        setRecurrenceType("weekly");
        setFrequency("1");
        setEndType("never");
        setEndDate(addMonths(new Date(), 3));
        setEndCount("10");
        setSelectedDays([initialDate.getDay()]);
      }
    }
  }, [visible, initialOptions, initialDate]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleDayToggle = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      // Remove day if already selected
      if (selectedDays.length > 1) {
        // Ensure at least one day remains selected
        setSelectedDays(selectedDays.filter((day) => day !== dayIndex));
      }
    } else {
      // Add day if not selected
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };

  const handleConfirm = () => {
    // Validate numeric values
    const safeFrequency = Number.parseInt(frequency) || 1;
    const safeEndCount = Number.parseInt(endCount) || 1;

    const options: RecurrenceOptions = {
      type: recurrenceType,
      frequency: safeFrequency,
      endType: endType,
      ...(endType === "date" ? { endDate } : {}),
      ...(endType === "count" ? { endCount: safeEndCount } : {}),
      ...(recurrenceType === "weekly" ? { weekDays: selectedDays } : {}),
    };

    onConfirm(options);
  };

  const keyboardVerticalOffset = Platform.OS === "ios" ? 40 : 0;

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
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={keyboardVerticalOffset}
          >
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Custom recurrence
              </Text>

              {/* Repeat every section */}
              <View style={styles.section}>
                <Text
                  style={[styles.sectionLabel, { color: theme.colors.text }]}
                >
                  Repeat every
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.numberInput}
                    keyboardType="number-pad"
                    value={frequency}
                    onChangeText={(text) => {
                      // Allow only numbers and limit to a reasonable range
                      const sanitizedText = text.replace(/[^0-9]/g, "");
                      setFrequency(sanitizedText);
                    }}
                    mode="outlined"
                    theme={{ colors: { text: theme.colors.text } }}
                  />

                  <Menu
                    visible={typeMenuVisible}
                    onDismiss={() => setTypeMenuVisible(false)}
                    anchor={
                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          { backgroundColor: theme.dark ? "#333" : "#f0f0f0" },
                        ]}
                        onPress={() => setTypeMenuVisible(true)}
                      >
                        <View style={styles.typeButtonContent}>
                          <Text style={{ color: theme.colors.text }}>
                            {RECURRENCE_TYPES.find(
                              (t) => t.value === recurrenceType
                            )?.label || "week"}
                          </Text>
                          <Text style={{ color: theme.colors.text }}>▼</Text>
                        </View>
                      </TouchableOpacity>
                    }
                  >
                    {RECURRENCE_TYPES.map((type) => (
                      <Menu.Item
                        key={type.value}
                        onPress={() => {
                          setRecurrenceType(type.value);
                          setTypeMenuVisible(false);
                        }}
                        title={type.label}
                      />
                    ))}
                  </Menu>
                </View>
              </View>

              {/* Repeat on section (only for weekly) */}
              {recurrenceType === "weekly" && (
                <View style={styles.section}>
                  <Text
                    style={[styles.sectionLabel, { color: theme.colors.text }]}
                  >
                    Repeat on
                  </Text>
                  <View style={styles.daysContainer}>
                    {DAYS_OF_WEEK.map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayButton,
                          selectedDays.includes(index) && {
                            backgroundColor: theme.colors.primary,
                          },
                        ]}
                        onPress={() => handleDayToggle(index)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            {
                              color: selectedDays.includes(index)
                                ? theme.colors.onPrimary
                                : theme.colors.text,
                            },
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Ends section */}
              <View style={styles.section}>
                <Text
                  style={[styles.sectionLabel, { color: theme.colors.text }]}
                >
                  Ends
                </Text>

                <RadioButton.Group
                  onValueChange={(value) => setEndType(value as EndType)}
                  value={endType}
                >
                  <View style={styles.radioOption}>
                    <RadioButton value="never" color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.text }}>Never</Text>
                  </View>

                  <View style={styles.radioOption}>
                    <RadioButton value="date" color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.text }}>On</Text>
                    <TouchableOpacity
                      style={[
                        styles.dateButton,
                        { backgroundColor: theme.dark ? "#333" : "#f0f0f0" },
                      ]}
                      onPress={() =>
                        endType === "date" && setShowDatePicker(true)
                      }
                      disabled={endType !== "date"}
                    >
                      <Text
                        style={{
                          color:
                            endType === "date"
                              ? theme.colors.text
                              : theme.colors.textSecondary,
                        }}
                      >
                        {format(endDate, "MMM d, yyyy")}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.radioOption}>
                    <RadioButton value="count" color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.text }}>After</Text>
                    <View style={styles.occurrencesContainer}>
                      <TextInput
                        style={styles.occurrencesInput}
                        keyboardType="number-pad"
                        value={endCount}
                        onChangeText={(text) => {
                          const sanitizedText = text.replace(/[^0-9]/g, "");
                          setEndCount(sanitizedText);
                        }}
                        mode="outlined"
                        disabled={endType !== "count"}
                        theme={{ colors: { text: theme.colors.text } }}
                      />
                      <Text style={{ color: theme.colors.text, marginLeft: 8 }}>
                        occurrences
                      </Text>
                    </View>
                  </View>
                </RadioButton.Group>
              </View>

              {/* Date picker */}
              {showDatePicker && Platform.OS !== "web" && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  accentColor={theme.colors.primary}
                  themeVariant={theme.dark ? "dark" : "light"}
                />
              )}

              {/* Action buttons */}
              <View style={styles.buttonContainer}>
                <Button
                  onPress={onDismiss}
                  style={styles.cancelButton}
                  labelStyle={{ color: theme.colors.text }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleConfirm}
                  style={[
                    styles.doneButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  Done
                </Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    width: "100%",
  },
  surface: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 18,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  numberInput: {
    width: 80,
    height: 50,
  },
  typeButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 4,
    flex: 1,
    maxWidth: "60%", // Limit the width
  },
  typeButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "500",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dateButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  occurrencesContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 12,
  },
  occurrencesInput: {
    width: 80,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    // Ensure buttons stay inside the modal
    marginBottom: 8,
  },
  cancelButton: {
    marginRight: 12,
  },
  doneButton: {
    minWidth: 100,
  },
});

export default CustomRecurrenceModal;
