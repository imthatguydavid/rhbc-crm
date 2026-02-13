import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { Family } from '@rhbc-crm/shared';
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
import { searchFamilies } from '@/utils/api';
import { NewFamilyButton } from '@/components/families/NewFamilyButton';

export function FamiliesPage() {
  // Data state
  const [families, setFamilies] = useState<Family[]>([]);

  // UI state
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
   * Opens add child dialog for a specific family
   */
  const handleAddChildFromMenu = async (family: Family) => {
    // Open details first, then trigger add child
    console.log('please add child from menu', family);
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
        <NewFamilyButton />
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
        onAddChild={handleAddChildFromMenu}
        onDelete={handleDeleteFamily}
      />
    </div>
  );
}
