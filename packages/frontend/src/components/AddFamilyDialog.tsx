import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Family } from '@rhbc-crm/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Form validation schema
const formSchema = z.object({
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  status: z.enum(['member', 'guest']),
  parentFirstName: z.string().min(1, 'Parent first name is required'),
  parentPhone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  parentEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface AddFamilyDialogProps {
  open: boolean;
  onClose: () => void;
  onAddFamily: (family: Family, parentData: { firstName: string; phone: string; email?: string }) => void;
}

export function AddFamilyDialog({ open, onClose, onAddFamily }: AddFamilyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lastName: '',
      status: 'guest',
      parentFirstName: '',
      parentPhone: '',
      parentEmail: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);

    // Generate IDs
    const familyId = `fam-${Date.now()}`;
    const now = new Date().toISOString();

    // Create family
    const newFamily: Family = {
      familyId,
      lastName: values.lastName,
      status: values.status,
      createdAt: now,
      updatedAt: now,
    };

    // Parent data to be added separately
    const parentData = {
      firstName: values.parentFirstName,
      phone: values.parentPhone,
      email: values.parentEmail || undefined,
    };

    // Call parent component's handler
    onAddFamily(newFamily, parentData);

    // Reset form and close
    form.reset();
    setIsSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Family</DialogTitle>
          <DialogDescription>
            Enter the family information and primary contact details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Last Name */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="guest">Guest</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-4">Primary Contact</h4>

              {/* Parent First Name */}
              <FormField
                control={form.control}
                name="parentFirstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Parent Phone */}
              <FormField
                control={form.control}
                name="parentPhone"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="7145551234"
                        {...field}
                        onChange={(e) => {
                          // Remove non-digits
                          const cleaned = e.target.value.replace(/\D/g, '');
                          field.onChange(cleaned);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Parent Email */}
              <FormField
                control={form.control}
                name="parentEmail"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Email (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.smith@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Family'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}