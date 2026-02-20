import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Family, Person, FamilyStatus, PERSON_ROLE } from '@rhbc-crm/shared';
import {
  getFamilyById,
  updateFamily,
  updatePerson,
  addChildToFamily,
  deletePerson,
} from '@/utils/api';
import { toast } from 'sonner';

export function useFamilyDetails(familyId: string | undefined) {
  const navigate = useNavigate();

  const [family, setFamily] = useState<Family | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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
      navigate('/families');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (familyId) {
      loadFamilyDetails();
    }
  }, [familyId]);

  const parents = people.filter((p) => p.role === PERSON_ROLE.PARENT);
  const children = people.filter((p) => p.role === PERSON_ROLE.CHILD);

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

  return {
    family,
    parents,
    children,
    isLoading,
    isDeleteConfirmOpen,
    selectedPerson,
    setSelectedPerson,
    setIsDeleteConfirmOpen,
    handleUpdateFamily,
    handleUpdatePerson,
    handleConfirmDelete,
    handleAddChild,
  };
}
