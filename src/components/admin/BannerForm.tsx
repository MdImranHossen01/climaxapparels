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
import {
  Loader2,
  ArrowLeft,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const urlSchema = z.string().optional().refine((val) => {
  if (!val) return true;
  return val.startsWith('http://') || val.startsWith('https://');
}, {
  message: "Must be a full URL starting with http:// or https://"
});

const bannerSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  image: z.string().min(1, 'Image is required'),
  primaryBtnText: z.string().optional(),
  primaryBtnLink: urlSchema,
  secondaryBtnText: z.string().optional(),
  secondaryBtnLink: urlSchema,
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

interface BannerFormProps {
  initialData?: any;
}

export function BannerForm({ initialData }: BannerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema) as any,
    defaultValues: {
      title: initialData?.title || '',
      image: initialData?.image || '',
      primaryBtnText: initialData?.primaryBtnText || 'Shop Now',
      primaryBtnLink: initialData?.primaryBtnLink || '',
      secondaryBtnText: initialData?.secondaryBtnText || 'Contact',
      secondaryBtnLink: initialData?.secondaryBtnLink || '',
      order: initialData?.order || 0,
      isActive: initialData?.isActive ?? true,
    },
  });

  const onSubmit = async (values: BannerFormValues) => {
    setLoading(true);
    try {
      const url = initialData ? `/api/admin/banners/${initialData._id}` : '/api/admin/banners';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success(`Banner ${initialData ? 'updated' : 'created'} successfully`);
        router.push('/admin/cms/banners');
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Failed to save banner');
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
              {initialData ? 'Edit' : 'Add'} Banner
            </h1>
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Banner
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banner Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter banner title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="primaryBtnText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Button Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Shop Now" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="primaryBtnLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Button Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/shop" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="secondaryBtnText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Button Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Learn More" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="secondaryBtnLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Button Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://wa.me/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Label>Banner Image</Label>
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onUpload={(url) => field.onChange(url)}
                            className="aspect-[21/9] w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-[0.8rem] text-muted-foreground italic">Recommended aspect ratio: 21:9 or 1920x800px for best display across all devices.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}

