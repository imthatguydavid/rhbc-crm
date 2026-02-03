/**
 * Represents a child check-in/check-out record for childcare tracking.
 *
 * Each check-in creates a record when a child arrives, generates a unique
 * PIN for secure pickup, and tracks the checkout when child is released.
 * Supports both PIN-based checkout and manual override for emergencies.
 */
export interface CheckIn {
  /**
   * Unique identifier for this check-in event.
   * Generated as a timestamp-based ID when child is checked in.
   *
   * @example "chk-1738425600000-m9x4p7w"
   */
  checkInId: string;

  /**
   * Reference to the child being checked in.
   * Links to Person.personId where Person.role === 'child'.
   *
   * @example "per-1738425600000-a5n8k3r"
   */
  childId: string;

  /**
   * Reference to the child's family.
   * Links to Family.familyId for quick family lookups.
   * Denormalized for performance - avoids joining through Person.
   *
   * @example "fam-1738425600000-x7k9m2p"
   */
  familyId: string;

  /**
   * ISO 8601 timestamp when child was checked in.
   * Recorded at the moment parent drops off child.
   *
   * @example "2026-02-02T09:15:00.000Z"
   */
  checkInTime: string;

  /**
   * ISO 8601 timestamp when child was checked out.
   * Null while child is still in childcare.
   * Set when parent successfully retrieves child.
   *
   * @example "2026-02-02T11:45:00.000Z"
   * @example null  // Child still checked in
   */
  checkOutTime: string | null;

  /**
   * 4-digit PIN code required for checkout.
   * Generated automatically at check-in time.
   * Parent must provide this PIN to retrieve child.
   *
   * Security feature prevents unauthorized pickups.
   *
   * @example "1234"
   * @example "9876"
   */
  checkOutPin: string;

  /**
   * Method used to check out the child.
   * - "pin": Normal checkout with correct PIN entry
   * - "manual_override": Emergency checkout without PIN (requires notes)
   * - null: Child not yet checked out
   *
   * @example "pin"
   * @example "manual_override"
   * @example null  // Still checked in
   */
  checkOutMethod: 'pin' | 'manual_override' | null;

  /**
   * Explanation for manual override checkout.
   * Required when checkOutMethod is "manual_override".
   * Documents why normal PIN procedure was bypassed.
   *
   * Used for audit trail and accountability.
   *
   * @example "Parent forgot PIN, verified ID"
   * @example "Medical emergency, released to ambulance"
   * @example null  // Normal PIN checkout or still checked in
   */
  manualOverrideNotes: string | null;

  /**
   * Current status of the check-in.
   * - "active": Child is currently checked in (not yet picked up)
   * - "completed": Child has been checked out (picked up by parent)
   *
   * This field enables efficient querying for active check-ins.
   * Without it, we'd need to scan for checkOutTime === null (expensive).
   *
   * Changes from "active" to "completed" when child is checked out.
   *
   * @example "active"   // Child still in childcare
   * @example "completed"  // Child has been picked up
   */
  status: 'active' | 'completed';

  /**
   * Childcare room or class assignment.
   * Indicates where child was placed for age-appropriate care.
   *
   * @example "Nursery A"
   * @example "Toddler Room"
   * @example "Preschool"
   * @example "Elementary - Room 3"
   */
  room: string;

  /**
   * ISO 8601 timestamp when check-in record was created.
   * Usually matches checkInTime but represents database record creation.
   *
   * @example "2026-02-02T09:15:00.000Z"
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp when check-in record was last updated.
   * Updated when child is checked out or record is modified.
   *
   * @example "2026-02-02T11:45:00.000Z"
   */
  updatedAt: string;


}