export type TaskGroupStatus =
  | "assigned"
  | "inProgress"
  | "submitted"
  | "reviewed"
  | "reopened";

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

export interface GroupMember {
  id: string;
  displayName?: string;
  role: "admin" | "member";
  joinedAt: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: string[];
  createdAt: number;
  updatedAt: number;
}
