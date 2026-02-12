import { useState, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { getActiveCheckIns, getFamilyById } from '@/utils/api';
import type { EnrichedCheckIn } from '@/types';

/**
 * Active Check-Ins Table Component
 *
 * Displays all currently checked-in children in a table format with actions.
 * Each row represents one child and includes an actions menu for checkout operations.
 */
export function ActiveCheckInsTable() {
  // State for storing enriched check-in data (includes child/family names)

  const [checkIns, setCheckIns] = useState<EnrichedCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load active check-ins on component mount
  useEffect(() => {
    loadActiveCheckIns();
  }, []);

  /**
   * Fetches active check-ins from API and enriches with child/family names.
   * Makes parallel requests to get family data for each check-in.
   */
  const loadActiveCheckIns = async () => {
    try {
      setIsLoading(true);
      const activeCheckIns = await getActiveCheckIns();

      // Enrich each check-in with child and family names
      // We need this because check-ins only store IDs, not names
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
   * Handles check-out with PIN verification.
   * TODO: Implement PIN verification dialog
   */
  const handleCheckOut = (checkIn: EnrichedCheckIn) => {
    console.log('Check out:', checkIn);
    // TODO: Open PIN verification dialog
  };

  /**
   * Handles manual override checkout (emergency situations).
   * TODO: Implement manual override dialog with notes
   */
  const handleManualOverride = (checkIn: EnrichedCheckIn) => {
    console.log('Manual override:', checkIn);
    // TODO: Open manual override dialog
  };

  // Loading State: Show skeleton placeholders while fetching data
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
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Render 5 skeleton rows */}
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
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty State: Show friendly message when no kids are checked in
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

  // Main Table: Display all active check-ins with actions
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Child</TableHead>
            <TableHead>Family</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Checked In</TableHead>
            <TableHead className="w-[70px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkIns.map((checkIn) => {
            // Format check-in time as "9:30 AM"
            const checkInTime = new Date(checkIn.checkInTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <TableRow key={checkIn.checkInId}>
                {/* Child Name */}
                <TableCell className="font-medium">{checkIn.childName || 'Unknown'}</TableCell>

                {/* Family Name */}
                <TableCell>{checkIn.familyName || 'Unknown'}</TableCell>

                {/* Room Badge */}
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {checkIn.room}
                  </span>
                </TableCell>

                {/* Check-In Time */}
                <TableCell className="text-slate-600">{checkInTime}</TableCell>

                {/* Actions Dropdown Menu */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCheckOut(checkIn)}>
                        Check Out
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleManualOverride(checkIn)}>
                        Manual Override
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
