import { useState } from 'react';
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
import type { Family } from '@rhbc-crm/shared';
import { useNavigate } from 'react-router-dom';

interface FamiliesTableProps {
  families: Family[];
  isLoading: boolean;
  onAddChild: (family: Family) => void;
  onDelete: (family: Family) => void;
  pageSize?: number; // Items per page
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

  // Pagination calculations
  const totalPages = Math.ceil(families.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedFamilies = families.slice(startIndex, endIndex);

  // Show pagination only if we have more than one page
  const showPagination = totalPages > 1;

  // Reset to page 1 when families list changes (e.g., after filtering)
  // This prevents being on page 5 when filter only returns 2 families
  useState(() => {
    setCurrentPage(1);
  });

  // Loading State: Show skeleton placeholders while fetching
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

  // Empty State: No families found (after filtering)
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

  // Main Table: Display paginated families with actions
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
            {paginatedFamilies.map((family) => (
              <TableRow key={family.familyId} className="cursor-pointer hover:bg-slate-50">
                {/* Family Name - Clickable to view details */}
                <TableCell
                  className="font-medium"
                  onClick={() => navigate(`/families/${family.familyId}`)} // ← Change this
                >
                  {family.lastName} Family
                </TableCell>

                {/* Status Badge */}
                <TableCell onClick={() => navigate(`/families/${family.familyId}`)}>
                  {' '}
                  {/* ← Change this */}
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      family.status === 'member'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {family.status === 'member' ? 'Member' : 'Guest'}
                  </span>
                </TableCell>

                {/* Actions Dropdown Menu */}
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
