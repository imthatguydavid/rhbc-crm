/**
 * Represents a childcare check-in record.
 *
 * Tracks when children arrive at childcare and their secure
 * check-out via PIN verification.
 */
export interface CheckIn {
  /**
   * Unique identifier for this check-in.
   *
   * @example "770e8400-e29b-41d4-a716-446655440002"
   */
  checkInId: string;

  /**
   * Reference to the child being checked in.
   * Foreign key to Person.personId (must be role='child').
   *
   * @example "660e8400-e29b-41d4-a716-446655440001"
   */
  childId: string;

  /**
   * Reference to the child's family.
   * Foreign key to Family.familyId.
   * Denormalized for faster queries (instead of joining through Person).
   *
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  familyId: string;

  /**
   * ISO 8601 timestamp when child was checked in.
   *
   * @example "2026-01-31T10:30:00.000Z"
   */
  checkInTime: string;

  /**
   * ISO 8601 timestamp when child was checked out.
   * Null if child is currently checked in.
   *
   * @example "2026-01-31T12:00:00.000Z"
   */
  checkOutTime: string | null;

  /**
   * 4-digit PIN for secure check-out.
   * Randomly generated at check-in.
   * Parent must provide this PIN to pick up child.
   *
   * @example "7392"
   */
  checkOutPin: string;

  /**
   * How the child was checked out.
   * - "pin": Normal check-out with PIN verification
   * - "manual_override": Staff override (with notes explaining why)
   * Null if not yet checked out.
   */
  checkOutMethod: 'pin' | 'manual_override' | null;

  /**
   * Explanation for manual override check-out.
   * Required when checkOutMethod is "manual_override".
   *
   * @example "Parent forgot PIN, verified ID"
   */
  manualOverrideNotes: string | null;

  /**
   * Room or location where child is checked in.
   * Optional in MVP, will be used in post-MVP for room assignment.
   *
   * @example "Nursery" | "Toddler Room" | "Elementary"
   */
  room: string | null;

  /**
   * ISO 8601 timestamp when record was created.
   *
   * @example "2026-01-31T10:30:00.000Z"
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp when record was last updated.
   *
   * @example "2026-01-31T12:00:00.000Z"
   */
  updatedAt: string;
}