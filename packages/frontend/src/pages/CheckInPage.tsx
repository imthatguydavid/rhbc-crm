import { useState, useEffect } from 'react';
import type { Family, Person } from '@rhbc-crm/shared';
import { getFamilies, getFamilyById, checkInChild } from '@/utils/api';
import { Button } from '@/components/ui/button';

export function CheckInPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [children, setChildren] = useState<Person[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [room, setRoom] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successPin, setSuccessPin] = useState<string | null>(null);

  // Load families on mount
  useEffect(() => {
    loadFamilies();
  }, []);

  // Load children when family selected
  useEffect(() => {
    if (selectedFamilyId) {
      loadChildren(selectedFamilyId);
    } else {
      setChildren([]);
      setSelectedChildId('');
    }
  }, [selectedFamilyId]);

  async function loadFamilies() {
    try {
      const data = await getFamilies();
      setFamilies(data);
    } catch (err) {
      setError('Failed to load families');
    }
  }

  async function loadChildren(familyId: string) {
    try {
      const { people } = await getFamilyById(familyId);
      const kids = people.filter((p: Person) => p.role === 'child');
      setChildren(kids);

      // Auto-select if only one child
      if (kids.length === 1) {
        setSelectedChildId(kids[0].personId);
      }
    } catch (err) {
      setError('Failed to load children');
    }
  }

  async function handleCheckIn() {
    if (!selectedChildId || !selectedFamilyId || !room) {
      setError('Please select a child and enter a room');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await checkInChild({
        childId: selectedChildId,
        familyId: selectedFamilyId,
        room: room.trim(),
      });

      // Show success with PIN
      setSuccessPin(result.pin);

      // Reset form after 10 seconds
      setTimeout(() => {
        setSuccessPin(null);
        setSelectedFamilyId('');
        setSelectedChildId('');
        setRoom('');
      }, 10000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in');
    } finally {
      setIsLoading(false);
    }
  }

  // Success state - show PIN prominently
  if (successPin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Check-In Successful!
          </h2>
          <p className="text-slate-600 mb-6">
            Write down this PIN for pickup:
          </p>
          <div className="bg-blue-50 border-4 border-blue-600 rounded-lg p-8 mb-6">
            <div className="text-6xl font-bold text-blue-600 tracking-widest">
              {successPin}
            </div>
          </div>
          <p className="text-sm text-slate-500">
            You will need this PIN to pick up your child
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Check-In</h1>
          <p className="mt-1 text-sm text-slate-600">
            Check in a child to childcare
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Select Family */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Family
            </label>
            <select
              value={selectedFamilyId}
              onChange={(e) => setSelectedFamilyId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="">-- Choose a family --</option>
              {families.map(family => (
                <option key={family.familyId} value={family.familyId}>
                  {family.lastName} Family
                </option>
              ))}
            </select>
          </div>

          {/* Select Child */}
          {children.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Child
              </label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="">-- Choose a child --</option>
                {children.map(child => (
                  <option key={child.personId} value={child.personId}>
                    {child.firstName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Room Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Room Assignment
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g., Nursery, Toddler Room"
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleCheckIn}
            disabled={!selectedChildId || !room || isLoading}
            className="w-full"
          >
            {isLoading ? 'Checking In...' : 'Check In Child'}
          </Button>
        </div>
      </div>
    </div>
  );
}