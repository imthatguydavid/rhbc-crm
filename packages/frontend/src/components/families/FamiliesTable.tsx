import { useState, useEffect } from 'react';
import type { Family } from '@rhbc-crm/shared';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
} from '@/components/ui/empty';
import { Badge } from '@/components/ui/badge';
import { getFamilyStatusBadge } from '@/utils/badges';
import { TablePagination } from '@/components/TablePagination';

interface FamiliesTableProps {
  families: Family[];
  isLoading: boolean;
  onAddChild: (family: Family) => void;
  onDelete: (family: Family) => void;
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
  onDelete,
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
                    onClick={() => navigate(`/families/${family.familyId}`)} // ← Change this
                  >
                    {family.lastName} Family
                  </TableCell>
                  <TableCell onClick={() => navigate(`/families/${family.familyId}`)}>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/families/${family.familyId}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddChild(family)}>
                          Add Child
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(family)}
                          className="text-red-600 focus:text-red-600"
                        >
                          Delete Family
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
