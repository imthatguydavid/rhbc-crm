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

interface FamilyListProps {
  families: Family[];
  onViewDetails: (family: Family) => void;
}

export function FamilyList({ families, onViewDetails }: FamilyListProps) {
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Family Name</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {families.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No families found
              </TableCell>
            </TableRow>
          ) : (
            families.map((family) => (
              <TableRow key={family.familyId}>
                <TableCell className="font-medium">{family.lastName} Family</TableCell>
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
                <TableCell className="text-sm text-slate-500">
                  {new Date(family.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(family)}>
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
