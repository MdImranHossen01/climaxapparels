'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').toUpperCase(),
  discountType: z.enum(['fixed', 'percentage']),
  discountValue: z.number().min(1, 'Value must be at least 1'),
  minPurchase: z.number().min(0).optional().default(0),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  usageLimit: z.number().optional(),
  isActive: z.boolean().optional().default(true),
});

type CouponFormValues = z.infer<typeof couponSchema>;

interface CouponFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function CouponForm({ initialData, onSuccess }: CouponFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: initialData ? {
      ...initialData,
      expiryDate: (initialData.expiryDate && !isNaN(new Date(initialData.expiryDate).getTime())) 
        ? new Date(initialData.expiryDate).toISOString().split('T')[0] 
        : '',
      usageLimit: initialData.usageLimit ?? undefined,
    } : {
      code: '',
      discountType: 'percentage',
      discountValue: 1,
      minPurchase: 0,
      expiryDate: '',
      usageLimit: undefined,
      isActive: true,
    },
  });

  const onSubmit = async (values: CouponFormValues) => {
    setLoading(true);
    try {
      const url = initialData 
        ? `/api/admin/coupons/${initialData._id}` 
        : '/api/admin/coupons';
      
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success(initialData ? 'Coupon updated' : 'Coupon created');
        onSuccess();
      } else {
        let errorMessage = 'Something went wrong';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          try {
            const textError = await response.text();
            if (textError) errorMessage = textError.slice(0, 100); // Limit length
          } catch (e2) {
            // Fallback to default
          }
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coupon Code</FormLabel>
              <FormControl>
                <Input placeholder="SAVE20" {...field} />
              </FormControl>
              <FormDescription>Unique code for the coupon.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="discountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (TK)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discountValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minPurchase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Purchase (TK)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="usageLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usage Limit (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Unlimited" 
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                />
              </FormControl>
              <FormDescription>Total number of times this coupon can be used.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <FormDescription>Disable this to temporarily pause the coupon.</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Coupon' : 'Create Coupon'}
        </Button>
      </form>
    </Form>
  );
}

