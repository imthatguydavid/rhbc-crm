import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Family, Person } from '@rhbc-crm/shared';
import { FamilySearch } from '@/components/kiosk/FamilySearch';
import { ChildSelector } from '@/components/kiosk/ChildSelector';
import { PINDisplay } from '@/components/kiosk/PINDisplay';
import { getFamilyById, bulkCheckInChildren } from '@/utils/api';

type Step = 'search' | 'select' | 'pin';

export function KioskCheckInPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('search');
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [children, setChildren] = useState<Person[]>([]);
  const [pin, setPin] = useState('');
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSelectFamily = async (family: Family) => {
    try {
      setError(null);
      setSelectedFamily(family);

      // Load family members
      const data = await getFamilyById(family.familyId);
      const kids = data.people.filter((p: Person) => p.role === 'child');

      if (kids.length === 0) {
        setError('This family has no children registered.');
        return;
      }

      setChildren(kids);
      setStep('select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load family');
    }
  };

  const handleConfirmChildren = async (selectedIds: string[]) => {
    if (!selectedFamily) return;

    try {
      setError(null);

      // Bulk check-in
      const result = await bulkCheckInChildren({
        familyId: selectedFamily.familyId,
        childIds: selectedIds,
        room: 'Nursery', // Could make this selectable later
      });

      setPin(result.pin);
      setCheckedInCount(selectedIds.length);
      setStep('pin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in');
    }
  };

  const handleCancel = () => {
    setSelectedFamily(null);
    setChildren([]);
    setStep('search');
    setError(null);
  };

  // Show PIN display
  if (step === 'pin') {
    return <PINDisplay pin={pin} childCount={checkedInCount} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-6 mb-12">
          <button
            onClick={() => navigate('/kiosk')}
            className="p-4 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-10 w-10 text-slate-600" />
          </button>
          <div>
            <h1 className="text-5xl font-bold text-slate-900">Check In</h1>
            <p className="text-xl text-slate-600 mt-2">
              {step === 'search' ? 'Find your family' : `${selectedFamily?.lastName} Family`}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
            <p className="text-xl text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-xl p-12">
          {step === 'search' && <FamilySearch onSelectFamily={handleSelectFamily} />}

          {step === 'select' && (
            <ChildSelector
              children={children}
              onConfirm={handleConfirmChildren}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </div>
  );
}
