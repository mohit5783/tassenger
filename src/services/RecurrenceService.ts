import { addDays, addWeeks, addMonths, addYears } from "date-fns";
import type { RecurrencePattern, RecurrenceOptions } from "../types/recurrence";
import type { Task } from "../store/slices/taskSlice";

export class RecurrenceService {
  /**
   * Calculate the next occurrence date based on a recurrence pattern and previous date
   */
  static calculateNextOccurrenceDate(
    pattern: RecurrencePattern | RecurrenceOptions,
    previousDate: Date
  ): Date {
    const { type, frequency } = pattern;

    switch (type) {
      case "daily":
        return addDays(previousDate, frequency);
      case "weekly":
        return addWeeks(previousDate, frequency);
      case "monthly":
        return addMonths(previousDate, frequency);
      case "quarterly":
        return addMonths(previousDate, 3 * frequency);
      case "half-yearly":
        return addMonths(previousDate, 6 * frequency);
      case "yearly":
        return addYears(previousDate, frequency);
      default:
        throw new Error(`Unknown recurrence type: ${type}`);
    }
  }

  /**
   * Generate a preview of upcoming occurrences
   */
  static generateOccurrencePreview(
    options: RecurrenceOptions,
    startDate: Date,
    count = 5
  ): Date[] {
    const dates: Date[] = [];
    let currentDate = startDate;

    for (let i = 0; i < count; i++) {
      currentDate = this.calculateNextOccurrenceDate(options, currentDate);
      dates.push(new Date(currentDate));

      // If we've reached the end condition, stop generating dates
      if (
        options.endType === "count" &&
        options.endCount &&
        i + 1 >= options.endCount
      ) {
        break;
      }

      if (
        options.endType === "date" &&
        options.endDate &&
        currentDate > options.endDate
      ) {
        break;
      }
    }

    return dates;
  }

  /**
   * Check if a recurrence pattern has ended
   */
  static hasRecurrenceEnded(
    pattern: RecurrencePattern,
    currentIndex: number,
    currentDate: Date
  ): boolean {
    if (pattern.endType === "never") {
      return false;
    }

    if (pattern.endType === "count" && pattern.endCount) {
      return currentIndex >= pattern.endCount;
    }

    if (pattern.endType === "date" && pattern.endDate) {
      return currentDate.getTime() > pattern.endDate;
    }

    return false;
  }

  /**
   * Create a task object from a template and due date
   */
  static createTaskFromTemplate(
    taskTemplate: Partial<Task>,
    dueDate: Date,
    recurrencePatternId: string,
    recurrenceIndex: number
  ): Partial<Task> {
    return {
      ...taskTemplate,
      dueDate: dueDate.getTime(),
      isRecurring: true,
      recurrencePatternId,
      recurrenceIndex,
      status: "todo", // Always start as todo
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}
