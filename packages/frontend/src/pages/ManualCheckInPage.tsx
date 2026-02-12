import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FamilySearchStep } from '@/components/checkins/FamilySearchStep';
import { ChildSelectionStep } from '@/components/checkins/ChildSelectionStep';
import { ReviewStep } from '@/components/checkins/ReviewStep';
import type { Family, Person } from '@rhbc-crm/shared';

type Step = 'family' | 'child' | 'review';

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
  const [currentStep, setCurrentStep] = useState<Step>('family');
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [selectedChild, setSelectedChild] = useState<Person | null>(null);

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
    setCurrentStep('child');
  };

  /**
   * Step 2: Child selected
   */
  const handleChildSelected = (child: Person) => {
    setSelectedChild(child);
    setCurrentStep('review');
  };

  /**
   * Go back one step
   */
  const handleBack = () => {
    if (currentStep === 'child') setCurrentStep('family');
    if (currentStep === 'review') setCurrentStep('child');
  };

  /**
   * Get step number for progress indicator
   */
  const getStepNumber = () => {
    switch (currentStep) {
      case 'family':
        return 1;
      case 'child':
        return 2;
      case 'review':
        return 3;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manual Check-In</h1>
          <p className="text-slate-600">Step {getStepNumber()} of 3</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex gap-2">
        <div
          className={`h-2 flex-1 rounded-full ${currentStep === 'family' ? 'bg-blue-600' : 'bg-slate-200'}`}
        />
        <div
          className={`h-2 flex-1 rounded-full ${currentStep === 'child' ? 'bg-blue-600' : 'bg-slate-200'}`}
        />
        <div
          className={`h-2 flex-1 rounded-full ${currentStep === 'review' ? 'bg-blue-600' : 'bg-slate-200'}`}
        />
      </div>

      {/* Form Steps */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 'family' && 'Find Family'}
            {currentStep === 'child' && 'Select Child'}
            {currentStep === 'review' && 'Review & Confirm'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'family' && 'Search for the family by last name'}
            {currentStep === 'child' && 'Choose which child to check in'}
            {currentStep === 'review' && 'Review the details and complete check-in'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Family Search */}
          {currentStep === 'family' && <FamilySearchStep onFamilySelected={handleFamilySelected} />}

          {/* Step 2: Child Selection */}
          {currentStep === 'child' && selectedFamily && (
            <ChildSelectionStep
              family={selectedFamily}
              onChildSelected={handleChildSelected}
              onBack={handleBack}
            />
          )}

          {/* Step 3: Review & Confirm */}
          {currentStep === 'review' && selectedFamily && selectedChild && (
            <ReviewStep family={selectedFamily} child={selectedChild} onBack={handleBack} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
