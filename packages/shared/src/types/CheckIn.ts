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
   */
  checkInId: string;

  /**
   * Reference to the child being checked in.
   * Links to Person.personId where Person.role === 'child'.
   *
   */
  childId: string;

  /**
   * Reference to the child's family.
   * Links to Family.familyId for quick family lookups.
   * Denormalized for performance - avoids joining through Person.
   *
   */
  familyId: string;

  /**
   * ISO 8601 timestamp when child was checked in.
   * Recorded at the moment parent drops off child.
   *
   */
  checkInTime: string;

  /**
   * ISO 8601 timestamp when child was checked out.
   * Null while child is still in childcare.
   * Set when parent successfully retrieves child.
   *
   */
  checkOutTime: string | null;

  /**
   * 4-digit PIN code required for checkout.
   * Generated automatically at check-in time.
   * Parent must provide this PIN to retrieve child.
   *
   * Security feature prevents unauthorized pickups.
   *
   */
  checkOutPin: string;

  /**
   * Method used to check out the child.
   * - "pin": Normal checkout with correct PIN entry
   * - "manual_override": Emergency checkout without PIN (requires notes)
   * - null: Child not yet checked out
   *
   */
  checkOutMethod: 'pin' | 'manual_override' | null;

  /**
   * Explanation for manual override checkout.
   * Required when checkOutMethod is "manual_override".
   * Documents why normal PIN procedure was bypassed.
   *
   * Used for audit trail and accountability.
   *
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
   */
  room: string;

  /**
   * ISO 8601 timestamp when check-in record was created.
   * Usually matches checkInTime but represents database record creation.
   *
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp when check-in record was last updated.
   * Updated when child is checked out or record is modified.
   *
   */
  updatedAt: string;

  /**
   * Name of the person who picked up the child.
   * Captured during checkout for accountability and safety.
   *
   * - Kiosk checkout: Parent/guardian enters their name
   * - Admin checkout: Logged-in user's name (future feature)
   * - Null if child not yet checked out
   *
   */
  checkedOutBy: string | null;

  /**
   * User ID of admin who performed checkout.
   * Only populated for manual admin checkouts.
   * Null for kiosk self-service checkouts or if not yet checked out.
   *
   * Future feature when Cognito authentication is added.
   *
   */
  checkedOutByUserId: string | null;
}

export type CheckInChildRequest = Pick<CheckIn, 'childId' | 'familyId' | 'room'>;
export type CheckInChildResponse = {
  checkIn: CheckIn;
  pin: string;
};

export interface CheckOutChildRequest {
  checkInId: string;
  pin: string;
}
export interface CheckOutChildResponse {
  checkIn: CheckIn;
  message: string;
}

/**
 * Payload for bulk checking in multiple children via POST /checkin/bulk.
 */
export interface BulkCheckInChildrenRequest {
  familyId: string;
  childIds: string[];
  room: string;
}

/**
 * Response from POST /checkin/bulk.
 */
export interface BulkCheckInChildrenResponse {
  checkIns: CheckIn[];
  pin: string;
}

/**
 * Payload for checking out children by PIN via POST /checkout/pin.
 */
export interface CheckOutByPinRequest {
  pin: string;
  checkedOutBy: string;
}

/**
 * Response from POST /checkout/pin.
 */
export interface CheckOutByPinResponse {
  checkIns: Array<CheckIn & { childName?: string }>;
  message: string;
}
/**
 * Payload for validating a PIN before checkout via POST /checkout/pin/validate.
 */
export interface ValidatePinRequest {
  pin: string;
}

/**
 * Response from POST /checkout/pin/validate.
 */
export interface ValidatePinResponse {
  familyId: string;
  lastName: string;
  children: Array<{ personId: string; firstName: string }>;
  parents: Array<{ personId: string; firstName: string }>;
}

/**
 * Payload for admin checkout via POST /checkin/{checkInId}/checkout.
 * checkInId comes from the URL path parameter.
 */
export interface AdminCheckOutRequest {
  checkedOutBy: string;
}

/**
 * Response from POST /checkin/{checkInId}/checkout.
 */
export interface AdminCheckOutResponse {
  checkIn: CheckIn;
  childName?: string;
}
