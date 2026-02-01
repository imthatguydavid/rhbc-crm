import { mockFamilies, mockPeople } from './data/mockData';
import { FamilyList } from './components/FamilyList';
import { StatsCard } from './components/StatsCard';

function App() {
  const memberFamilies = mockFamilies.filter(f => f.status === 'member');
  const guestFamilies = mockFamilies.filter(f => f.status === 'guest');
  const children = mockPeople.filter(p => p.role === 'child');

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
            <FamilyList families={mockFamilies} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;