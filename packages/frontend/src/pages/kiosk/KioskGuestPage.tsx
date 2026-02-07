import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChildrenInput } from '@/components/kiosk/ChildrenInput';
import { PINDisplay } from '@/components/kiosk/PINDisplay';
import { createFamily, bulkCheckInChildren, addChildToFamily } from '@/utils/api';

type Step = 'form' | 'pin';

interface Child {
  id: string;
  firstName: string;
}

export function KioskGuestPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [parentFirstName, setParentFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [children, setChildren] = useState<Child[]>([{ id: '1', firstName: '' }]);

  // Result data
  const [pin, setPin] = useState('');
  const [checkedInCount, setCheckedInCount] = useState(0);

  const validateForm = () => {
    if (!parentFirstName.trim()) {
      return 'Parent first name is required';
    }
    if (!lastName.trim()) {
      return 'Last name is required';
    }
    if (!phone.trim() && !email.trim()) {
      return 'Phone or email is required';
    }
    if (children.length === 0) {
      return 'At least one child is required';
    }
    if (children.some((child) => !child.firstName.trim())) {
      return 'All children must have a first name';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create family
      const familyData: any = {
        lastName: lastName.trim(),
        status: 'guest',
        parentFirstName: parentFirstName.trim(),
      };

      // Only add phone/email if provided
      if (phone.trim()) {
        familyData.parentPhone = phone.trim();
      }
      if (email.trim()) {
        familyData.parentEmail = email.trim();
      }

      const familyResult = await createFamily(familyData);

      const familyId = familyResult.family.familyId;

      // Step 2: Add children
      const childIds: string[] = [];
      for (const child of children) {
        const person = await addChildToFamily(familyId, {
          firstName: child.firstName.trim(),
        });
        childIds.push(person.personId);
      }

      // Step 3: Bulk check-in
      const checkInResult = await bulkCheckInChildren({
        familyId,
        childIds,
        room: 'Nursery',
      });

      setPin(checkInResult.pin);
      setCheckedInCount(childIds.length);
      setStep('pin');
    } catch (err) {
      console.error('Guest registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register. Please try again.');
      setIsLoading(false);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCancel = () => {
    navigate('/kiosk');
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
            <h1 className="text-5xl font-bold text-slate-900">First Time Guest</h1>
            <p className="text-xl text-slate-600 mt-2">Welcome! Please fill out your information</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
            <p className="text-2xl text-red-800 text-center font-semibold">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-12">
          <div className="space-y-8">
            {/* Parent Info Section */}
            <div>
              <h3 className="text-3xl font-semibold text-slate-900 mb-6">Parent Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xl font-medium text-slate-700 mb-2">
                    First Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="John"
                    value={parentFirstName}
                    onChange={(e) => setParentFirstName(e.target.value)}
                    className="text-2xl py-6 px-6 rounded-xl"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-xl font-medium text-slate-700 mb-2">
                    Last Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Smith"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="text-2xl py-6 px-6 rounded-xl"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-xl font-medium text-slate-700 mb-2">Phone</label>
                  <Input
                    type="tel"
                    placeholder="555-123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-2xl py-6 px-6 rounded-xl"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-xl font-medium text-slate-700 mb-2">Email</label>
                  <Input
                    type="email"
                    placeholder="john.smith@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-2xl py-6 px-6 rounded-xl"
                    disabled={isLoading}
                  />
                </div>

                <p className="text-base text-slate-500">
                  * Required fields. Phone or email required.
                </p>
              </div>
            </div>

            {/* Children Section */}
            <div className="pt-8 border-t-2 border-slate-200">
              <ChildrenInput children={children} onChange={setChildren} />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-8">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-2xl font-semibold py-6 rounded-2xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-semibold py-6 rounded-2xl transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Checking In...' : 'Check In'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
