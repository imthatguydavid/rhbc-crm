import { useState } from 'react';
import type { Family, Person } from '@rhbc-crm/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { EditFamilyDialog } from '@/components/EditFamilyDialog';
import { EditPersonDialog } from '@/components/EditPersonDialog';
import { AddChildDialog } from '@/components/AddChildDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface FamilyDetailsProps {
  family: Family | null;
  people: Person[];
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  onUpdateFamily?: (
    familyId: string,
    updates: { lastName: string; status: 'member' | 'guest' }
  ) => Promise<void>;
  onUpdatePerson?: (
    personId: string,
    updates: { firstName: string; phone?: string; email?: string }
  ) => Promise<void>;
  onAddChild?: (
    familyId: string,
    childData: { firstName: string; phone?: string; email?: string }
  ) => Promise<void>;
  onDeletePerson?: (personId: string) => Promise<void>;
}

export function FamilyDetails({
  family,
  people,
  open,
  onClose,
  isLoading = false,
  onUpdateFamily,
  onUpdatePerson,
  onAddChild,
  onDeletePerson,
}: FamilyDetailsProps) {
  const [isEditFamilyOpen, setIsEditFamilyOpen] = useState(false);
  const [isEditPersonOpen, setIsEditPersonOpen] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  if (!family && !isLoading) return null;

  // Filter people for this family
  const familyPeople = family ? people.filter((p) => p.familyId === family.familyId) : [];
  const parents = familyPeople.filter((p) => p.role === 'parent');
  const children = familyPeople.filter((p) => p.role === 'child');

  const handleEditFamily = async (updates: { lastName: string; status: 'member' | 'guest' }) => {
    if (onUpdateFamily && family) {
      await onUpdateFamily(family.familyId, updates);
    }
  };

  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person);
    setIsEditPersonOpen(true);
  };

  const handleSavePerson = async (updates: {
    firstName: string;
    phone?: string;
    email?: string;
  }) => {
    if (selectedPerson && onUpdatePerson) {
      await onUpdatePerson(selectedPerson.personId, updates);
    }
  };

  const handleDeletePerson = (person: Person) => {
    setSelectedPerson(person);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedPerson && onDeletePerson) {
      await onDeletePerson(selectedPerson.personId);
      setIsDeleteConfirmOpen(false);
      setSelectedPerson(null);
    }
  };

  const handleAddChild = async (childData: {
    firstName: string;
    phone?: string;
    email?: string;
  }) => {
    if (onAddChild && family) {
      await onAddChild(family.familyId, childData);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {/* Loading State */}
          {isLoading ? (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-9 w-28" />
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Parents Skeleton */}
                <div>
                  <Skeleton className="h-6 w-32 mb-3" />
                  <div className="space-y-3">
                    <PersonCardSkeleton />
                    <PersonCardSkeleton />
                  </div>
                </div>

                {/* Children Skeleton */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                  <div className="space-y-3">
                    <PersonCardSkeleton />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Actual Content */
            family && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-2xl">{family.lastName} Family</DialogTitle>
                      <DialogDescription>
                        {family.status === 'member' ? 'Member Family' : 'Guest Family'} • Added{' '}
                        {new Date(family.createdAt).toLocaleDateString()}
                      </DialogDescription>
                    </div>
                    {onUpdateFamily && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditFamilyOpen(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Family
                      </Button>
                    )}
                  </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Parents Section */}
                  {parents.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">
                        Parents ({parents.length})
                      </h3>
                      <div className="space-y-3">
                        {parents.map((parent) => (
                          <PersonCard
                            key={parent.personId}
                            person={parent}
                            onEdit={onUpdatePerson ? () => handleEditPerson(parent) : undefined}
                            onDelete={onDeletePerson ? () => handleDeletePerson(parent) : undefined}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Children Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Children ({children.length})
                      </h3>
                      {onAddChild && (
                        <Button variant="outline" size="sm" onClick={() => setIsAddChildOpen(true)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Child
                        </Button>
                      )}
                    </div>
                    {children.length > 0 ? (
                      <div className="space-y-3">
                        {children.map((child) => (
                          <PersonCard
                            key={child.personId}
                            person={child}
                            onEdit={onUpdatePerson ? () => handleEditPerson(child) : undefined}
                            onDelete={onDeletePerson ? () => handleDeletePerson(child) : undefined}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                        No children added yet
                      </div>
                    )}
                  </div>
                </div>
              </>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialogs */}
      {family && (
        <>
          <EditFamilyDialog
            family={family}
            open={isEditFamilyOpen}
            onClose={() => setIsEditFamilyOpen(false)}
            onSave={handleEditFamily}
          />

          <EditPersonDialog
            person={selectedPerson}
            open={isEditPersonOpen}
            onClose={() => {
              setIsEditPersonOpen(false);
              setSelectedPerson(null);
            }}
            onSave={handleSavePerson}
          />

          <AddChildDialog
            familyName={family.lastName}
            open={isAddChildOpen}
            onClose={() => setIsAddChildOpen(false)}
            onAdd={handleAddChild}
          />

          <ConfirmDialog
            open={isDeleteConfirmOpen}
            onClose={() => {
              setIsDeleteConfirmOpen(false);
              setSelectedPerson(null);
            }}
            onConfirm={handleConfirmDelete}
            title="Delete Person"
            description={
              selectedPerson
                ? `Are you sure you want to delete ${selectedPerson.firstName}? This action cannot be undone.`
                : ''
            }
            confirmText="Delete"
            cancelText="Cancel"
          />
        </>
      )}
    </>
  );
}

// Person Card Skeleton Component
function PersonCardSkeleton() {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2 ml-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

// Person Card Component
interface PersonCardProps {
  person: Person;
  onEdit?: () => void;
  onDelete?: () => void;
}

function PersonCard({ person, onEdit, onDelete }: PersonCardProps) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900">{person.firstName}</h4>
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

        {/* Action Buttons */}
        {(onEdit || onDelete) && (
          <div className="flex gap-2 ml-4">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
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
