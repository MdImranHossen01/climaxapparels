'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  ArrowLeft 
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const faqSchema = z.object({
  question: z.string().min(5, 'Question is too short'),
  answer: z.string().min(10, 'Answer is too short'),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

type FAQFormValues = z.infer<typeof faqSchema>;

interface FAQFormProps {
  initialData?: any;
}

export function FAQForm({ initialData }: FAQFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FAQFormValues>({
    resolver: zodResolver(faqSchema) as any,
    defaultValues: {
      question: initialData?.question || '',
      answer: initialData?.answer || '',
      order: initialData?.order || 0,
      isActive: initialData?.isActive ?? true,
    },
  });

  const onSubmit = async (values: FAQFormValues) => {
    setLoading(true);
    try {
      let url = '/api/admin/faqs';
      let method = 'POST';

      if (initialData) {
        if (!initialData._id) {
          toast.error('Invalid FAQ ID. Cannot update.');
          setLoading(false);
          return;
        }
        url = `/api/admin/faqs/${initialData._id}`;
        method = 'PATCH';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success(`FAQ ${initialData ? 'updated' : 'created'} successfully`);
        router.push('/admin/cms/faqs');
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error('Failed to save FAQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {initialData ? 'Edit' : 'Add'} FAQ
            </h1>
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save FAQ
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter answer" 
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Lower numbers appear first.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}

