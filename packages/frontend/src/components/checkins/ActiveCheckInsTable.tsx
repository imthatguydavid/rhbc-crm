import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
  EmptyContent,
} from '@/components/ui/empty';
import { CheckoutDialog } from './CheckoutDialog';
import { getActiveCheckIns, getFamilyById } from '@/utils/api';
import type { EnrichedCheckIn } from '@/types';

interface ActiveCheckInsTableProps {
  limit?: number; // Limit results (for Dashboard)
  showViewAll?: boolean; // Show "View All →" link
  showActions?: boolean; // Show checkout buttons
  pageSize?: number; // Items per page for pagination
}

/**
 * Active Check-Ins Table Component
 *
 * Unified table component used on both Dashboard and Check Ins page.
 * Supports pagination, limiting results, and optional view all link.
 */
export function ActiveCheckInsTable({
  limit,
  showViewAll = false,
  showActions = true,
  pageSize = 10,
}: ActiveCheckInsTableProps) {
  const navigate = useNavigate();
  const [checkIns, setCheckIns] = useState<EnrichedCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCheckIn, setSelectedCheckIn] = useState<EnrichedCheckIn | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Apply limit if specified (for Dashboard)
  const limitedCheckIns = limit ? checkIns.slice(0, limit) : checkIns;

  // Pagination calculations
  const totalPages = Math.ceil(limitedCheckIns.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCheckIns = limitedCheckIns.slice(startIndex, endIndex);

  // Show pagination only if we have more than one page and no limit
  const showPagination = !limit && totalPages > 1;

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-4">
        {showViewAll && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>
        )}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead>Checked In</TableHead>
                {showActions && <TableHead className="w-[120px]"></TableHead>}
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
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <Skeleton className="h-9 w-24" />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
          <Button onClick={() => navigate('/checkins/new')}>Check In Child</Button>
        </EmptyContent>
      </Empty>
    );
  }

  // Main Table
  return (
    <>
      <div className="space-y-4">
        {/* Header with View All */}
        {showViewAll && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Active Check-Ins ({checkIns.length} {checkIns.length === 1 ? 'child' : 'children'})
            </h2>
            <Button variant="link" onClick={() => navigate('/checkins')} className="text-blue-600">
              View All →
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead>Checked In</TableHead>
                {showActions && (
                  <TableHead className="w-[120px]">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCheckIns.map((checkIn) => {
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
                    <TableCell>
                      <span className="font-mono font-semibold text-slate-900">
                        {checkIn.checkOutPin || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">{checkInTime}</TableCell>
                    {showActions && (
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleCheckOut(checkIn)}>
                          Check Out
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
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
                  className={
                    currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                  }
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

      {/* Checkout Dialog */}
      {showActions && (
        <CheckoutDialog
          checkIn={selectedCheckIn}
          open={!!selectedCheckIn}
          onClose={handleCloseDialog}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </>
  );
}
