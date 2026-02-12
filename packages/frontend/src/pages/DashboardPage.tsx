import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActiveCheckInsList } from '@/components/dashboard/ActiveCheckInsList';
import { getActiveCheckIns, getFamilyById } from '@/utils/api';
import type { EnrichedCheckIn } from '@/types';
import { NewFamilyButton } from '@/components/families/NewFamilyButton';

export function DashboardPage() {
  const navigate = useNavigate();
  const [checkIns, setCheckIns] = useState<EnrichedCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActiveCheckIns();
  }, []);

  const loadActiveCheckIns = async () => {
    try {
      setIsLoading(true);
      const activeCheckIns = await getActiveCheckIns();

      // Limit to 10 most recent
      const recentCheckIns = activeCheckIns.slice(0, 10);

      // Enrich with child and family names
      const enriched = await Promise.all(
        recentCheckIns.map(async (checkIn: { familyId: string; childId: any }) => {
          try {
            const familyData = await getFamilyById(checkIn.familyId);
            const child = familyData.people.find((p: any) => p.personId === checkIn.childId);

            return {
              ...checkIn,
              childName: child?.firstName || 'Unknown',
              familyName: familyData.family.lastName || 'Unknown',
            };
          } catch (error) {
            console.error('Error loading family data:', error);
            return {
              ...checkIn,
              childName: 'Unknown',
              familyName: 'Unknown',
            };
          }
        })
      );

      setCheckIns(enriched);
    } catch (error) {
      console.error('Error loading active check-ins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <NewFamilyButton />
          <Button onClick={() => navigate('/checkins/new')} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Manual Check In
          </Button>
        </div>
      </div>

      {/* Active Check-Ins */}
      <ActiveCheckInsList checkIns={checkIns} isLoading={isLoading} />
    </div>
  );
}
