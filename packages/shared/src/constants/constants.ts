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
 * Type exports for constants
 */
export type CheckInStatus = (typeof CHECK_IN_STATUS)[keyof typeof CHECK_IN_STATUS];
export type CheckoutMethod = (typeof CHECKOUT_METHOD)[keyof typeof CHECKOUT_METHOD];
export type FamilyStatus = (typeof FAMILY_STATUS)[keyof typeof FAMILY_STATUS];
export type PersonRole = (typeof PERSON_ROLE)[keyof typeof PERSON_ROLE];
export type Room = (typeof ROOMS)[number];
