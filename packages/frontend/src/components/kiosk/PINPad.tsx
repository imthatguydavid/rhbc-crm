import { useState } from 'react';
import { Delete } from 'lucide-react';

interface PINPadProps {
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PINPad({ onSubmit, onCancel, isLoading }: PINPadProps) {
  const [pin, setPin] = useState('');

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);

      // Auto-submit when 4 digits entered
      if (newPin.length === 4) {
        setTimeout(() => onSubmit(newPin), 300);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleSubmit = () => {
    if (pin.length === 4) {
      onSubmit(pin);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* PIN Display */}
      <div className="mb-12 bg-slate-100 rounded-3xl p-8 text-center">
        <p className="text-xl text-slate-600 mb-4">Enter your PIN:</p>
        <div className="flex justify-center gap-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-20 h-20 rounded-2xl flex items-center justify-center text-5xl font-bold border-4 ${
                pin.length > index
                  ? 'bg-blue-500 border-blue-600 text-white'
                  : 'bg-white border-slate-300 text-slate-300'
              }`}
            >
              {pin.length > index ? '●' : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            disabled={isLoading}
            className="bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-5xl font-bold py-10 rounded-2xl shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-slate-200"
          >
            {num}
          </button>
        ))}

        {/* Bottom Row: Clear, 0, Delete */}
        <button
          onClick={handleClear}
          disabled={isLoading || pin.length === 0}
          className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 text-2xl font-semibold py-10 rounded-2xl shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>

        <button
          onClick={() => handleNumberClick('0')}
          disabled={isLoading}
          className="bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-5xl font-bold py-10 rounded-2xl shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-slate-200"
        >
          0
        </button>

        <button
          onClick={handleDelete}
          disabled={isLoading || pin.length === 0}
          className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 py-10 rounded-2xl shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Delete className="h-10 w-10" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-2xl font-semibold py-6 rounded-2xl transition-colors disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={isLoading || pin.length !== 4}
          className={`flex-1 text-white text-2xl font-semibold py-6 rounded-2xl transition-colors ${
            pin.length === 4 && !isLoading
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Checking Out...' : 'Check Out'}
        </button>
      </div>
    </div>
  );
}
