import { useState, useEffect } from 'react';
import type { Family } from '@rhbc-crm/shared';
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
} from '@/components/ui/empty';
import { Badge } from '@/components/ui/badge';
import { getFamilyStatusBadge } from '@/utils/badges';
import { TablePagination } from '@/components/TablePagination';
import { UserPlus } from 'lucide-react';

interface FamiliesTableProps {
  families: Family[];
  isLoading: boolean;
  onAddChild: (family: Family) => void;
  pageSize?: number;
}

/**
 * Families Table Component
 *
 * Displays all families in a data table with row actions and pagination.
 * Shows family name, status, and actions menu for each family.
 */
export function FamiliesTable({
  families,
  isLoading,
  onAddChild,
  pageSize = 10,
}: FamiliesTableProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(families.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedFamilies = families.slice(startIndex, endIndex);

  const showPagination = totalPages > 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [families]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Family Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (families.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>👨‍👩‍👧‍👦</EmptyMedia>
          <EmptyTitle>No families found</EmptyTitle>
          <EmptyDescription>
            Try adjusting your search or filters to find what you're looking for.
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
              <TableHead>Family Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFamilies.map((family) => {
              const badge = getFamilyStatusBadge(family.status);
              return (
                <TableRow key={family.familyId} className="cursor-pointer hover:bg-slate-50">
                  <TableCell
                    className="font-medium"
                    onClick={() => navigate(`/families/${family.familyId}`)}
                  >
                    {family.lastName} Family
                  </TableCell>
                  <TableCell onClick={() => navigate(`/families/${family.familyId}`)}>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        onAddChild(family);
                      }}
                    >
                      <UserPlus />
                    </Button>
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
