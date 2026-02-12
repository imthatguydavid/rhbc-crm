import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { EnrichedCheckIn } from '@/types';
import { adminCheckOut } from '@/utils/api';

interface CheckoutDialogProps {
  checkIn: EnrichedCheckIn | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Checkout Dialog
 *
 * Simple confirmation dialog for checking out a child.
 * Staff enters the name of the person picking up.
 * No PIN required - staff has authority to check out any child.
 */
export function CheckoutDialog({ checkIn, open, onClose, onSuccess }: CheckoutDialogProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Reset form when dialog closes
   */
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName('');
      onClose();
    }
  };

  /**
   * Handles checkout submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter the name of the person picking up');
      return;
    }

    if (!checkIn) {
      toast.error('No check-in selected');
      return;
    }

    try {
      setIsLoading(true);

      await adminCheckOut(checkIn.checkInId, name.trim());
      console.log('Checking out:', {
        checkInId: checkIn.checkInId,
        childName: checkIn.childName,
        pickedUpBy: name.trim(),
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Success!
      toast.success(`${checkIn.childName} checked out successfully`);
      onSuccess();
      handleOpenChange(false);
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!checkIn) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check Out Child</DialogTitle>
          <DialogDescription>Confirm who is picking up this child.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Child Info */}
            <div className="rounded-lg bg-slate-50 p-4 border">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-900">
                  {checkIn.childName || 'Unknown Child'}
                </p>
                <p className="text-sm text-slate-600">{checkIn.familyName || 'Unknown'} Family</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {checkIn.room}
                  </span>
                  <span className="text-xs text-slate-500">
                    Checked in at{' '}
                    {new Date(checkIn.checkInTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">Picked Up By *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Sarah Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <p className="text-sm text-slate-500">
                Enter the name of the person picking up this child
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Check Out
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
