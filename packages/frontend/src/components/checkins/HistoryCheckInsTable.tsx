import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { getActiveCheckIns, getFamilyById } from '@/utils/api';
import type { EnrichedCheckIn } from '@/types';

/**
 * History Check-Ins Table Component
 *
 * Displays all completed check-ins (past records) with checkout information.
 * Shows who picked up each child and when.
 */
export function HistoryCheckInsTable() {
  const [checkIns, setCheckIns] = useState<EnrichedCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load completed check-ins on component mount
  useEffect(() => {
    loadCompletedCheckIns();
  }, []);

  /**
   * Fetches completed check-ins from API.
   * Currently uses getActiveCheckIns and filters - in future we'll add a dedicated endpoint.
   * Enriches data with child and family names.
   */
  const loadCompletedCheckIns = async () => {
    try {
      setIsLoading(true);

      // TODO: Replace with dedicated getCompletedCheckIns endpoint
      // For now, we'll use getActiveCheckIns and filter by status
      // This is temporary - backend should provide a completed check-ins endpoint
      const allCheckIns = await getActiveCheckIns();
      const completedCheckIns = allCheckIns.filter(
        (c: EnrichedCheckIn) => c.status === 'completed'
      );

      // Enrich with child and family names
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

      // Sort by checkout time (most recent first)
      enriched.sort((a, b) => {
        if (!a.checkOutTime || !b.checkOutTime) return 0;
        return new Date(b.checkOutTime).getTime() - new Date(a.checkOutTime).getTime();
      });

      setCheckIns(enriched);
    } catch (error) {
      console.error('Error loading completed check-ins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Formats a date as "Feb 10, 9:30 AM"
   */
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Loading State: Show skeleton placeholders
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Child</TableHead>
              <TableHead>Family</TableHead>
              <TableHead>Checked In</TableHead>
              <TableHead>Checked Out</TableHead>
              <TableHead>Picked Up By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty State: No history records found
  if (checkIns.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>📋</EmptyMedia>
          <EmptyTitle>No check-in history</EmptyTitle>
          <EmptyDescription>
            Past check-ins will appear here once children are checked out.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // Main Table: Display all completed check-ins
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Child</TableHead>
            <TableHead>Family</TableHead>
            <TableHead>Checked In</TableHead>
            <TableHead>Checked Out</TableHead>
            <TableHead>Picked Up By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkIns.map((checkIn) => (
            <TableRow key={checkIn.checkInId}>
              {/* Child Name */}
              <TableCell className="font-medium">{checkIn.childName || 'Unknown'}</TableCell>

              {/* Family Name */}
              <TableCell>{checkIn.familyName || 'Unknown'}</TableCell>

              {/* Check-In Time */}
              <TableCell className="text-slate-600">
                {formatDateTime(checkIn.checkInTime)}
              </TableCell>

              {/* Check-Out Time */}
              <TableCell className="text-slate-600">
                {checkIn.checkOutTime ? formatDateTime(checkIn.checkOutTime) : '—'}
              </TableCell>

              {/* Picked Up By */}
              <TableCell>
                {checkIn.checkedOutBy ? (
                  <span className="text-slate-900">{checkIn.checkedOutBy}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
