import { useNavigate } from 'react-router-dom';

export function KioskHomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="text-center max-w-2xl">
        <h1 className="text-7xl font-bold text-slate-900 mb-4">RHBC Childcare</h1>
        <p className="text-2xl text-slate-600 mb-16">Welcome! Please select an option below.</p>

        <div className="space-y-6">
          <button
            onClick={() => navigate('/kiosk/checkin')}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-4xl font-bold py-16 px-12 rounded-3xl shadow-2xl transition-all transform hover:scale-105"
          >
            Check In
          </button>

          <button
            onClick={() => navigate('/kiosk/checkout')}
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-4xl font-bold py-16 px-12 rounded-3xl shadow-2xl transition-all transform hover:scale-105"
          >
            Check Out
          </button>

          <button
            onClick={() => navigate('/kiosk/guest')}
            className="w-full bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white text-2xl font-semibold py-8 px-12 rounded-2xl shadow-xl transition-all"
          >
            First Time Guest
          </button>
        </div>

        <p className="mt-12 text-sm text-slate-500">Need help? Ask a volunteer.</p>
      </div>
    </div>
  );
}
