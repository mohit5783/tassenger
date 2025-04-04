"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  RadioButton,
  TextInput,
  Button,
  Divider,
  Switch,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, addMonths } from "date-fns";
import { useTheme } from "../theme/ThemeProvider";
import {
  type RecurrenceOptions,
  type RecurrenceType,
  type EndType,
  DEFAULT_RECURRENCE_OPTIONS,
} from "../types/recurrence";
import { RecurrenceService } from "../services/RecurrenceService";

interface RecurrenceSelectorProps {
  initialDueDate: Date;
  onRecurrenceChange: (options: RecurrenceOptions | null) => void;
  initialOptions?: RecurrenceOptions | null;
}

const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({
  initialDueDate,
  onRecurrenceChange,
  initialOptions = null,
}) => {
  const { theme } = useTheme();
  const [isRecurring, setIsRecurring] = useState<boolean>(!!initialOptions);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    initialOptions?.type || "weekly"
  );
  const [frequency, setFrequency] = useState<number>(
    initialOptions?.frequency || 1
  );
  const [endType, setEndType] = useState<EndType>(
    initialOptions?.endType ||
      DEFAULT_RECURRENCE_OPTIONS[recurrenceType].endType
  );
  const [endDate, setEndDate] = useState<Date>(
    initialOptions?.endDate || addMonths(new Date(), 3)
  );
  const [endCount, setEndCount] = useState<number>(
    initialOptions?.endCount ||
      DEFAULT_RECURRENCE_OPTIONS[recurrenceType].endCount ||
      10
  );
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [previewDates, setPreviewDates] = useState<Date[]>([]);

  // Update recurrence options when any value changes
  useEffect(() => {
    if (!isRecurring) {
      onRecurrenceChange(null);
      return;
    }

    const options: RecurrenceOptions = {
      type: recurrenceType,
      frequency,
      endType,
      ...(endType === "date" ? { endDate } : {}),
      ...(endType === "count" ? { endCount } : {}),
    };

    onRecurrenceChange(options);

    // Generate preview dates
    try {
      const preview = RecurrenceService.generateOccurrencePreview(
        options,
        initialDueDate,
        3
      );
      setPreviewDates(preview);
    } catch (error) {
      console.error("Error generating preview dates:", error);
      setPreviewDates([]);
    }
  }, [
    isRecurring,
    recurrenceType,
    frequency,
    endType,
    endDate,
    endCount,
    initialDueDate,
  ]);

  // Update default end values when recurrence type changes
  useEffect(() => {
    const defaults = DEFAULT_RECURRENCE_OPTIONS[recurrenceType];
    setEndType(defaults.endType);
    if (defaults.endCount) {
      setEndCount(defaults.endCount);
    }
  }, [recurrenceType]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  if (!isRecurring) {
    return (
      <View style={styles.container}>
        <View style={styles.switchContainer}>
          <Text style={{ color: theme.colors.text }}>
            Make this task recurring
          </Text>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            color={theme.colors.primary}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.switchContainer}>
        <Text style={{ color: theme.colors.text }}>
          Make this task recurring
        </Text>
        <Switch
          value={isRecurring}
          onValueChange={setIsRecurring}
          color={theme.colors.primary}
        />
      </View>

      {isRecurring && (
        <>
          <Divider style={styles.divider} />

          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Repeat
          </Text>

          <RadioButton.Group
            onValueChange={(value) =>
              setRecurrenceType(value as RecurrenceType)
            }
            value={recurrenceType}
          >
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="Daily"
                value="daily"
                position="leading"
                labelStyle={styles.radioLabel}
                color={theme.colors.primary}
              />
              <RadioButton.Item
                label="Weekly"
                value="weekly"
                position="leading"
                labelStyle={styles.radioLabel}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="Monthly"
                value="monthly"
                position="leading"
                labelStyle={styles.radioLabel}
                color={theme.colors.primary}
              />
              <RadioButton.Item
                label="Quarterly"
                value="quarterly"
                position="leading"
                labelStyle={styles.radioLabel}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.radioRow}>
              <RadioButton.Item
                label="Half-Yearly"
                value="half-yearly"
                position="leading"
                labelStyle={styles.radioLabel}
                color={theme.colors.primary}
              />
              <RadioButton.Item
                label="Yearly"
                value="yearly"
                position="leading"
                labelStyle={styles.radioLabel}
                color={theme.colors.primary}
              />
            </View>
          </RadioButton.Group>

          <View style={styles.frequencyContainer}>
            <Text style={{ color: theme.colors.text }}>Repeat every</Text>
            <TextInput
              style={styles.frequencyInput}
              keyboardType="number-pad"
              value={frequency.toString()}
              onChangeText={(text) => {
                const value = Number.parseInt(text) || 1;
                if (value > 0) setFrequency(value);
              }}
              mode="outlined"
              theme={{ colors: { text: theme.colors.text } }}
            />
            <Text style={{ color: theme.colors.text }}>
              {frequency === 1 ? recurrenceType.slice(0, -2) : recurrenceType}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Ends
          </Text>

          <RadioButton.Group
            onValueChange={(value) => setEndType(value as EndType)}
            value={endType}
          >
            <RadioButton.Item
              label="Never"
              value="never"
              position="leading"
              labelStyle={styles.radioLabel}
              color={theme.colors.primary}
            />

            <View style={styles.endOptionRow}>
              <RadioButton
                value="count"
                status={endType === "count" ? "checked" : "unchecked"}
                color={theme.colors.primary}
                onPress={() => setEndType("count")}
              />
              <Text style={{ color: theme.colors.text }}>After</Text>
              <TextInput
                style={styles.countInput}
                keyboardType="number-pad"
                value={endCount.toString()}
                onChangeText={(text) => {
                  const value = Number.parseInt(text) || 1;
                  if (value > 0) setEndCount(value);
                }}
                mode="outlined"
                disabled={endType !== "count"}
                theme={{ colors: { text: theme.colors.text } }}
              />
              <Text style={{ color: theme.colors.text }}>occurrences</Text>
            </View>

            <View style={styles.endOptionRow}>
              <RadioButton
                value="date"
                status={endType === "date" ? "checked" : "unchecked"}
                color={theme.colors.primary}
                onPress={() => setEndType("date")}
              />
              <Text style={{ color: theme.colors.text }}>On date</Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                disabled={endType !== "date"}
                textColor={theme.colors.text}
              >
                {format(endDate, "MMM d, yyyy")}
              </Button>
            </View>
          </RadioButton.Group>

          {showDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          <Divider style={styles.divider} />

          {previewDates.length > 0 && (
            <View style={styles.previewContainer}>
              <Text
                style={[styles.sectionTitle, { color: theme.colors.primary }]}
              >
                Preview
              </Text>
              <Text
                style={{ color: theme.colors.textSecondary, marginBottom: 8 }}
              >
                Next {previewDates.length} occurrences:
              </Text>

              {previewDates.map((date, index) => (
                <Text
                  key={index}
                  style={[styles.previewDate, { color: theme.colors.text }]}
                >
                  {format(date, "EEEE, MMMM d, yyyy")}
                </Text>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  radioLabel: {
    fontSize: 14,
  },
  frequencyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  frequencyInput: {
    width: 60,
    marginHorizontal: 8,
    height: 40,
  },
  endOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  countInput: {
    width: 60,
    marginHorizontal: 8,
    height: 40,
  },
  previewContainer: {
    marginTop: 8,
  },
  previewDate: {
    marginVertical: 4,
    fontSize: 14,
  },
});

export default RecurrenceSelector;
