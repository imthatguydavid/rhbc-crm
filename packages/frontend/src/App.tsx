import { Button } from '@/components/ui/button';
import { mockFamilies, mockPeople, getPeopleByFamily } from './data/mockData';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            RHBC CRM
          </h1>
          <p className="text-slate-600">
            Church Management System - Mock Data Test
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-slate-900">
              {mockFamilies.length}
            </div>
            <div className="text-sm text-slate-600">Total Families</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-slate-900">
              {mockPeople.length}
            </div>
            <div className="text-sm text-slate-600">Total People</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-slate-900">
              {mockFamilies.filter(f => f.status === 'member').length}
            </div>
            <div className="text-sm text-slate-600">Member Families</div>
          </div>
        </div>

        {/* Family List Preview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            Families
          </h2>
          <div className="space-y-4">
            {mockFamilies.map(family => {
              const people = getPeopleByFamily(family.familyId);
              const parents = people.filter(p => p.role === 'parent');
              const children = people.filter(p => p.role === 'child');

              return (
                <div
                  key={family.familyId}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {family.lastName} Family
                      </h3>
                      <p className="text-sm text-slate-600">
                        {parents.length} parent{parents.length !== 1 && 's'} • {' '}
                        {children.length} child{children.length !== 1 && 'ren'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        family.status === 'member'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {family.status}
                      </span>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;