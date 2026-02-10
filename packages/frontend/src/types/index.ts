import type { CheckIn } from '@rhbc-crm/shared';

/**
 * CheckIn enriched with display names for UI rendering.
 * Extends the base CheckIn type with child and family names
 * fetched from the People/Family tables.
 */
export type EnrichedCheckIn = CheckIn & {
  childName?: string;
  familyName?: string;
};
