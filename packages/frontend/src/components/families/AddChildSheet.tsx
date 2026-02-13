import { useState } from 'react';
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

interface AddChildSheetProps {
  familyName: string;
  open: boolean;
  onClose: () => void;
  onAdd: (childData: { firstName: string; phone?: string; email?: string }) => Promise<void>;
}

/**
 * Add Child Drawer
 *
 * Slides in from right to add a new child to the family.
 */
export function AddChildSheet({ familyName, open, onClose, onAdd }: AddChildSheetProps) {
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Resets form fields
   */
  const resetForm = () => {
    setFirstName('');
    setPhone('');
    setEmail('');
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      await onAdd({
        firstName: firstName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding child:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles closing the drawer
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Child</SheetTitle>
          <SheetDescription>Add a new child to the {familyName} family.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Emma"
              disabled={isLoading}
              required
              autoFocus
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              disabled={isLoading}
            />
            <p className="text-sm text-slate-500">Optional</p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="emma@example.com"
              disabled={isLoading}
            />
            <p className="text-sm text-slate-500">Optional</p>
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !firstName.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Child
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
