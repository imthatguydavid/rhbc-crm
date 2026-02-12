import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutList, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckInCard } from './CheckInCard';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import type { EnrichedCheckIn } from '@/types';

interface ActiveCheckInsListProps {
  checkIns: EnrichedCheckIn[];
  isLoading?: boolean;
}

type ViewMode = 'table' | 'cards';

export function ActiveCheckInsList({ checkIns, isLoading }: ActiveCheckInsListProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('dashboard-view-mode') as ViewMode) || 'table';
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('dashboard-view-mode', mode);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Table skeleton */}
        <div className="border rounded-lg p-4">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="flex gap-4" key={index}>
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (checkIns.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>👶</EmptyMedia>
          <EmptyTitle>No children checked in</EmptyTitle>
          <EmptyDescription>All quiet in the nursery!</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => navigate('/checkins/new')}>Check In Child</Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Active Check-Ins ({checkIns.length} {checkIns.length === 1 ? 'child' : 'children'})
        </h2>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <TooltipProvider>
            <div className="inline-flex rounded-lg border border-slate-200 p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleViewModeChange('table')}
                    className="px-3"
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Table View</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleViewModeChange('cards')}
                    className="px-3"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Card View</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Checked In</TableHead>
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checkIns.map((checkIn) => (
            <CheckInCard key={checkIn.checkInId} checkIn={checkIn} />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 justify-center mt-8">
        <Button variant="link" onClick={() => navigate('/checkins')} className="text-blue-600">
          View All Check-Ins
        </Button>
      </div>
    </div>
  );
}
