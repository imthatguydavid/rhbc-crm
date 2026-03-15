/**
 * Application-wide constants for type safety and consistency.
 * Using constants prevents typos and makes refactoring easier.
 */

/**
 * Check-in status values
 */
export const CHECK_IN_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

/**
 * Checkout methods - how a child was checked out
 */
export const CHECKOUT_METHOD = {
  /** Parent checked out using PIN on kiosk */
  PIN: 'pin',
  /** Staff manually checked out child via admin portal */
  STAFF_OVERRIDE: 'manual_override',
  /** null: Child not yet checked out */
  NULL: null,
} as const;

/**
 * Family membership status
 */
export const FAMILY_STATUS = {
  MEMBER: 'member',
  GUEST: 'guest',
} as const;

/**
 * Person roles in a family
 */
export const PERSON_ROLE = {
  PARENT: 'parent',
  CHILD: 'child',
} as const;

/**
 * Available rooms for check-in
 */
export const ROOMS = ['Nursery', 'Toddlers', 'Preschool', 'Elementary', 'Youth Room'] as const;

/**
 * Standardized API error codes.
 * Used in error responses for programmatic error handling.
 * Frontend checks these codes to determine UI behavior.
 */
export const ERROR_CODE = {
  // Validation (400)
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_STATUS: 'INVALID_STATUS',
  NO_UPDATE_FIELDS: 'NO_UPDATE_FIELDS',

  // Business logic (400)
  ALREADY_CHECKED_IN: 'ALREADY_CHECKED_IN',
  ALREADY_CHECKED_OUT: 'ALREADY_CHECKED_OUT',
  ALREADY_DELETED: 'ALREADY_DELETED',
  INVALID_PIN: 'INVALID_PIN',
  NO_ACTIVE_CHECKINS: 'NO_ACTIVE_CHECKINS',

  // Not found (404)
  FAMILY_NOT_FOUND: 'FAMILY_NOT_FOUND',
  PERSON_NOT_FOUND: 'PERSON_NOT_FOUND',
  CHECKIN_NOT_FOUND: 'CHECKIN_NOT_FOUND',

  // Server (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * Type exports for constants
 */
export type CheckInStatus = (typeof CHECK_IN_STATUS)[keyof typeof CHECK_IN_STATUS];
export type CheckoutMethod = (typeof CHECKOUT_METHOD)[keyof typeof CHECKOUT_METHOD];
export type FamilyStatus = (typeof FAMILY_STATUS)[keyof typeof FAMILY_STATUS];
export type PersonRole = (typeof PERSON_ROLE)[keyof typeof PERSON_ROLE];
export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];
export type Room = (typeof ROOMS)[number];
