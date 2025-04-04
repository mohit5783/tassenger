import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  isAfter,
  isEqual,
} from "date-fns";
import type {
  RecurrenceOptions,
  RecurrenceType,
  RecurrencePattern,
} from "../types/recurrence";

export class RecurrenceService {
  static generateOccurrencePreview(
    options: RecurrenceOptions,
    startDate: Date,
    maxOccurrences = 5
  ): Date[] {
    const occurrences: Date[] = [];
    let currentDate = new Date(startDate);
    let count = 0;

    while (occurrences.length < maxOccurrences) {
      // Skip the first date (it's the original due date)
      if (count > 0) {
        // Add the date to our occurrences
        occurrences.push(new Date(currentDate));
      }

      // Move to the next occurrence
      currentDate = this.getNextOccurrence(
        currentDate,
        options.type,
        options.frequency
      );
      count++;

      // Check if we should stop based on end conditions
      if (options.endType === "count" && count >= (options.endCount || 0)) {
        break;
      }

      if (
        options.endType === "date" &&
        options.endDate &&
        isAfter(currentDate, options.endDate)
      ) {
        break;
      }
    }

    return occurrences;
  }

  static generateAllOccurrences(
    options: RecurrenceOptions,
    startDate: Date
  ): Date[] {
    const occurrences: Date[] = [new Date(startDate)];
    let currentDate = new Date(startDate);
    let count = 1; // Start at 1 because we already have the first occurrence

    // Maximum safety limit to prevent infinite loops
    const MAX_OCCURRENCES = 1000;

    while (count < MAX_OCCURRENCES) {
      // Move to the next occurrence
      currentDate = this.getNextOccurrence(
        currentDate,
        options.type,
        options.frequency
      );

      // Check if we should stop based on end conditions
      if (options.endType === "count" && count >= (options.endCount || 0)) {
        break;
      }

      if (
        options.endType === "date" &&
        options.endDate &&
        (isAfter(currentDate, options.endDate) ||
          isEqual(currentDate, options.endDate))
      ) {
        break;
      }

      // Add the date to our occurrences
      occurrences.push(new Date(currentDate));
      count++;
    }

    return occurrences;
  }

  static getNextOccurrence(
    date: Date,
    type: RecurrenceType,
    frequency = 1
  ): Date {
    const newDate = new Date(date);

    switch (type) {
      case "daily":
        return addDays(newDate, frequency);
      case "weekly":
        return addWeeks(newDate, frequency);
      case "monthly":
        return addMonths(newDate, frequency);
      case "quarterly":
        return addMonths(newDate, frequency * 3);
      case "half-yearly":
        return addMonths(newDate, frequency * 6);
      case "yearly":
        return addYears(newDate, frequency);
      default:
        return addDays(newDate, frequency);
    }
  }

  static getRecurrenceDescription(options: RecurrenceOptions): string {
    let description = `Repeats ${
      options.frequency > 1 ? `every ${options.frequency} ` : ""
    }${options.type}`;

    if (options.endType === "never") {
      description += " indefinitely";
    } else if (options.endType === "count" && options.endCount) {
      description += `, ${options.endCount} times`;
    } else if (options.endType === "date" && options.endDate) {
      description += `, until ${format(options.endDate, "MMM d, yyyy")}`;
    }

    return description;
  }

  static prepareRecurrenceForFirestore(options: RecurrenceOptions): any {
    // Create a clean object for Firestore
    const firestoreData: any = {
      type: options.type,
      frequency: options.frequency,
      endType: options.endType,
    };

    // Only add endCount if endType is count
    if (options.endType === "count" && options.endCount) {
      firestoreData.endCount = options.endCount;
    }

    // Only add endDate if endType is date and we have a valid date
    if (options.endType === "date" && options.endDate) {
      firestoreData.endDate = options.endDate.getTime();
    }

    return firestoreData;
  }

  // Add the missing methods that are causing TypeScript errors

  /**
   * Checks if a recurrence pattern has ended based on its end conditions
   */
  static hasRecurrenceEnded(
    pattern: RecurrencePattern,
    currentIndex: number,
    currentDate: Date
  ): boolean {
    // If end type is count, check if we've reached the end count
    if (pattern.endType === "count" && pattern.endCount) {
      return currentIndex > pattern.endCount;
    }

    // If end type is date, check if current date is after end date
    if (pattern.endType === "date" && pattern.endDate) {
      const endDate = new Date(pattern.endDate);
      return isAfter(currentDate, endDate);
    }

    // If end type is never, it never ends
    return false;
  }

  /**
   * Calculates the next occurrence date based on the recurrence pattern
   */
  static calculateNextOccurrenceDate(
    pattern: RecurrencePattern,
    previousDueDate: Date
  ): Date {
    return this.getNextOccurrence(
      previousDueDate,
      pattern.type,
      pattern.frequency
    );
  }
}
