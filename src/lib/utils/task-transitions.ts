/**
 * Task Status Transitions — Single source of truth
 *
 * Valid transitions:
 *   created → approved → prepared → assigned → accepted → in_progress → completed
 *
 * Special transitions:
 *   Any status → completed (admin override)
 *   Any status → not_approved (admin override)
 *   completed → created (mechanic flags additional work needed)
 */

export type TaskStatus =
  | "created"
  | "approved"
  | "prepared"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "not_approved";

const STANDARD_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  created: ["approved", "not_approved", "completed"],
  approved: ["prepared", "not_approved", "completed"],
  prepared: ["assigned", "not_approved", "completed"],
  assigned: ["accepted", "not_approved", "completed"],
  accepted: ["in_progress", "not_approved", "completed"],
  in_progress: ["completed", "not_approved"],
  completed: ["created"], // mechanic flags additional work
  not_approved: [], // terminal state
};

export function isValidTransition(
  from: TaskStatus,
  to: TaskStatus
): boolean {
  return STANDARD_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidNextStatuses(current: TaskStatus): TaskStatus[] {
  return STANDARD_TRANSITIONS[current] ?? [];
}

export function validateTransition(
  from: TaskStatus,
  to: TaskStatus
): { valid: boolean; error?: string } {
  if (isValidTransition(from, to)) {
    return { valid: true };
  }
  return {
    valid: false,
    error: `Invalid status transition: ${from} → ${to}. Valid transitions from "${from}": ${getValidNextStatuses(from).join(", ") || "none"}`,
  };
}
