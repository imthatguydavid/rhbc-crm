import { ReactNode } from 'react';

interface KioskLayoutProps {
  children: ReactNode;
}

/**
 * Full-screen kiosk layout with no navigation.
 * Designed for public-facing iPad kiosk mode.
 */
export function KioskLayout({ children }: KioskLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* No header, no navigation - just content */}
      {children}
    </div>
  );
}
