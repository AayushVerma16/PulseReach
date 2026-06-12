/**
 * Message Status State Machine
 * 
 * Valid transitions:
 *   queued → sent → delivered → opened → clicked
 *                 → failed
 *
 * The hierarchy (rank) prevents status regressions.
 */

const STATUS_RANK: Record<string, number> = {
  queued: 0,
  sent: 1,
  delivered: 2,
  failed: 2, // Same rank as delivered — terminal branch
  opened: 3,
  clicked: 4,
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  queued: ["sent"],
  sent: ["delivered", "failed"],
  delivered: ["opened"],
  opened: ["clicked"],
  failed: [], // terminal
  clicked: [], // terminal
};

/**
 * Check if a status transition is valid (forward progression only).
 */
export function isValidTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  // A "failed" message can't transition to anything
  if (currentStatus === "failed") return false;

  // Must be a forward progression
  const currentRank = STATUS_RANK[currentStatus] ?? -1;
  const newRank = STATUS_RANK[newStatus] ?? -1;

  if (newRank <= currentRank) return false;

  // Check explicit valid transitions
  const validNext = VALID_TRANSITIONS[currentStatus] ?? [];
  return validNext.includes(newStatus);
}

/**
 * Get the rank of a status for ordering purposes.
 */
export function getStatusRank(status: string): number {
  return STATUS_RANK[status] ?? -1;
}

/**
 * Get the timestamp field for a given status.
 */
export function getTimestampField(
  status: string
): "sentAt" | "deliveredAt" | "openedAt" | "clickedAt" | null {
  switch (status) {
    case "sent":
      return "sentAt";
    case "delivered":
      return "deliveredAt";
    case "opened":
      return "openedAt";
    case "clicked":
      return "clickedAt";
    default:
      return null;
  }
}

/**
 * Get the campaign counter field to increment for a status.
 */
export function getCampaignCounterField(
  status: string
): "sentCount" | "deliveredCount" | "failedCount" | "openedCount" | "clickedCount" | null {
  switch (status) {
    case "sent":
      return "sentCount";
    case "delivered":
      return "deliveredCount";
    case "failed":
      return "failedCount";
    case "opened":
      return "openedCount";
    case "clicked":
      return "clickedCount";
    default:
      return null;
  }
}

/** All possible terminal statuses */
export const TERMINAL_STATUSES = ["failed", "clicked"] as const;

/** All statuses in order */
export const ALL_STATUSES = [
  "queued",
  "sent",
  "delivered",
  "failed",
  "opened",
  "clicked",
] as const;
