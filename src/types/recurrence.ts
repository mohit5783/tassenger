// Types for recurring tasks

export type RecurrenceType =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "yearly";
export type EndType = "date" | "count" | "never";

export interface RecurrencePattern {
  id: string;
  type: RecurrenceType;
  frequency: number; // e.g., every 2 days, every 3 weeks
  endType: EndType;
  endDate?: number; // timestamp
  endCount?: number; // number of occurrences
  createdBy: string; // user ID
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  taskTemplateId: string; // Reference to the original task template
}

export interface RecurrenceOptions {
  type: RecurrenceType;
  frequency: number;
  endType: EndType;
  endDate?: Date;
  endCount?: number;
}

// Default values for recurrence options based on type
export const DEFAULT_RECURRENCE_OPTIONS: Record<
  RecurrenceType,
  { endType: EndType; endCount?: number }
> = {
  daily: { endType: "count", endCount: 30 },
  weekly: { endType: "count", endCount: 12 },
  monthly: { endType: "count", endCount: 12 },
  quarterly: { endType: "count", endCount: 4 },
  "half-yearly": { endType: "count", endCount: 2 },
  yearly: { endType: "count", endCount: 1 },
};

// Helper function to get a human-readable description of a recurrence pattern
export function getRecurrenceDescription(options: RecurrenceOptions): string {
  let description = "";

  // Frequency and type
  if (options.frequency === 1) {
    description += `Every ${options.type.slice(0, -2)}`;
  } else {
    description += `Every ${options.frequency} ${options.type}`;
  }

  // End condition
  if (options.endType === "date" && options.endDate) {
    const date = new Date(options.endDate);
    description += ` until ${date.toLocaleDateString()}`;
  } else if (options.endType === "count" && options.endCount) {
    description += `, ${options.endCount} times`;
  }

  return description;
}
