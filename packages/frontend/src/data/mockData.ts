import type { Family, Person, CheckIn } from '@rhbc-crm/shared';

/**
 * Mock families for development and testing
 */
export const mockFamilies: Family[] = [
  {
    familyId: 'fam-001',
    pk: 'FAMILY',
    lastName: 'Johnson',
    status: 'member',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    familyId: 'fam-002',
    pk: 'FAMILY',
    lastName: 'Smith',
    status: 'member',
    createdAt: '2024-02-20T14:30:00Z',
    updatedAt: '2024-02-20T14:30:00Z',
  },
  {
    familyId: 'fam-003',
    pk: 'FAMILY',
    lastName: 'Garcia',
    status: 'guest',
    createdAt: '2024-11-01T09:15:00Z',
    updatedAt: '2024-11-01T09:15:00Z',
  },
  {
    familyId: 'fam-004',
    pk: 'FAMILY',
    lastName: 'Williams',
    status: 'member',
    createdAt: '2023-06-10T11:45:00Z',
    updatedAt: '2024-01-05T16:20:00Z',
  },
  {
    familyId: 'fam-005',
    pk: 'FAMILY',
    lastName: 'Chen',
    status: 'guest',
    createdAt: '2025-01-28T08:00:00Z',
    updatedAt: '2025-01-28T08:00:00Z',
  },
];

/**
 * Mock people for development and testing
 */
export const mockPeople: Person[] = [
  // Johnson family
  {
    personId: 'per-001',
    familyId: 'fam-001',
    firstName: 'Michael',
    phone: '7145551234',
    email: 'michael.johnson@email.com',
    role: 'parent',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    personId: 'per-002',
    familyId: 'fam-001',
    firstName: 'Sarah',
    phone: '7145551234',
    email: 'sarah.johnson@email.com',
    role: 'parent',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    personId: 'per-003',
    familyId: 'fam-001',
    firstName: 'Emma',
    role: 'child',
    allergies: 'Peanuts',
    notes: 'Needs EpiPen in classroom',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    personId: 'per-004',
    familyId: 'fam-001',
    firstName: 'Noah',
    role: 'child',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },

  // Smith family
  {
    personId: 'per-005',
    familyId: 'fam-002',
    firstName: 'David',
    phone: '7145555678',
    email: 'david.smith@email.com',
    role: 'parent',
    createdAt: '2024-02-20T14:30:00Z',
    updatedAt: '2024-02-20T14:30:00Z',
  },
  {
    personId: 'per-006',
    familyId: 'fam-002',
    firstName: 'Olivia',
    role: 'child',
    allergies: 'Dairy, Eggs',
    createdAt: '2024-02-20T14:30:00Z',
    updatedAt: '2024-02-20T14:30:00Z',
  },

  // Garcia family
  {
    personId: 'per-007',
    familyId: 'fam-003',
    firstName: 'Carlos',
    phone: '7145559012',
    role: 'parent',
    createdAt: '2024-11-01T09:15:00Z',
    updatedAt: '2024-11-01T09:15:00Z',
  },
  {
    personId: 'per-008',
    familyId: 'fam-003',
    firstName: 'Sofia',
    role: 'child',
    createdAt: '2024-11-01T09:15:00Z',
    updatedAt: '2024-11-01T09:15:00Z',
  },

  // Williams family
  {
    personId: 'per-009',
    familyId: 'fam-004',
    firstName: 'Jennifer',
    phone: '7145553456',
    email: 'jennifer.williams@email.com',
    role: 'parent',
    createdAt: '2023-06-10T11:45:00Z',
    updatedAt: '2024-01-05T16:20:00Z',
  },
  {
    personId: 'per-010',
    familyId: 'fam-004',
    firstName: 'Liam',
    role: 'child',
    notes: 'Shy, needs gentle encouragement',
    createdAt: '2023-06-10T11:45:00Z',
    updatedAt: '2024-01-05T16:20:00Z',
  },

  // Chen family
  {
    personId: 'per-011',
    familyId: 'fam-005',
    firstName: 'Wei',
    phone: '7145557890',
    role: 'parent',
    createdAt: '2025-01-28T08:00:00Z',
    updatedAt: '2025-01-28T08:00:00Z',
  },
  {
    personId: 'per-012',
    familyId: 'fam-005',
    firstName: 'Lily',
    role: 'child',
    allergies: 'Gluten',
    createdAt: '2025-01-28T08:00:00Z',
    updatedAt: '2025-01-28T08:00:00Z',
  },
];

/**
 * Mock check-ins for development and testing
 */
export const mockCheckIns: CheckIn[] = [
  {
    checkInId: 'chk-001',
    childId: 'per-003',
    familyId: 'fam-001',
    checkInTime: '2025-02-02T09:15:00Z',
    checkOutTime: null,
    checkOutPin: '1234',
    checkOutMethod: null,
    manualOverrideNotes: null,
    room: 'Nursery A',
    createdAt: '2025-02-02T09:15:00Z',
    updatedAt: '2025-02-02T09:15:00Z',
  },
  {
    checkInId: 'chk-002',
    childId: 'per-004',
    familyId: 'fam-001',
    checkInTime: '2025-02-02T09:15:00Z',
    checkOutTime: null,
    checkOutPin: '1234',
    checkOutMethod: null,
    manualOverrideNotes: null,
    room: 'Toddler Room',
    createdAt: '2025-02-02T09:15:00Z',
    updatedAt: '2025-02-02T09:15:00Z',
  },
  {
    checkInId: 'chk-003',
    childId: 'per-006',
    familyId: 'fam-002',
    checkInTime: '2025-02-02T09:30:00Z',
    checkOutTime: '2025-02-02T11:45:00Z',
    checkOutPin: '5678',
    checkOutMethod: 'pin',
    manualOverrideNotes: null,
    room: 'Preschool',
    createdAt: '2025-02-02T09:30:00Z',
    updatedAt: '2025-02-02T11:45:00Z',
  },
];

/**
 * Helper function to get people by family
 */
export function getPeopleByFamily(familyId: string): Person[] {
  return mockPeople.filter(person => person.familyId === familyId);
}

/**
 * Helper function to get children by family
 */
export function getChildrenByFamily(familyId: string): Person[] {
  return mockPeople.filter(
    person => person.familyId === familyId && person.role === 'child'
  );
}

/**
 * Helper function to get parents by family
 */
export function getParentsByFamily(familyId: string): Person[] {
  return mockPeople.filter(
    person => person.familyId === familyId && person.role === 'parent'
  );
}

/**
 * Helper function to get active check-ins (not checked out)
 */
export function getActiveCheckIns(): CheckIn[] {
  return mockCheckIns.filter(checkIn => checkIn.checkOutTime === null);
}

/**
 * Add a new family to mock data
 */
export function addMockFamily(family: Family): void {
  mockFamilies.push(family);
}

/**
 * Add a new person to mock data
 */
export function addMockPerson(person: Person): void {
  mockPeople.push(person);
}