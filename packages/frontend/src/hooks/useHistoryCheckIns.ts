import { useState, useEffect } from 'react';
import { getCompletedCheckIns, getFamilyById } from '@/utils/api';
import type { EnrichedCheckIn } from '@/types';
import { toast } from 'sonner';

export function useHistoryCheckIns() {
  const [isLoading, setIsLoading] = useState(true);
  const [checkIns, setCheckIns] = useState<EnrichedCheckIn[]>([]);

  useEffect(() => {
    loadCompletedCheckIns();
  }, []);

  const loadCompletedCheckIns = async () => {
    try {
      setIsLoading(true);
      const completedCheckIns = await getCompletedCheckIns();

      const enriched = await Promise.all(
        completedCheckIns.map(async (checkIn: EnrichedCheckIn) => {
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
      console.error('Error loading all check-ins:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get all check-ins.');
    } finally {
      setIsLoading(false);
    }
  };
  return { isLoading, checkIns };
}
