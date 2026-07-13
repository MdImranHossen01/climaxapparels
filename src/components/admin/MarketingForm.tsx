'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const marketingSchema = z.object({
  googleTagManagerId: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
  googleAnalyticsPropertyId: z.string().optional(),
  googleSearchConsoleId: z.string().optional(),
  searchConsoleMeta: z.string().optional(),
  metaPixelId: z.string().optional(),
  facebookAccessToken: z.string().optional(),
  facebookDomainVerification: z.string().optional(),
  facebookTestEventCode: z.string().optional(),
  tiktokPixelId: z.string().optional(),
  tiktokAccessToken: z.string().optional(),
});

type MarketingFormValues = z.infer<typeof marketingSchema>;

import { useSession } from 'next-auth/react';

export function MarketingForm() {
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as any)?.role === 'super_admin';
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MarketingFormValues>({
    resolver: zodResolver(marketingSchema),
    defaultValues: {
      googleTagManagerId: '',
      googleAnalyticsId: '',
      googleAnalyticsPropertyId: '',
      googleSearchConsoleId: '',
      searchConsoleMeta: '',
      metaPixelId: '',
      facebookAccessToken: '',
      facebookDomainVerification: '',
      facebookTestEventCode: '',
      tiktokPixelId: '',
      tiktokAccessToken: '',
    },
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings', { 
          cache: 'no-store',
          signal: controller.signal 
        });
        if (!res.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data = await res.json();
        
        if (isMounted) {
          form.reset({
            googleTagManagerId: data.googleTagManagerId || '',
            googleAnalyticsId: data.googleAnalyticsId || '',
            googleAnalyticsPropertyId: data.googleAnalyticsPropertyId || '',
            googleSearchConsoleId: data.googleSearchConsoleId || '',
            searchConsoleMeta: data.searchConsoleMeta || '',
            metaPixelId: data.metaPixelId || '',
            facebookAccessToken: data.facebookAccessToken || '',
            facebookDomainVerification: data.facebookDomainVerification || '',
            facebookTestEventCode: data.facebookTestEventCode || '',
            tiktokPixelId: data.tiktokPixelId || '',
            tiktokAccessToken: data.tiktokAccessToken || '',
          });
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Fetch marketing settings error:', error);
          toast.error('Failed to load marketing settings');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchSettings();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [form.reset]);

  async function onSubmit(values: MarketingFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to update marketing settings');
      } else {
        toast.success('Marketing settings updated successfully!');
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
    <Card className="max-w-4xl w-full">
      <CardHeader>
        <CardTitle>Marketing Tools & Tracking</CardTitle>
        <CardDescription>
          {isSuperAdmin 
            ? "Configure IDs for your tracking scripts and search visibility here."
            : "Access to tracking configuration is restricted to Super Admins only."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isSuperAdmin ? (
          <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              You do not have permission to view or edit marketing tracking settings. 
              Please contact the system administrator if you believe this is an error.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="googleTagManagerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Tag Manager ID</FormLabel>
                      <FormControl>
                        <Input placeholder="GTM-XXXXXXX" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>
                        Container ID for GA, Ads, and other tags.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="googleAnalyticsId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GA4 Measurement ID (Tracking)</FormLabel>
                      <FormControl>
                        <Input placeholder="G-XXXXXXXXXX" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>
                        Required for tracking visitors (format: G-XXXXXXXXXX).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="googleAnalyticsPropertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GA4 Property ID (Analytics)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 537309127" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>
                        Required for live traffic widget (format: sudhu sonkhya).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="googleSearchConsoleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search Console ID / URL</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. https://www.example.com/" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>
                        Used for backend analytics reports.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="searchConsoleMeta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search Console Meta Tag (for Verification)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. j1X9r..._Xo" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormDescription>
                      Content string from Google meta tag verification.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="metaPixelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta (Facebook) Pixel ID</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789012345" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>
                        15-digit Pixel ID for behavior tracking.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facebookAccessToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook Access Token (CAPI)</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="EAAB..." {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>
                        System user access token for Conversions API.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="facebookDomainVerification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FB Domain Verification</FormLabel>
                      <FormControl>
                        <Input placeholder="8zp1nr7skv87u2..." {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>
                        Unique content code from Meta tag.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facebookTestEventCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FB Test Event Code</FormLabel>
                      <FormControl>
                        <Input placeholder="TEST12345" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>
                        Used for testing CAPI events.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-6 space-y-6">
                <h3 className="text-lg font-medium text-foreground">TikTok Tracking</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="tiktokPixelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TikTok Pixel ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. C1234567890" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormDescription>
                          TikTok Pixel ID for browser tracking.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tiktokAccessToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TikTok Access Token (Events API)</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="tt_..." {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormDescription>
                          TikTok developer access token for server-side Events API tracking.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Tracking Configuration
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
