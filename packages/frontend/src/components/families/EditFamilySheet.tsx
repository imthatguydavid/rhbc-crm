import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Family } from '@rhbc-crm/shared';

interface EditFamilySheetProps {
  family: Family | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: { lastName: string; status: 'member' | 'guest' }) => Promise<void>;
}

/**
 * Edit Family Drawer
 *
 * Slides in from right to edit family information.
 * Allows editing last name and member status.
 */
export function EditFamilySheet({ family, open, onClose, onSave }: EditFamilySheetProps) {
  const [lastName, setLastName] = useState('');
  const [status, setStatus] = useState<'member' | 'guest'>('member');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form when family changes
  useEffect(() => {
    if (family) {
      setLastName(family.lastName);
      setStatus(family.status);
    }
  }, [family]);

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lastName.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      await onSave({ lastName: lastName.trim(), status });
      onClose();
    } catch (error) {
      console.error('Error saving family:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Family</SheetTitle>
          <SheetDescription>Update the family's last name or membership status.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Johnson"
              disabled={isLoading}
              required
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={(value: 'member' | 'guest') => setStatus(value)}>
              <SelectTrigger id="status" disabled={isLoading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !lastName.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
