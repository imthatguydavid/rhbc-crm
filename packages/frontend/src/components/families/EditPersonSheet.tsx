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
import type { Person } from '@rhbc-crm/shared';

interface EditPersonSheetProps {
  person: Person | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: { firstName: string; phone?: string; email?: string }) => Promise<void>;
}

/**
 * Edit Person Drawer
 *
 * Slides in from right to edit person information.
 * Allows editing first name, phone, and email.
 */
export function EditPersonSheet({ person, open, onClose, onSave }: EditPersonSheetProps) {
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form when person changes
  useEffect(() => {
    if (person) {
      setFirstName(person.firstName);
      setPhone(person.phone || '');
      setEmail(person.email || '');
    }
  }, [person]);

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
      await onSave({
        firstName: firstName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving person:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!person) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit {person.role === 'parent' ? 'Parent' : 'Child'}</SheetTitle>
          <SheetDescription>Update {person.firstName}'s information.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              disabled={isLoading}
              required
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
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              disabled={isLoading}
            />
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !firstName.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
