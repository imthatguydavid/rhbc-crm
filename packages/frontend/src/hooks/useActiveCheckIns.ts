import { useState, useEffect } from 'react';
import { getActiveCheckIns, getFamilyById } from '@/utils/api';
import type { EnrichedCheckIn } from '@/types';

export function useActiveCheckIns() {
  const [isLoading, setIsLoading] = useState(true);
  const [checkIns, setCheckIns] = useState<EnrichedCheckIn[]>([]);

  useEffect(() => {
    loadActiveCheckIns();
  }, []);

  const loadActiveCheckIns = async () => {
    try {
      setIsLoading(true);
      const activeCheckIns = await getActiveCheckIns();

      const enriched = await Promise.all(
        activeCheckIns.map(async (checkIn: EnrichedCheckIn) => {
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
  return { isLoading, checkIns, loadActiveCheckIns };
}
