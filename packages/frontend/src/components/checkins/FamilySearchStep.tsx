import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { searchFamilies } from '@/utils/api';
import type { Family } from '@rhbc-crm/shared';
import { Badge } from '@/components/ui/badge';
import { getFamilyStatusBadge } from '@/utils/badges';

interface FamilySearchStepProps {
  onFamilySelected: (family: Family) => void;
}

/**
 * Family Search Step
 *
 * Step 1 of manual check-in flow.
 * Staff searches for family by last name and selects from results.
 */
export function FamilySearchStep({ onFamilySelected }: FamilySearchStepProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [families, setFamilies] = useState<Family[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * Handles search form submission
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;

    try {
      setIsSearching(true);
      setHasSearched(true);

      const results = await searchFamilies({ search: searchTerm });
      setFamilies(results);
    } catch (error) {
      console.error('Error searching families:', error);
      setFamilies([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handles family selection
   */
  const handleSelectFamily = (family: Family) => {
    onFamilySelected(family);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by last name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={isSearching}
            autoFocus
          />
        </div>
        <Button type="submit" disabled={isSearching || !searchTerm.trim()}>
          {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Search
        </Button>
      </form>

      {/* Search Results */}
      {isSearching && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
          <p className="mt-2 text-slate-600">Searching families...</p>
        </div>
      )}

      {!isSearching && hasSearched && families.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia>🔍</EmptyMedia>
            <EmptyTitle>No families found</EmptyTitle>
            <EmptyDescription>
              Try searching with a different name or check the spelling.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isSearching && families.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            {families.length} {families.length === 1 ? 'family' : 'families'} found
          </p>

          {/* Family List */}
          <div className="space-y-2">
            {families.map((family) => (
              <button
                key={family.familyId}
                onClick={() => handleSelectFamily(family)}
                className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{family.lastName} Family</p>
                    <p className="mt-2">
                      {(() => {
                        const badge = getFamilyStatusBadge(family.status);
                        return <Badge className={badge.className}>{badge.label}</Badge>;
                      })()}
                    </p>
                  </div>
                  <span className="text-slate-400">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-12 text-slate-500">
          <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p>Enter a last name to search for families</p>
        </div>
      )}
    </div>
  );
}
