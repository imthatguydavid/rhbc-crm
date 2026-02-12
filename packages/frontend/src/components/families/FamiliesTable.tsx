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
import type { Family } from '@rhbc-crm/shared';

interface FamiliesTableProps {
  families: Family[];
  isLoading: boolean;
  onViewDetails: (family: Family) => void;
  onAddChild: (family: Family) => void;
  onDelete: (family: Family) => void;
}

/**
 * Families Table Component
 *
 * Displays all families in a data table with row actions.
 * Shows family name, status, and actions menu for each family.
 */
export function FamiliesTable({
  families,
  isLoading,
  onViewDetails,
  onAddChild,
  onDelete,
}: FamiliesTableProps) {
  // Loading State: Show skeleton placeholders while fetching
  if (isLoading) {
    return (
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

  // Main Table: Display all families with actions
  return (
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
          {families.map((family) => (
            <TableRow key={family.familyId} className="cursor-pointer hover:bg-slate-50">
              {/* Family Name - Clickable to view details */}
              <TableCell className="font-medium" onClick={() => onViewDetails(family)}>
                {family.lastName} Family
              </TableCell>

              {/* Status Badge */}
              <TableCell onClick={() => onViewDetails(family)}>
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
                    <DropdownMenuItem onClick={() => onViewDetails(family)}>
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
  );
}
