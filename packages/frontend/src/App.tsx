import { useState, useEffect } from 'react';
import type { Family, Person } from '@rhbc-crm/shared';
import { FamilyList } from './components/FamilyList';
import { FamilyDetails } from './components/FamilyDetails';
import { AddFamilyDialog } from './components/AddFamilyDialog';
import { StatsCard } from './components/StatsCard';
import { Button } from './components/ui/button';
import { getFamilies, createFamily, getFamilyById } from './utils/api';

function App() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load families on mount
  useEffect(() => {
    loadFamilies();
  }, []);

  /**
   * Loads all families from the API
   */
  async function loadFamilies() {
    try {
      setIsLoading(true);
      setError(null);
      const familiesData = await getFamilies();
      setFamilies(familiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load families');
      console.error('Error loading families:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate stats
  const memberFamilies = families.filter(f => f.status === 'member');
  const guestFamilies = families.filter(f => f.status === 'guest');
  const children = people.filter(p => p.role === 'child');

  /**
   * Handles viewing a family's details
   */
  async function handleViewDetails(family: Family) {
    try {
      setSelectedFamily(family);
      setIsDetailsOpen(true);

      // Load family members from API
      const data = await getFamilyById(family.familyId);
      setPeople(data.people);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load family details');
      console.error('Error loading family details:', err);
    }
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setTimeout(() => setSelectedFamily(null), 200);
  };

  /**
   * Handles adding a new family via API
   */
  async function handleAddFamily(
    family: Family,
    parentData: { firstName: string; phone: string; email?: string }
  ) {
    try {
      setError(null);

      // Create family via API
      await createFamily({
        lastName: family.lastName,
        status: family.status,
        parentFirstName: parentData.firstName,
        parentPhone: parentData.phone,
        parentEmail: parentData.email,
      });

      // Reload families to show new one
      await loadFamilies();

      setIsAddDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create family');
      console.error('Error creating family:', err);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading families...</p>
        </div>
      </div>
    );
  }

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
          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex justify-between items-start">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

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