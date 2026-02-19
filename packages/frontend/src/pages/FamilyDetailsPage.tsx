import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Family, FamilyStatus, Person, PERSON_ROLE } from '@rhbc-crm/shared';
import { ArrowLeft, Pencil, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { EditFamilySheet } from '@/components/families/EditFamilySheet';
import { EditPersonSheet } from '@/components/families/EditPersonSheet';
import { AddChildSheet } from '@/components/families/AddChildSheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  getFamilyById,
  updateFamily,
  updatePerson,
  addChildToFamily,
  deletePerson,
} from '@/utils/api';
import { getFamilyStatusBadge } from '@/utils/badges';
import { PersonCard } from '@/components/families/PersonCard';
import { Badge } from '@/components/ui/badge';

/**
 * Family Details Page
 *
 * Full-page view of family information with parents and children.
 * Edit actions open drawers (sheets) from the right side.
 */
export function FamilyDetailsPage() {
  const { familyId } = useParams<{ familyId: string }>();
  const navigate = useNavigate();
  const [family, setFamily] = useState<Family | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditFamilyOpen, setIsEditFamilyOpen] = useState(false);
  const [isEditPersonOpen, setIsEditPersonOpen] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    if (familyId) {
      loadFamilyDetails();
    }
  }, [familyId]);

  /**
   * Loads family details and members
   */
  const loadFamilyDetails = async () => {
    if (!familyId) return;

    try {
      setIsLoading(true);
      const data = await getFamilyById(familyId);
      setFamily(data.family);
      setPeople(data.people);
    } catch (error) {
      console.error('Error loading family details:', error);
      toast.error('Failed to load family details');
      navigate('/families'); // Redirect if family not found
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles updating family information
   */
  const handleUpdateFamily = async (updates: { lastName: string; status: FamilyStatus }) => {
    if (!family) return;

    try {
      await updateFamily(family.familyId, updates);
      await loadFamilyDetails(); // Refresh
      toast.success('Family updated successfully');
    } catch (error) {
      console.error('Error updating family:', error);
      toast.error('Failed to update family');
    }
  };

  /**
   * Opens edit person drawer
   */
  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person);
    setIsEditPersonOpen(true);
  };

  /**
   * Handles updating person information
   */
  const handleUpdatePerson = async (updates: {
    firstName: string;
    phone?: string;
    email?: string;
  }) => {
    if (!selectedPerson) return;

    try {
      await updatePerson(selectedPerson.personId, updates);
      await loadFamilyDetails(); // Refresh
      toast.success('Person updated successfully');
    } catch (error) {
      console.error('Error updating person:', error);
      toast.error('Failed to update person');
    }
  };

  /**
   * Opens delete confirmation dialog
   */
  const handleDeletePerson = (person: Person) => {
    setSelectedPerson(person);
    setIsDeleteConfirmOpen(true);
  };

  /**
   * Confirms person deletion
   */
  const handleConfirmDelete = async () => {
    if (!selectedPerson) return;

    try {
      await deletePerson(selectedPerson.personId);
      await loadFamilyDetails(); // Refresh
      toast.success('Person deleted successfully');
      setIsDeleteConfirmOpen(false);
      setSelectedPerson(null);
    } catch (error) {
      console.error('Error deleting person:', error);
      toast.error('Failed to delete person');
    }
  };

  /**
   * Handles adding a child
   */
  const handleAddChild = async (childData: {
    firstName: string;
    phone?: string;
    email?: string;
  }) => {
    if (!family) return;

    try {
      await addChildToFamily(family.familyId, childData);
      await loadFamilyDetails(); // Refresh
      toast.success('Child added successfully');
    } catch (error) {
      console.error('Error adding child:', error);
      toast.error('Failed to add child');
    }
  };

  // Filter people
  const parents = people.filter((p) => p.role === PERSON_ROLE.PARENT);
  const children = people.filter((p) => p.role === PERSON_ROLE.CHILD);

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-6 w-32 mb-3" />
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
          <div>
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!family) {
    return null;
  }

  const badge = getFamilyStatusBadge(family.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/families')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{family.lastName} Family</h1>
            <p className="text-slate-600">
              <Badge className={`${badge.className} mr-4`}>{badge.label}</Badge>
              Added {new Date(family.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditFamilyOpen(true)} className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit Family
        </Button>
      </div>
      {parents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Parents ({parents.length})</h2>
          <div className="space-y-3">
            {parents.map((parent) => (
              <PersonCard
                key={parent.personId}
                person={parent}
                onEdit={() => handleEditPerson(parent)}
                onDelete={() => handleDeletePerson(parent)}
              />
            ))}
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-slate-900">Children ({children.length})</h2>
          <Button variant="outline" onClick={() => setIsAddChildOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Child
          </Button>
        </div>
        {children.length > 0 ? (
          <div className="space-y-3">
            {children.map((child) => (
              <PersonCard
                key={child.personId}
                person={child}
                onEdit={() => handleEditPerson(child)}
                onDelete={() => handleDeletePerson(child)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
            No children added yet
          </div>
        )}
      </div>
      <EditFamilySheet
        family={family}
        open={isEditFamilyOpen}
        onClose={() => setIsEditFamilyOpen(false)}
        onSave={handleUpdateFamily}
      />
      <EditPersonSheet
        person={selectedPerson}
        open={isEditPersonOpen}
        onClose={() => {
          setIsEditPersonOpen(false);
          setSelectedPerson(null);
        }}
        onSave={handleUpdatePerson}
      />

      <AddChildSheet
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
    </div>
  );
}
