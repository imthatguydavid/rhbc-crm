import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PINPad } from '@/components/kiosk/PINPad';
import { ParentSelector } from '@/components/kiosk/ParentSelector';
import { CheckOutSuccess } from '@/components/kiosk/CheckOutSuccess';
import { validatePinForCheckout, checkOutByPin } from '@/utils/api';

type Step = 'pin' | 'select-parent' | 'enter-name' | 'success';

export function KioskCheckOutPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('pin');
  const [pin, setPin] = useState('');
  const [familyInfo, setFamilyInfo] = useState<{
    familyId: string;
    lastName: string;
    parents: Array<{ personId: string; firstName: string }>;
    children: Array<{ personId: string; firstName: string }>;
  } | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedOutChildren, setCheckedOutChildren] = useState<Array<{ childName?: string }>>([]);
  const [message, setMessage] = useState('');

  const handleSubmitPIN = async (enteredPin: string) => {
    setIsLoading(true);
    setError(null);
    setPin(enteredPin);

    try {
      // Validate PIN and get family info
      const info = await validatePinForCheckout(enteredPin);
      setFamilyInfo(info);
      setStep('select-parent');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid PIN';
      setError(errorMessage);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectParent = (selectedName: string) => {
    if (selectedName === 'other') {
      setStep('enter-name');
    } else {
      // Use selected parent name
      handleCheckout(selectedName);
    }
  };

  const handleSubmitCustomName = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name');
      setTimeout(() => setError(null), 3000);
      return;
    }

    await handleCheckout(name.trim());
  };

  const handleCheckout = async (checkoutName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await checkOutByPin(pin, checkoutName);
      setCheckedOutChildren(result.checkIns);
      setMessage(result.message);
      setStep('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Checkout failed';
      setError(errorMessage);

      // Reset to PIN entry on error
      setTimeout(() => {
        setError(null);
        setStep('pin');
        setPin('');
        setFamilyInfo(null);
        setName('');
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/kiosk');
  };

  const handleBackToParentSelect = () => {
    setStep('select-parent');
    setName('');
    setError(null);
  };

  const handleBackToPin = () => {
    setStep('pin');
    setPin('');
    setFamilyInfo(null);
    setName('');
    setError(null);
  };

  // Show success screen
  if (step === 'success') {
    return <CheckOutSuccess children={checkedOutChildren} message={message} checkedOutBy={name} />;
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
            <h1 className="text-5xl font-bold text-slate-900">Check Out</h1>
            <p className="text-xl text-slate-600 mt-2">
              {step === 'pin' && 'Enter your PIN'}
              {step === 'select-parent' && 'Select who is picking up'}
              {step === 'enter-name' && 'Enter your name'}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
            <p className="text-2xl text-red-800 text-center font-semibold">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-xl p-12">
          {step === 'pin' && (
            <PINPad onSubmit={handleSubmitPIN} onCancel={handleCancel} isLoading={isLoading} />
          )}

          {step === 'select-parent' && familyInfo && (
            <ParentSelector
              parents={familyInfo.parents}
              lastName={familyInfo.lastName}
              onSelect={handleSelectParent}
              onCancel={handleBackToPin}
            />
          )}

          {step === 'enter-name' && (
            <form onSubmit={handleSubmitCustomName} className="max-w-lg mx-auto">
              <div className="mb-8">
                <label className="block text-2xl font-semibold text-slate-900 mb-4">
                  Your Name:
                </label>
                <Input
                  type="text"
                  placeholder="Sarah Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-3xl py-8 px-6 rounded-2xl border-2 focus:border-green-500"
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBackToParentSelect}
                  disabled={isLoading}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-2xl font-semibold py-6 rounded-2xl transition-colors disabled:opacity-50"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className={`flex-1 text-white text-2xl font-semibold py-6 rounded-2xl transition-colors ${
                    name.trim() && !isLoading
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? 'Checking Out...' : 'Check Out'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
8379;
