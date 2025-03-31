// Group and role types
export type GroupRole = "admin" | "member";

export interface GroupMember {
  id: string;
  userId: string;
  userName?: string;
  role: GroupRole;
  joinedAt: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  members: GroupMember[];
  hasChat: boolean;
  conversationId?: string; // Add this property
}

// Enhanced task types for role-based assignment
export interface TaskAssignment {
  assigneeId: string;
  assigneeName?: string;
  reviewerId?: string;
  reviewerName?: string;
  assignedAt: number;
  lastStatusChangeAt: number;
}

export interface TaskRejection {
  id: string;
  taskId: string;
  reviewerId: string;
  reviewerName?: string;
  reason: string;
  timestamp: number;
}

export type TaskGroupStatus =
  | "assigned"
  | "inProgress"
  | "doneByAssignee"
  | "pendingReview"
  | "reviewed"
  | "reopened";
