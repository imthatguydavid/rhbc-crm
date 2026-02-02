import { useState } from 'react';
import type { Family, Person } from '@rhbc-crm/shared';
import { mockFamilies as initialFamilies, mockPeople as initialPeople } from './data/mockData';
import { FamilyList } from './components/FamilyList';
import { FamilyDetails } from './components/FamilyDetails';
import { AddFamilyDialog } from './components/AddFamilyDialog';
import { StatsCard } from './components/StatsCard';
import { Button } from './components/ui/button';

function App() {
  // Move mock data into React state
  const [families, setFamilies] = useState<Family[]>(initialFamilies);
  const [people, setPeople] = useState<Person[]>(initialPeople);

  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const memberFamilies = families.filter(f => f.status === 'member');
  const guestFamilies = families.filter(f => f.status === 'guest');
  const children = people.filter(p => p.role === 'child');

  const handleViewDetails = (family: Family) => {
    setSelectedFamily(family);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setTimeout(() => setSelectedFamily(null), 200);
  };

  const handleAddFamily = (
    family: Family,
    parentData: { firstName: string; phone: string; email?: string }
  ) => {
    // Create parent person
    const parent: Person = {
      personId: `per-${Date.now()}`,
      familyId: family.familyId,
      firstName: parentData.firstName,
      phone: parentData.phone,
      email: parentData.email,
      role: 'parent',
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
    };

    // Update state with NEW arrays (immutable update)
    setFamilies(prev => [...prev, family]);  // ← New array reference!
    setPeople(prev => [...prev, parent]);    // ← New array reference!
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">RHBC CRM</h1>
              <p className="mt-1 text-sm text-slate-600">
                Church Management System
              </p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              Add Family
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Families"
              value={families.length}
            />
            <StatsCard
              title="Member Families"
              value={memberFamilies.length}
            />
            <StatsCard
              title="Guest Families"
              value={guestFamilies.length}
            />
            <StatsCard
              title="Total Children"
              value={children.length}
            />
          </div>

          {/* Family List */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900">
                Families
              </h2>
              <div className="text-sm text-slate-600">
                {families.length} {families.length === 1 ? 'family' : 'families'}
              </div>
            </div>
            <FamilyList
              families={families}
              onViewDetails={handleViewDetails}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <FamilyDetails
        family={selectedFamily}
        people={people}
        open={isDetailsOpen}
        onClose={handleCloseDetails}
      />

      <AddFamilyDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddFamily={handleAddFamily}
      />
    </div>
  );
}

export default App;