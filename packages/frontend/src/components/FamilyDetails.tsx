import type { Family, Person } from '@rhbc-crm/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FamilyDetailsProps {
  family: Family | null;
  people: Person[];  // ← Changed from importing mockPeople
  open: boolean;
  onClose: () => void;
}

export function FamilyDetails({ family, people, open, onClose }: FamilyDetailsProps) {
  if (!family) return null;

  // Filter people for this family
  const familyPeople = people.filter(p => p.familyId === family.familyId);
  const parents = familyPeople.filter(p => p.role === 'parent');
  const children = familyPeople.filter(p => p.role === 'child');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {family.lastName} Family
          </DialogTitle>
          <DialogDescription>
            {family.status === 'member' ? 'Member Family' : 'Guest Family'} •
            Added {new Date(family.createdAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Parents Section */}
          {parents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Parents ({parents.length})
              </h3>
              <div className="space-y-3">
                {parents.map(parent => (
                  <PersonCard key={parent.personId} person={parent} />
                ))}
              </div>
            </div>
          )}

          {/* Children Section */}
          {children.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Children ({children.length})
              </h3>
              <div className="space-y-3">
                {children.map(child => (
                  <PersonCard key={child.personId} person={child} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {familyPeople.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No family members found
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Person Card Component
function PersonCard({ person }: { person: Person }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900">
              {person.firstName}
            </h4>
            <span className="text-xs text-slate-500">
              ({person.role})
            </span>
          </div>

          <div className="mt-2 space-y-1 text-sm">
            {person.phone && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Phone:</span>
                <a
                  href={`tel:${person.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {formatPhone(person.phone)}
                </a>
              </div>
            )}

            {person.email && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Email:</span>
                <a
                  href={`mailto:${person.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {person.email}
                </a>
              </div>
            )}

            {person.allergies && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Allergies:</span>
                <span className="font-medium text-red-600">
                  {person.allergies}
                </span>
              </div>
            )}

            {person.notes && (
              <div className="flex items-start gap-2">
                <span className="text-slate-500">Notes:</span>
                <span className="text-slate-700">{person.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format phone numbers
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}