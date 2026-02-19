import { Person } from '@rhbc-crm/shared';
import { formatPhone } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface PersonCardProps {
  person: Person;
  onEdit: () => void;
  onDelete: () => void;
}

export function PersonCard({ person, onEdit, onDelete }: PersonCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{person.firstName}</h3>
            <span className="text-xs text-slate-500">({person.role})</span>
          </div>

          <div className="mt-2 space-y-1 text-sm">
            {person.phone && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Phone:</span>
                <a href={`tel:${person.phone}`} className="text-blue-600 hover:underline">
                  {formatPhone(person.phone)}
                </a>
              </div>
            )}

            {person.email && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Email:</span>
                <a href={`mailto:${person.email}`} className="text-blue-600 hover:underline">
                  {person.email}
                </a>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
