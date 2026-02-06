import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Person } from '@rhbc-crm/shared';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Phone must be 10 digits')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface EditPersonDialogProps {
  person: Person | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: { firstName: string; phone?: string; email?: string }) => Promise<void>;
}

export function EditPersonDialog({ person, open, onClose, onSave }: EditPersonDialogProps) {
  const [shouldClearPhone, setShouldClearPhone] = useState(false);
  const [shouldClearEmail, setShouldClearEmail] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      phone: '',
      email: '',
    },
  });

  // Update form when person changes
  useEffect(() => {
    if (person) {
      form.reset({
        firstName: person.firstName,
        phone: person.phone || '',
        email: person.email || '',
      });
      setShouldClearPhone(false);
      setShouldClearEmail(false);
    }
  }, [person, form]);

  const onSubmit = async (values: FormValues) => {
    const updates: any = { firstName: values.firstName };

    // Only include phone/email if they have a value OR we explicitly want to clear them
    if (shouldClearPhone) {
      updates.phone = '';
    } else if (values.phone) {
      updates.phone = values.phone;
    }

    if (shouldClearEmail) {
      updates.email = '';
    } else if (values.email) {
      updates.email = values.email;
    }

    await onSave(updates);
    onClose();
  };

  if (!person) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {person.role === 'parent' ? 'Parent' : 'Child'}</DialogTitle>
          <DialogDescription>Update person information</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="7145551234"
                        disabled={shouldClearPhone}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '');
                          field.onChange(cleaned);
                          setShouldClearPhone(false);
                        }}
                      />
                    </FormControl>
                    {person.phone && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setShouldClearPhone(!shouldClearPhone);
                          if (!shouldClearPhone) {
                            form.setValue('phone', '');
                          } else {
                            form.setValue('phone', person.phone || '');
                          }
                        }}
                        className={shouldClearPhone ? 'bg-red-50 text-red-600' : ''}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {shouldClearPhone && (
                    <p className="text-xs text-red-600">Phone will be removed when you save</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                        disabled={shouldClearEmail}
                        onChange={(e) => {
                          field.onChange(e);
                          setShouldClearEmail(false);
                        }}
                      />
                    </FormControl>
                    {person.email && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setShouldClearEmail(!shouldClearEmail);
                          if (!shouldClearEmail) {
                            form.setValue('email', '');
                          } else {
                            form.setValue('email', person.email || '');
                          }
                        }}
                        className={shouldClearEmail ? 'bg-red-50 text-red-600' : ''}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {shouldClearEmail && (
                    <p className="text-xs text-red-600">Email will be removed when you save</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
