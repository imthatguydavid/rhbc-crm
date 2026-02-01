import { useState } from 'react';
import type { Family } from '@rhbc-crm/shared';
import { mockFamilies, mockPeople } from './data/mockData';
import { FamilyList } from './components/FamilyList';
import { FamilyDetails } from './components/FamilyDetails';
import { StatsCard } from './components/StatsCard';

function App() {
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const memberFamilies = mockFamilies.filter(f => f.status === 'member');
  const guestFamilies = mockFamilies.filter(f => f.status === 'guest');
  const children = mockPeople.filter(p => p.role === 'child');

  const handleViewDetails = (family: Family) => {
    setSelectedFamily(family);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    // Small delay before clearing to allow dialog close animation
    setTimeout(() => setSelectedFamily(null), 200);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900">RHBC CRM</h1>
          <p className="mt-1 text-sm text-slate-600">
            Church Management System
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Families"
              value={mockFamilies.length}
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
                {mockFamilies.length} {mockFamilies.length === 1 ? 'family' : 'families'}
              </div>
            </div>
            <FamilyList
              families={mockFamilies}
              onViewDetails={handleViewDetails}
            />
          </div>
        </div>
      </div>

      {/* Family Details Dialog */}
      <FamilyDetails
        family={selectedFamily}
        open={isDetailsOpen}
        onClose={handleCloseDetails}
      />
    </div>
  );
}

export default App;