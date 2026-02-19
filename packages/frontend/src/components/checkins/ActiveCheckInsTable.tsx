import { useState } from 'react';
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
import type { EnrichedCheckIn } from '@/types';
import { Badge } from '@/components/ui/badge';
import { getRoomBadge } from '@/utils/badges';
import { useActiveCheckIns } from '@/hooks/useActiveCheckIns';
import { TablePagination } from '@/components/TablePagination';

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
  const [selectedCheckIn, setSelectedCheckIn] = useState<EnrichedCheckIn | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { isLoading, checkIns, loadActiveCheckIns } = useActiveCheckIns();

  const handleCheckOut = (checkIn: EnrichedCheckIn) => {
    setSelectedCheckIn(checkIn);
  };

  const handleCloseDialog = () => {
    setSelectedCheckIn(null);
  };

  const handleCheckoutSuccess = () => {
    setSelectedCheckIn(null);
    loadActiveCheckIns();
  };

  const limitedCheckIns = limit ? checkIns.slice(0, limit) : checkIns;

  // Pagination calculations
  const totalPages = Math.ceil(limitedCheckIns.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCheckIns = limitedCheckIns.slice(startIndex, endIndex);

  // Show pagination only if we have more than one page and no limit
  const showPagination = !limit && totalPages > 1;

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

  return (
    <>
      <div className="space-y-4">
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
                const badge = getRoomBadge(checkIn.room);
                return (
                  <TableRow key={checkIn.checkInId}>
                    <TableCell className="font-medium">{checkIn.childName || 'Unknown'}</TableCell>
                    <TableCell>{checkIn.familyName || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge className={badge.className}>{badge.label}</Badge>
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
        {showPagination && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
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
