import { useState, useEffect } from 'react';
import type { CheckIn, Person } from '@rhbc-crm/shared';
import { getActiveCheckIns, checkOutChild, getFamilyById } from '../utils/api';
import { Button } from '../components/ui/button';
import type { EnrichedCheckIn } from '@/types';

export function ActiveCheckInsPage() {
  const [checkIns, setCheckIns] = useState<EnrichedCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    loadActiveCheckIns();

    // Refresh every 30 seconds
    const interval = setInterval(loadActiveCheckIns, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadActiveCheckIns() {
    try {
      setIsLoading(true);
      setError(null);

      const activeCheckIns = await getActiveCheckIns();

      // Load child names for each check-in
      const checkInsWithNames = await Promise.all(
        activeCheckIns.map(async (checkIn: CheckIn) => {
          try {
            const { family, people } = await getFamilyById(checkIn.familyId);
            const child = people.find((p: Person) => p.personId === checkIn.childId);

            return {
              ...checkIn,
              childName: child?.firstName || 'Unknown',
              familyName: family.lastName,
            };
          } catch (err) {
            return {
              ...checkIn,
              childName: 'Unknown',
              familyName: 'Unknown',
            };
          }
        })
      );

      setCheckIns(checkInsWithNames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load check-ins');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQuickCheckOut(checkIn: EnrichedCheckIn) {
    if (!confirm(`Check out ${checkIn.childName}? PIN: ${checkIn.checkOutPin}`)) {
      return;
    }

    try {
      setCheckingOut(checkIn.checkInId);
      setError(null);

      await checkOutChild({
        checkInId: checkIn.checkInId,
        pin: checkIn.checkOutPin,
      });

      // Refresh list
      await loadActiveCheckIns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check out');
    } finally {
      setCheckingOut(null);
    }
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  function getTimeElapsed(timestamp: string) {
    const now = new Date();
    const checkInTime = new Date(timestamp);
    const minutes = Math.floor((now.getTime() - checkInTime.getTime()) / 60000);

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m ago`;
  }

  if (isLoading && checkIns.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading active check-ins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Active Check-Ins</h2>
          <p className="mt-1 text-sm text-slate-600">
            {checkIns.length} {checkIns.length === 1 ? 'child' : 'children'} currently checked in
          </p>
        </div>
        <Button onClick={loadActiveCheckIns} variant="outline">
          🔄 Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Check-Ins List */}
      {checkIns.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">👶</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Children Checked In</h3>
          <p className="text-slate-600">All children have been picked up!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {checkIns.map((checkIn) => (
            <div
              key={checkIn.checkInId}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-slate-900">
                      {checkIn.childName} {checkIn.familyName}
                    </h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {checkIn.room}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-slate-600">
                    <p>
                      Checked in: {formatTime(checkIn.checkInTime)} (
                      {getTimeElapsed(checkIn.checkInTime)})
                    </p>
                    <p className="font-mono text-lg font-semibold text-slate-900">
                      PIN: {checkIn.checkOutPin}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleQuickCheckOut(checkIn)}
                  disabled={checkingOut === checkIn.checkInId}
                  variant="outline"
                  className="ml-4"
                >
                  {checkingOut === checkIn.checkInId ? 'Checking Out...' : 'Check Out'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
