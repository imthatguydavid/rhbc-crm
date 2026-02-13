import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { getCompletedCheckIns, getFamilyById } from '@/utils/api';
import type { EnrichedCheckIn } from '@/types';

interface HistoryCheckInsTableProps {
  pageSize?: number;
}

/**
 * History Check-Ins Table Component
 *
 * Displays all completed check-ins (past records) with checkout information.
 * Shows who picked up each child and when. Sorted by checkout time (most recent first).
 */
export function HistoryCheckInsTable({ pageSize = 10 }: HistoryCheckInsTableProps) {
  const [checkIns, setCheckIns] = useState<EnrichedCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Load completed check-ins on component mount
  useEffect(() => {
    loadCompletedCheckIns();
  }, []);

  /**
   * Fetches completed check-ins from dedicated endpoint.
   * Enriches data with child and family names.
   */
  const loadCompletedCheckIns = async () => {
    try {
      setIsLoading(true);

      // Use dedicated completed check-ins endpoint
      const completedCheckIns = await getCompletedCheckIns();

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

  // Pagination calculations
  const totalPages = Math.ceil(checkIns.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCheckIns = checkIns.slice(startIndex, endIndex);

  // Show pagination only if we have more than one page
  const showPagination = totalPages > 1;

  // Loading State: Show skeleton placeholders
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Checked In</TableHead>
                <TableHead>Checked Out</TableHead>
                <TableHead>Picked Up By</TableHead>
                <TableHead>Method</TableHead>
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
                    <Skeleton className="h-6 w-20" />
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
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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

  // Main Table: Display completed check-ins with pagination
  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Child</TableHead>
              <TableHead>Family</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Checked In</TableHead>
              <TableHead>Checked Out</TableHead>
              <TableHead>Picked Up By</TableHead>
              <TableHead>Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCheckIns.map((checkIn) => (
              <TableRow key={checkIn.checkInId}>
                {/* Child Name */}
                <TableCell className="font-medium">{checkIn.childName || 'Unknown'}</TableCell>

                {/* Family Name */}
                <TableCell>{checkIn.familyName || 'Unknown'}</TableCell>

                {/* Room */}
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {checkIn.room}
                  </span>
                </TableCell>

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

                {/* Checkout Method */}
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      checkIn.checkOutMethod === 'pin'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {checkIn.checkOutMethod === 'pin' ? 'PIN' : 'Staff'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={
                  currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
