import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface PINDisplayProps {
  pin: string;
  childCount: number;
}

export function PINDisplay({ pin, childCount }: PINDisplayProps) {
  const navigate = useNavigate();

  // Auto-return to home after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/kiosk');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-green-50 to-green-100">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-5xl font-bold text-green-700 mb-2">Check-in Successful!</h1>
          <p className="text-2xl text-slate-600">
            {childCount} {childCount === 1 ? 'child' : 'children'} checked in
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-12 mb-8">
          <p className="text-2xl text-slate-600 mb-4">Your PIN:</p>
          <div className="text-9xl font-bold text-blue-600 tracking-wider">{pin}</div>
          <p className="text-xl text-slate-500 mt-6">
            Please remember this number to pick up your children
          </p>
        </div>

        <button
          onClick={() => navigate('/kiosk')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-2xl font-semibold py-6 px-12 rounded-2xl shadow-lg transition-colors"
        >
          Done
        </button>

        <p className="mt-6 text-slate-500">Returning to home in 10 seconds...</p>
      </div>
    </div>
  );
}
