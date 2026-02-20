import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FamilySearchStep } from '@/components/checkins/FamilySearchStep';
import { ChildSelectionStep } from '@/components/checkins/ChildSelectionStep';
import { ReviewStep } from '@/components/checkins/ReviewStep';
import type { Family, Person } from '@rhbc-crm/shared';

/**
 * Step identifiers for the manual check-in wizard
 */
const STEPS = {
  FAMILY: 'family',
  CHILD: 'child',
  REVIEW: 'review',
} as const;

type Step = (typeof STEPS)[keyof typeof STEPS];

/**
 * Configuration for each step in the wizard
 */
const STEP_CONFIG = {
  [STEPS.FAMILY]: {
    number: 1,
    title: 'Find Family',
    description: 'Search for the family by last name',
  },
  [STEPS.CHILD]: {
    number: 2,
    title: 'Select Child',
    description: 'Choose which child to check in',
  },
  [STEPS.REVIEW]: {
    number: 3,
    title: 'Review & Confirm',
    description: 'Review the details and complete check-in',
  },
} as const;

/**
 * Step navigation map for going back
 */
const PREVIOUS_STEP: Record<Step, Step | null> = {
  [STEPS.FAMILY]: null,
  [STEPS.CHILD]: STEPS.FAMILY,
  [STEPS.REVIEW]: STEPS.CHILD,
};

/**
 * Manual Check-In Page
 *
 * Staff-operated form for checking in children.
 * Multistep wizard: Search Family → Select Child → Assign Room → Review & Confirm
 *
 * Used when:
 * - Parent doesn't have phone/iPad access
 * - Staff checking in multiple kids quickly
 * - Emergency situations
 */
export function ManualCheckInPage() {
  const navigate = useNavigate();

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>(STEPS.FAMILY);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [selectedChild, setSelectedChild] = useState<Person | null>(null);

  // Current step configuration
  const stepConfig = STEP_CONFIG[currentStep];
  const totalSteps = Object.keys(STEP_CONFIG).length;

  /**
   * Navigate back to Check Ins page
   */
  const handleCancel = () => {
    navigate('/checkins');
  };

  /**
   * Step 1: Family selected
   */
  const handleFamilySelected = (family: Family) => {
    setSelectedFamily(family);
    setCurrentStep(STEPS.CHILD);
  };

  /**
   * Step 2: Child selected
   */
  const handleChildSelected = (child: Person) => {
    setSelectedChild(child);
    setCurrentStep(STEPS.REVIEW);
  };

  /**
   * Go back one step
   */
  const handleBack = () => {
    const previousStep = PREVIOUS_STEP[currentStep];
    if (previousStep) {
      setCurrentStep(previousStep);
    }
  };

  const readyForReview = currentStep === STEPS.REVIEW && selectedFamily && selectedChild;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manual Check-In</h1>
          <p className="text-slate-600">
            Step {stepConfig.number} of {totalSteps}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {Object.values(STEP_CONFIG).map((step) => (
          <div
            key={step.number}
            className={`h-2 flex-1 rounded-full ${
              step.number <= stepConfig.number ? 'bg-blue-600' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{stepConfig.title}</CardTitle>
          <CardDescription>{stepConfig.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === STEPS.FAMILY && (
            <FamilySearchStep onFamilySelected={handleFamilySelected} />
          )}
          {currentStep === STEPS.CHILD && selectedFamily && (
            <ChildSelectionStep
              family={selectedFamily}
              onChildSelected={handleChildSelected}
              onBack={handleBack}
            />
          )}
          {readyForReview && (
            <ReviewStep family={selectedFamily} child={selectedChild} onBack={handleBack} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
