import { useState, useEffect } from 'react';
import type { CheckIn, Person } from '@rhbc-crm/shared';
import { getActiveCheckIns, checkOutChild, getFamilyById } from '@/utils/api';
import { Button } from '@/components/ui/button';

export function CheckOutPage() {
  const [activeCheckIns, setActiveCheckIns] = useState<CheckIn[]>([]);
  const [childNames, setChildNames] = useState<Record<string, string>>({});
  const [selectedCheckInId, setSelectedCheckInId] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadActiveCheckIns();
  }, []);

  async function loadActiveCheckIns() {
    try {
      const checkIns = await getActiveCheckIns();
      setActiveCheckIns(checkIns);

      // Load child names
      const names: Record<string, string> = {};
      for (const checkIn of checkIns) {
        try {
          const { people } = await getFamilyById(checkIn.familyId);
          const child = people.find((p: Person) => p.personId === checkIn.childId);
          if (child) {
            names[checkIn.childId] = child.firstName;
          }
        } catch (err) {
          console.error('Failed to load child name', err);
        }
      }
      setChildNames(names);
    } catch (err) {
      setError('Failed to load active check-ins');
    }
  }

  async function handleCheckOut() {
    if (!selectedCheckInId || !pin) {
      setError('Please select a child and enter PIN');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await checkOutChild({
        checkInId: selectedCheckInId,
        pin: pin.trim(),
      });

      setSuccess(true);

      // Refresh and reset after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setSelectedCheckInId('');
        setPin('');
        loadActiveCheckIns();
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check out');
    } finally {
      setIsLoading(false);
    }
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Check-Out Successful!
          </h2>
          <p className="text-slate-600">
            Child has been checked out safely.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Check-Out</h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter PIN to check out a child
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {activeCheckIns.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-slate-600">No children currently checked in</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Select Child */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Child
            </label>
            <select
              value={selectedCheckInId}
              onChange={(e) => setSelectedCheckInId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="">-- Choose a child --</option>
              {activeCheckIns.map((checkIn) => (
                <option key={checkIn.checkInId} value={checkIn.checkInId}>
                  {childNames[checkIn.childId] || 'Loading...'} - {checkIn.room}
                </option>
              ))}
            </select>
          </div>

          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Enter 4-Digit PIN
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(value);
              }}
              placeholder="1234"
              maxLength={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-2xl tracking-widest text-center"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleCheckOut}
            disabled={!selectedCheckInId || pin.length !== 4 || isLoading}
            className="w-full"
          >
            {isLoading ? 'Checking Out...' : 'Check Out Child'}
          </Button>
        </div>
      )}
    </div>
  );
}