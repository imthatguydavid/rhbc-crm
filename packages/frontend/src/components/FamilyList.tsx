import { useMemo } from 'react';
import type { Family } from '@rhbc-crm/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getPeopleByFamily } from '@/data/mockData';

interface FamilyListProps {
  families: Family[];
  onViewDetails: (family: Family) => void;  // ← New prop
}

export function FamilyList({ families, onViewDetails }: FamilyListProps) {
  // Compute family stats
  const familyStats = useMemo(() => {
    return families.map(family => {
      const people = getPeopleByFamily(family.familyId);
      const parents = people.filter(p => p.role === 'parent');
      const children = people.filter(p => p.role === 'child');

      return {
        ...family,
        parentCount: parents.length,
        childCount: children.length,
      };
    });
  }, [families]);

  console.log('this is sparta!', families);
  console.log('hail sparta!', familyStats);

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Family Name</TableHead>
            <TableHead className="text-center">Parents</TableHead>
            <TableHead className="text-center">Children</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {familyStats.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No families found
              </TableCell>
            </TableRow>
          ) : (
            familyStats.map(family => (
              <TableRow key={family.familyId}>
                <TableCell className="font-medium">
                  {family.lastName} Family
                </TableCell>
                <TableCell className="text-center">
                  {family.parentCount}
                </TableCell>
                <TableCell className="text-center">
                  {family.childCount}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      family.status === 'member'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {family.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(family)}  // ← New click handler
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}