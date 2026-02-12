import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  EmptyContent,
} from '@/components/ui/empty';
import { CheckoutDialog } from './CheckoutDialog';
import { getActiveCheckIns, getFamilyById } from '@/utils/api';
import type { EnrichedCheckIn } from '@/types';

/**
 * Active Check-Ins Table Component
 *
 * Displays all currently checked-in children with checkout buttons.
 * Staff can click "Check Out" to log who picked up the child.
 */
export function ActiveCheckInsTable() {
  const [checkIns, setCheckIns] = useState<EnrichedCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCheckIn, setSelectedCheckIn] = useState<EnrichedCheckIn | null>(null);

  // Load active check-ins on mount
  useEffect(() => {
    loadActiveCheckIns();
  }, []);

  /**
   * Fetches active check-ins and enriches with child/family names
   */
  const loadActiveCheckIns = async () => {
    try {
      setIsLoading(true);
      const activeCheckIns = await getActiveCheckIns();

      // Enrich with child and family names
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

  /**
   * Opens checkout dialog for a specific check-in
   */
  const handleCheckOut = (checkIn: EnrichedCheckIn) => {
    setSelectedCheckIn(checkIn);
  };

  /**
   * Closes checkout dialog
   */
  const handleCloseDialog = () => {
    setSelectedCheckIn(null);
  };

  /**
   * Handles successful checkout - refresh table
   */
  const handleCheckoutSuccess = () => {
    setSelectedCheckIn(null);
    loadActiveCheckIns(); // Refresh the table
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Child</TableHead>
              <TableHead>Family</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Checked In</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-9 w-24" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty State
  if (checkIns.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>👶</EmptyMedia>
          <EmptyTitle>No active check-ins</EmptyTitle>
          <EmptyDescription>There are no children currently checked in.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => (window.location.href = '/checkins/new')}>Check In Child</Button>
        </EmptyContent>
      </Empty>
    );
  }

  // Main Table
  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Child</TableHead>
              <TableHead>Family</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Checked In</TableHead>
              <TableHead className="w-[120px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checkIns.map((checkIn) => {
              const checkInTime = new Date(checkIn.checkInTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              });

              return (
                <TableRow key={checkIn.checkInId}>
                  <TableCell className="font-medium">{checkIn.childName || 'Unknown'}</TableCell>
                  <TableCell>{checkIn.familyName || 'Unknown'}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {checkIn.room}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600">{checkInTime}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleCheckOut(checkIn)}>
                      Check Out
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        checkIn={selectedCheckIn}
        open={!!selectedCheckIn}
        onClose={handleCloseDialog}
        onSuccess={handleCheckoutSuccess}
      />
    </>
  );
}
