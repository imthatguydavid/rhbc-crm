import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import type { Family, Person } from '@rhbc-crm/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FamiliesTable } from '@/components/families/FamiliesTable';
import { FamilyDetails } from '@/components/FamilyDetails';
import { AddFamilyDialog } from '@/components/AddFamilyDialog';
import {
  searchFamilies,
  createFamily,
  getFamilyById,
  updateFamily,
  updatePerson,
  addChildToFamily,
  deletePerson,
} from '@/utils/api';

export function FamiliesPage() {
  const navigate = useNavigate();

  // Data state
  const [families, setFamilies] = useState<Family[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);

  // UI state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'member' | 'guest'>('all');

  /**
   * Load families on mount and when filters change
   */
  useEffect(() => {
    loadFamilies();
  }, [searchTerm, statusFilter]);

  /**
   * Fetches families with current search/filter settings
   */
  async function loadFamilies() {
    try {
      setIsLoading(true);
      setError(null);

      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter;

      const familiesData = await searchFamilies(
        Object.keys(filters).length > 0 ? filters : undefined
      );
      setFamilies(familiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load families');
      console.error('Error loading families:', err);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Opens family details dialog and loads family members
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

  /**
   * Closes details dialog
   */
  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setTimeout(() => setSelectedFamily(null), 200);
  };

  /**
   * Creates a new family via API
   */
  async function handleAddFamily(
    family: Family,
    parentData: { firstName: string; phone: string; email?: string }
  ) {
    try {
      setError(null);

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

  /**
   * Updates family information
   */
  async function handleUpdateFamily(
    familyId: string,
    updates: { lastName: string; status: 'member' | 'guest' }
  ) {
    try {
      setError(null);
      await updateFamily(familyId, updates);

      // Reload families and refresh details
      await loadFamilies();
      if (selectedFamily) {
        const data = await getFamilyById(familyId);
        setSelectedFamily(data.family);
        setPeople(data.people);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update family');
      console.error('Error updating family:', err);
    }
  }

  /**
   * Updates person information
   */
  async function handleUpdatePerson(
    personId: string,
    updates: { firstName: string; phone?: string; email?: string }
  ) {
    try {
      setError(null);
      await updatePerson(personId, updates);

      // Reload family details
      if (selectedFamily) {
        const data = await getFamilyById(selectedFamily.familyId);
        setPeople(data.people);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update person');
      console.error('Error updating person:', err);
    }
  }

  /**
   * Adds a child to the family
   */
  async function handleAddChild(
    familyId: string,
    childData: { firstName: string; phone?: string; email?: string }
  ) {
    try {
      setError(null);
      await addChildToFamily(familyId, childData);

      // Reload family details
      const data = await getFamilyById(familyId);
      setPeople(data.people);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add child');
      console.error('Error adding child:', err);
    }
  }

  /**
   * Deletes a person from the family
   */
  async function handleDeletePerson(personId: string) {
    try {
      setError(null);
      await deletePerson(personId);

      // Reload family details
      if (selectedFamily) {
        const data = await getFamilyById(selectedFamily.familyId);
        setPeople(data.people);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete person');
      console.error('Error deleting person:', err);
    }
  }

  /**
   * Opens add child dialog for a specific family
   */
  const handleAddChildFromMenu = async (family: Family) => {
    // Open details first, then trigger add child
    await handleViewDetails(family);
    // TODO: Trigger add child action in FamilyDetails dialog
  };

  /**
   * Deletes an entire family
   */
  const handleDeleteFamily = async (family: Family) => {
    if (!confirm(`Are you sure you want to delete the ${family.lastName} family?`)) {
      return;
    }

    try {
      setError(null);
      // TODO: Implement deleteFamily API call
      console.log('Delete family:', family);
      // await deleteFamily(family.familyId);
      // await loadFamilies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete family');
      console.error('Error deleting family:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Families</h1>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Family
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
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

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by last name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(value: 'all' | 'member' | 'guest') => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Families</SelectItem>
            <SelectItem value="member">Members Only</SelectItem>
            <SelectItem value="guest">Guests Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {(searchTerm || statusFilter !== 'all') && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Families Table */}
      <FamiliesTable
        families={families}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onAddChild={handleAddChildFromMenu}
        onDelete={handleDeleteFamily}
      />

      {/* Dialogs */}
      <FamilyDetails
        family={selectedFamily}
        people={people}
        open={isDetailsOpen}
        onClose={handleCloseDetails}
        onUpdateFamily={handleUpdateFamily}
        onUpdatePerson={handleUpdatePerson}
        onAddChild={handleAddChild}
        onDeletePerson={handleDeletePerson}
      />

      <AddFamilyDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddFamily={handleAddFamily}
      />
    </div>
  );
}
