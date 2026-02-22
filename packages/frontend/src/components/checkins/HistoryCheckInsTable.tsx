import { useState } from 'react';
import { getRoomBadge, getCheckoutMethodBadge } from '@/utils/badges';
import { formatDateTime } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
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
import { useHistoryCheckIns } from '@/hooks/useHistoryCheckIns';
import { TablePagination } from '@/components/TablePagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const { isLoading, checkIns } = useHistoryCheckIns();

  const totalPages = Math.ceil(checkIns.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCheckIns = checkIns.slice(startIndex, startIndex + pageSize);
  const showPagination = totalPages > 1;

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
            {paginatedCheckIns.map((checkIn) => {
              const roomBadge = getRoomBadge(checkIn.room);
              const methodBadge = getCheckoutMethodBadge(checkIn.checkOutMethod);
              return (
                <TableRow key={checkIn.checkInId}>
                  <TableCell className="font-medium">{checkIn.childName || 'Unknown'}</TableCell>
                  <TableCell>{checkIn.familyName || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge className={roomBadge.className}>{roomBadge.label}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatDateTime(checkIn.checkInTime)}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {checkIn.checkOutTime ? formatDateTime(checkIn.checkOutTime) : '—'}
                  </TableCell>
                  <TableCell>
                    {checkIn.checkedOutBy ? (
                      <span className="text-slate-900">{checkIn.checkedOutBy}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={methodBadge.className}>{methodBadge.label}</Badge>
                  </TableCell>
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
  );
}
