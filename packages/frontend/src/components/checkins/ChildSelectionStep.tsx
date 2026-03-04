import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { getFamilyById } from '@/utils/api';
import { type Family, type Person, PERSON_ROLE } from '@rhbc-crm/shared';

interface ChildSelectionStepProps {
  family: Family;
  onChildSelected: (child: Person) => void;
  onBack: () => void;
}

/**
 * Child Selection Step
 *
 * Step 2 of manual check-in flow.
 * Staff selects which child from the family to check in.
 */
export function ChildSelectionStep({ family, onChildSelected, onBack }: ChildSelectionStepProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFamilyMembers();
  }, [family.familyId]);

  /**
   * Loads family members from API
   */
  const loadFamilyMembers = async () => {
    try {
      setIsLoading(true);
      const data = await getFamilyById(family.familyId);
      setPeople(data.people);
    } catch (error) {
      console.error('Error loading family members:', error);
      setPeople([]);
    } finally {
      setIsLoading(false);
    }
  };

  const children = people.filter((p) => p.role === PERSON_ROLE.CHILD);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
        <p className="mt-2 text-slate-600">Loading family members...</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <>
        <Empty>
          <EmptyHeader>
            <EmptyMedia>👶</EmptyMedia>
            <EmptyTitle>No children in this family</EmptyTitle>
            <EmptyDescription>
              This family doesn't have any children registered yet.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
        <div className="mt-6">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-slate-50 p-4 border">
        <p className="text-sm text-slate-600">Selected Family</p>
        <p className="font-semibold text-slate-900">{family.lastName} Family</p>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-slate-600">
          {children.length} {children.length === 1 ? 'child' : 'children'}
        </p>
        <div className="space-y-2">
          {children.map((child) => (
            <button
              key={child.personId}
              onClick={() => onChildSelected(child)}
              className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{child.firstName}</p>
                  <p className="text-sm text-slate-600">Child</p>
                </div>
                <span className="text-slate-400">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <Button variant="outline" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Search
      </Button>
    </div>
  );
}
