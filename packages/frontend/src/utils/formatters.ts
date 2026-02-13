/**
 * Formatting utilities for consistent display across the application
 */

/**
 * Formats a phone number as (XXX) XXX-XXXX
 *
 * @param phone - Raw phone number string
 * @returns Formatted phone number or original string if invalid format
 *
 * @example
 * formatPhone('1234567890') // Returns: '(123) 456-7890'
 * formatPhone('123-456-7890') // Returns: '(123) 456-7890'
 * formatPhone('invalid') // Returns: 'invalid'
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

/**
 * Formats a date as "Feb 10, 2026"
 *
 * @param isoString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a date and time as "Feb 10, 9:30 AM"
 *
 * @param isoString - ISO date string
 * @returns Formatted date and time string
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
