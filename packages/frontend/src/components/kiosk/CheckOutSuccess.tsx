import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface CheckOutSuccessProps {
  children: Array<{ childName?: string }>;
  message: string;
  checkedOutBy: string;
}

export function CheckOutSuccess({ children, message, checkedOutBy }: CheckOutSuccessProps) {
  const navigate = useNavigate();

  // Auto-return to home after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/kiosk');
    }, 8000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-green-50 to-green-100">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <div className="text-9xl mb-6">✓</div>
          <h1 className="text-6xl font-bold text-green-700 mb-4">Check-Out Successful!</h1>
          <p className="text-3xl text-slate-700 mb-8">{message}</p>
          <p className="text-2xl text-slate-600">
            Picked up by: <span className="font-semibold">{checkedOutBy}</span>
          </p>

          {/* Child Names */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <p className="text-2xl text-slate-600 mb-4">Picked up:</p>
            <div className="space-y-3">
              {children.map((child, index) => (
                <div
                  key={index}
                  className="text-4xl font-semibold text-slate-900 bg-slate-50 rounded-2xl py-4"
                >
                  {child.childName || 'Unknown'}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-12 mb-8">
          <p className="text-4xl text-slate-800">Have a blessed day! 🙏</p>
        </div>

        <button
          onClick={() => navigate('/kiosk')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-2xl font-semibold py-6 px-12 rounded-2xl shadow-lg transition-colors"
        >
          Done
        </button>

        <p className="mt-6 text-slate-500 text-xl">Returning to home in 8 seconds...</p>
      </div>
    </div>
  );
}
