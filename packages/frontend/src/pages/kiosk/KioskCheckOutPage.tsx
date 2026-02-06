import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PINPad } from '@/components/kiosk/PINPad';
import { CheckOutSuccess } from '@/components/kiosk/CheckOutSuccess';
import { checkOutByPin } from '@/utils/api';

type Step = 'pin' | 'success';

export function KioskCheckOutPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('pin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedOutChildren, setCheckedOutChildren] = useState<Array<{ childName?: string }>>([]);
  const [message, setMessage] = useState('');

  const handleSubmitPIN = async (pin: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await checkOutByPin(pin);
      setCheckedOutChildren(result.checkIns);
      setMessage(result.message);
      setStep('success');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Invalid PIN or no children checked in';
      setError(errorMessage);
      setIsLoading(false);

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCancel = () => {
    navigate('/kiosk');
  };

  // Show success screen
  if (step === 'success') {
    return <CheckOutSuccess children={checkedOutChildren} message={message} />;
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
            <p className="text-xl text-slate-600 mt-2">Enter your PIN to pick up your children</p>
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
          <PINPad onSubmit={handleSubmitPIN} onCancel={handleCancel} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
