'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { bdLocations, bdDivisions, divisions } from '@/lib/bd-locations';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email(),
  phone: z.string().optional(),
  image: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    division: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      image: '',
      address: {
        street: '',
        division: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Bangladesh',
      }
    },
  });

  const selectedDivision = form.watch('address.division');
  const availableDistricts = selectedDivision && bdDivisions[selectedDivision] 
                            ? bdDivisions[selectedDivision] 
                            : [];

  const selectedDistrict = form.watch('address.city');
  const availableThanas = selectedDistrict && bdLocations[selectedDistrict] 
                            ? bdLocations[selectedDistrict] 
                            : (bdLocations['Others'] || []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile', { signal: controller.signal });
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await res.json();
        
        if (isMounted) {
          form.reset({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            image: data.image || '',
            address: {
              street: data.addresses?.[0]?.street || '',
              division: data.addresses?.[0]?.division || '',
              city: data.addresses?.[0]?.city || '',
              state: data.addresses?.[0]?.state || '',
              zipCode: data.addresses?.[0]?.zipCode || '',
              country: data.addresses?.[0]?.country || 'Bangladesh',
            }
          });
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Fetch profile error:', error);
          toast.error('Failed to load profile data');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchProfile();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [form.reset]);

  async function onSubmit(values: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to update profile');
      } else {
        toast.success('Profile updated successfully!');
        // Trigger session update to refresh the name/image in the navbar
        await update({ name: values.name, image: values.image });
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl w-full">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Update your public profile and default shipping address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Basic Info</h3>
              <div className="flex flex-col md:flex-row gap-6">
                 <div className="w-full md:w-1/3">
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture</FormLabel>
                          <FormControl>
                            <ImageUpload 
                                value={field.value || ''} 
                                onUpload={(url) => field.onChange(url)} 
                                aspect="square"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
                 <div className="w-full md:w-2/3 space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} disabled={true} />
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
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+8801XXXXXXXXX" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-medium border-b pb-2">Default Shipping Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="address.street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St, Apt 4B" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                  <FormField
                    control={form.control}
                    name="address.division"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Division</FormLabel>
                        <Select
                          disabled={isSubmitting}
                          onValueChange={(val) => {
                             field.onChange(val);
                             // Reset District and Thana when Division changes
                             form.setValue('address.city', '');
                             form.setValue('address.state', '');
                          }}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a Division" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {divisions.map((division) => (
                              <SelectItem key={division} value={division}>
                                {division}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District</FormLabel>
                        <Select
                          disabled={isSubmitting || !selectedDivision}
                          onValueChange={(val) => {
                             field.onChange(val);
                             // Reset Thana when District changes
                             form.setValue('address.state', '');
                          }}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a District" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableDistricts.map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thana / Upazila</FormLabel>
                        <Select
                          disabled={isSubmitting || !selectedDistrict}
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a Thana" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableThanas.map((thana) => (
                              <SelectItem key={thana} value={thana}>
                                {thana}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Post Office / ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="1200" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Bangladesh" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

