import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddFamilyDialog } from '@/components/AddFamilyDialog';
import { createFamily } from '@/utils/api';
import type { Family } from '@rhbc-crm/shared';

interface NewFamilyButtonProps {
  onSuccess?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

/**
 * New Family Button with Dialog
 *
 * Reusable component that includes both the button and dialog.
 * Can be used anywhere in the app (Dashboard, Families page, etc.)
 *
 * Features:
 * - Opens AddFamilyDialog on click
 * - Handles family creation via API
 * - Calls onSuccess callback after successful creation
 * - Customizable button variant and styling
 */
export function NewFamilyButton({
  onSuccess,
  variant = 'default',
  className = '',
}: NewFamilyButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Opens the dialog
   */
  const handleClick = () => {
    setIsDialogOpen(true);
  };

  /**
   * Closes the dialog
   */
  const handleClose = () => {
    setIsDialogOpen(false);
    setError(null);
  };

  /**
   * Handles adding a new family via API
   */
  const handleAddFamily = async (
    family: Family,
    parentData: { firstName: string; phone: string; email?: string }
  ) => {
    try {
      setError(null);

      // Create family via API
      await createFamily({
        lastName: family.lastName,
        status: family.status,
        parentFirstName: parentData.firstName,
        parentPhone: parentData.phone,
        parentEmail: parentData.email,
      });

      // Close dialog
      setIsDialogOpen(false);

      // Notify parent component (if callback provided)
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create family');
      console.error('Error creating family:', err);
    }
  };

  return (
    <>
      <Button onClick={handleClick} variant={variant} className={`gap-2 ${className}`}>
        <Plus className="h-4 w-4" />
        New Family
      </Button>

      <AddFamilyDialog open={isDialogOpen} onClose={handleClose} onAddFamily={handleAddFamily} />

      {/* Error Display (if needed) */}
      {error && <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
    </>
  );
}
