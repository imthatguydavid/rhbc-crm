import { FAMILY_STATUS, CHECKOUT_METHOD, FamilyStatus, CheckoutMethod } from '@rhbc-crm/shared';

/**
 * Badge utility functions for consistent badge rendering
 */

/**
 * Get badge props for family status
 */
export function getFamilyStatusBadge(status: FamilyStatus) {
  const isMember = status === FAMILY_STATUS.MEMBER;

  return {
    label: isMember ? 'Member' : 'Guest',
    className: isMember
      ? 'bg-green-100 text-green-800 hover:bg-green-100'
      : 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  };
}

/**
 * Get badge props for checkout method
 */
export function getCheckoutMethodBadge(method: CheckoutMethod) {
  const isPin = method === CHECKOUT_METHOD.PIN;

  return {
    label: isPin ? 'PIN' : 'Staff',
    className: isPin
      ? 'bg-green-100 text-green-800 hover:bg-green-100'
      : 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  };
}

/**
 * Get badge props for room display
 */
export function getRoomBadge(room: string) {
  return {
    label: room,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  };
}
