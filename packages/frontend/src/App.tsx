import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { FamiliesPage } from '@/pages/FamiliesPage';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { KioskLayout } from '@/components/kiosk/KioskLayout';

// Kiosk pages
import { KioskHomePage } from '@/pages/kiosk/KioskHomePage';
import { KioskCheckInPage } from '@/pages/kiosk/KioskCheckInPage';
import { KioskCheckOutPage } from '@/pages/kiosk/KioskCheckOutPage';
import { KioskGuestPage } from '@/pages/kiosk/KioskGuestPage';

// Admin pages (we'll create/update these)
import { DashboardPage } from '@/pages/DashboardPage';
import { CheckInsPage } from '@/pages/CheckInsPage';
import { ManualCheckInPage } from '@/pages/ManualCheckInPage';

function AppContent() {
  const location = useLocation();
  const isKioskMode = location.pathname.startsWith('/kiosk');

  // Kiosk routes: No sidebar, full-screen
  if (isKioskMode) {
    return (
      <KioskLayout>
        <Routes>
          <Route path="/kiosk" element={<KioskHomePage />} />
          <Route path="/kiosk/checkin" element={<KioskCheckInPage />} />
          <Route path="/kiosk/checkout" element={<KioskCheckOutPage />} />
          <Route path="/kiosk/guest" element={<KioskGuestPage />} />
        </Routes>
      </KioskLayout>
    );
  }

  // Admin routes: With sidebar
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/families" element={<FamiliesPage />} />
        <Route path="/checkins" element={<CheckInsPage />} />
        <Route path="/checkins/new" element={<ManualCheckInPage />} />
      </Routes>
    </AdminLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
