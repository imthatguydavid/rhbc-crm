import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { FamiliesPage } from '@/pages/FamiliesPage';
import { CheckInPage } from '@/pages/CheckInPage';
import { CheckOutPage } from '@/pages/CheckOutPage';
import { ActiveCheckInsPage } from './pages/ActiveCheckInsPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        {/* Header with Navigation */}
        <div className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">RHBC CRM</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Church Management System
                </p>
              </div>

              {/* Navigation */}
              <nav className="flex gap-4">
                <Link
                  to="/"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                >
                  Families
                </Link>
                <Link
                  to="/checkin"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                >
                  Check-In
                </Link>
                <Link
                  to="/checkout"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                >
                  Check-Out
                </Link>
                <Link
                  to="/active"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                >
                  Active
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<FamiliesPage />} />
            <Route path="/checkin" element={<CheckInPage />} />
            <Route path="/checkout" element={<CheckOutPage />} />
            <Route path="/active" element={<ActiveCheckInsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;