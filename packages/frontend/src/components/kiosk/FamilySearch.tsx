import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Family } from '@rhbc-crm/shared';
import { searchFamilies } from '@/utils/api';

interface FamilySearchProps {
  onSelectFamily: (family: Family) => void;
}

export function FamilySearch({ onSelectFamily }: FamilySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search as user types
  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const families = await searchFamilies({ search: searchTerm });
        setResults(families.slice(0, 4)); // Max 4 results
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectFamily = (family: Family) => {
    onSelectFamily(family);
    setSearchTerm('');
    setResults([]);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400" />
        <Input
          type="text"
          placeholder="Search by last name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-3xl py-10 pl-20 pr-8 rounded-2xl border-2 focus:border-blue-500"
          autoFocus
        />
      </div>

      {/* Results Dropdown */}
      {searchTerm.length >= 2 && (
        <div className="absolute z-10 w-full mt-4 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-xl">Searching...</div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {results.map((family: any) => {
                const parent = family.primaryParent;

                return (
                  <button
                    key={family.familyId}
                    onClick={() => handleSelectFamily(family)}
                    className="w-full text-left px-8 py-6 hover:bg-blue-50 transition-colors"
                  >
                    <div className="text-3xl font-semibold text-slate-900">
                      {family.lastName} Family
                      {parent && ` - ${parent.firstName}`}
                    </div>
                    <div className="text-xl text-slate-500 mt-1 flex items-center gap-3">
                      <span>{family.status === 'member' ? '👥 Member' : '👋 Guest'}</span>
                      {parent?.phone && <span>• (...{parent.phone.slice(-4)})</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xl">
              No families found. Try "First Time Guest" instead.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
