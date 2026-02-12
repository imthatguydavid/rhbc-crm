import { useState } from 'react';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { checkInChild } from '@/utils/api';
import type { Family, Person } from '@rhbc-crm/shared';

interface ReviewStepProps {
  family: Family;
  child: Person;
  onBack: () => void;
}

/**
 * Review Step
 *
 * Step 4 of manual check-in flow.
 * Staff reviews details, generates PIN, and confirms check-in.
 */
export function ReviewStep({ family, child, onBack }: ReviewStepProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Handles check-in confirmation
   */
  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);

      // Call check-in API
      await checkInChild({ familyId: family.familyId, childId: child.personId, room: 'nursery' });

      // Success!
      setIsSuccess(true);

      toast.success(`${child.firstName} checked in successfully!`);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/checkins?tab=active');
      }, 2000);
    } catch (error) {
      console.error('Error checking in child:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to check in child');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success State
  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
        </div>
        <h3 className="text-2xl font-semibold text-slate-900 mb-2">Check-In Complete!</h3>
        <p className="text-slate-600 mb-6">{child.firstName} has been checked in</p>

        {/* Display PIN */}
        <div className="max-w-sm mx-auto mb-6">
          <div className="rounded-lg bg-blue-50 border-2 border-blue-200 p-6">
            <p className="text-sm font-medium text-blue-900 mb-2">Checkout PIN</p>
            <p className="text-xs text-blue-700 mt-2">Give this PIN to the parent for checkout</p>
          </div>
        </div>

        <p className="text-sm text-slate-500">Redirecting to active check-ins...</p>
      </div>
    );
  }

  // Review State
  return (
    <div className="space-y-6">
      {/* Review Details */}
      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Child</p>
              <p className="font-semibold text-slate-900">{child.firstName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Family</p>
              <p className="font-semibold text-slate-900">{family.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <p className="font-semibold text-slate-900">
                {family.status === 'member' ? 'Member' : 'Guest'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> A 4-digit PIN will be generated for checkout. Make sure to give
            this PIN to the parent.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleConfirm} disabled={isSubmitting} className="flex-1">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm Check-In
        </Button>
      </div>
    </div>
  );
}
