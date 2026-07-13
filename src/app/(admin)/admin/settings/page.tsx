'use client';

import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Truck, CreditCard, Globe, X, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordChangeForm } from '@/components/user/PasswordChangeForm';


const FONT_OPTIONS = [
  { id: 'inter', label: 'Inter (Modern Sans)' },
  { id: 'poppins', label: 'Poppins (Round Sans)' },
  { id: 'roboto', label: 'Roboto (Clean Sans)' },
  { id: 'montserrat', label: 'Montserrat (Elegant Sans)' },
  { id: 'playfair', label: 'Playfair Display (Serif)' },
  { id: 'lora', label: 'Lora (Classic Serif)' },
  { id: 'outfit', label: 'Outfit (Contemporary Sans)' },
  { id: 'urbanist', label: 'Urbanist (Geometric Sans)' },
  { id: 'manrope', label: 'Manrope (Modern Humanist)' },
  { id: 'open-sans', label: 'Open Sans (Neutral Sans)' },
  { id: 'lato', label: 'Lato (Friendly Sans)' },
  { id: 'oswald', label: 'Oswald (Strong/Logo)' },
  { id: 'raleway', label: 'Raleway (Elegant Sans)' },
  { id: 'nunito', label: 'Nunito (Soft Round)' },
  { id: 'ubuntu', label: 'Ubuntu (Technical Sans)' },
  { id: 'merriweather', label: 'Merriweather (Bold Serif)' },
  { id: 'kanit', label: 'Kanit (Modern Thai/Bold)' },
  { id: 'quicksand', label: 'Quicksand (Playful Round)' },
  { id: 'josefin-sans', label: 'Josefin Sans (Geometric/Logo)' },
  { id: 'syne', label: 'Syne (Artistic/Trendy)' },
  { id: 'space-grotesk', label: 'Space Grotesk (Futuristic/Tech)' },
  { id: 'orbitron', label: 'Orbitron (Futuristic)' },
  { id: 'jost', label: 'Jost (Sporty/Clean)' },
  { id: 'geist', label: 'Geist (Next.js Default)' },
];

const settingsSchema = z.object({
  brandName: z.string().min(2, 'Brand Name is required'),
  contact: z.object({
    email: z.string().email('Invalid email'),
    phone: z.string().min(10, 'Invalid phone number'),
    address: z.string().min(5, 'Address is required'),
  }),
  socialLinks: z.object({
    facebook: z.string().nullish().transform(v => v ?? ''),
    twitter: z.string().nullish().transform(v => v ?? ''),
    instagram: z.string().nullish().transform(v => v ?? ''),
    youtube: z.string().nullish().transform(v => v ?? ''),
    linkedin: z.string().nullish().transform(v => v ?? ''),
    tiktok: z.string().nullish().transform(v => v ?? ''),
    whatsapp: z.string().nullish().transform(v => v ?? ''),
  }),
  marqueeText: z.string().nullish().transform(val => val ?? ''),
  metaTitle: z.string().nullish().transform(val => val ?? ''),
  metaDescription: z.string().nullish().transform(val => val ?? ''),
  subscriptionConfig: z.object({
    activationThreshold: z.number().min(0, 'Threshold cannot be negative'),
    rewardPercentage: z.number().min(0, 'Percentage cannot be negative').max(100, 'Cannot exceed 100%'),
  }).optional(),
  freeDeliveryThreshold: z.number().min(0, 'Threshold cannot be negative').optional(),
  deliveryChargeInsideDhaka: z.number().min(0, 'Charge cannot be negative').optional(),
  deliveryChargeOutsideDhaka: z.number().min(0, 'Charge cannot be negative').optional(),
  logoUrl: z.string().nullish().transform(val => val ?? ''),
  uiTemplates: z.object({
    theme: z.string().default('green'),
    logoFont: z.string().default('orbitron'),
    bodyFont: z.string().default('inter'),
    layout: z.string().default('v1'),
  }).optional(),
  paymentConfig: z.object({
    activeMethod: z.string().default('none'),
    sslcommerz: z.object({
      storeId: z.string().nullish().transform(val => val ?? ''),
      storePassword: z.string().nullish().transform(val => val ?? ''),
      isSandbox: z.boolean().default(true),
    }).nullable().optional(),
  }).optional(),
  manualPaymentConfig: z.object({
    bkash: z.object({
      number: z.string().default(''),
      qrCode: z.string().nullish().transform(val => val ?? ''),
      active: z.boolean().default(false),
    }).nullable().optional(),
    nagad: z.object({
      number: z.string().default(''),
      qrCode: z.string().nullish().transform(val => val ?? ''),
      active: z.boolean().default(false),
    }).nullable().optional(),
    rocket: z.object({
      number: z.string().default(''),
      qrCode: z.string().nullish().transform(val => val ?? ''),
      active: z.boolean().default(false),
    }).nullable().optional(),
    banglaQr: z.object({
      qrCode: z.string().nullish().transform(val => val ?? ''),
      active: z.boolean().default(false),
    }).nullable().optional(),
    instructions: z.string().nullish().transform(val => val ?? ''),
  }).optional(),
  courierConfig: z.object({
    activeProvider: z.string().default('none'),
    steadfast: z.object({
      apiKey: z.string().nullish().transform(val => val ?? ''),
      secretKey: z.string().nullish().transform(val => val ?? ''),
    }).nullable().optional(),
    pathao: z.object({
      clientId: z.string().nullish().transform(val => val ?? ''),
      clientSecret: z.string().nullish().transform(val => val ?? ''),
      storeId: z.string().nullish().transform(val => val ?? ''),
    }).nullable().optional(),
    redx: z.object({
      apiKey: z.string().nullish().transform(val => val ?? ''),
    }).nullable().optional(),
  }).optional(),
  facebookDomainVerification: z.string().nullish().transform(val => val ?? ''),
  metaPixelId: z.string().nullish().transform(val => val ?? ''),
  facebookAccessToken: z.string().nullish().transform(val => val ?? ''),
  facebookTestEventCode: z.string().nullish().transform(val => val ?? ''),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      brandName: '',
      contact: { email: '', phone: '', address: '' },
      socialLinks: {
        facebook: '',
        twitter: '',
        instagram: '',
        youtube: '',
        linkedin: '',
        tiktok: '',
        whatsapp: ''
      },
      marqueeText: '',
      metaTitle: '',
      metaDescription: '',
      subscriptionConfig: {
        activationThreshold: 5000,
        rewardPercentage: 5,
      },
      freeDeliveryThreshold: 0,
      deliveryChargeInsideDhaka: 60,
      deliveryChargeOutsideDhaka: 120,
      logoUrl: '',
      uiTemplates: {
        theme: 'green',
        logoFont: 'orbitron',
        bodyFont: 'inter',
        layout: 'v1',
      },
      paymentConfig: {
        activeMethod: 'none',
        sslcommerz: {
          storeId: '',
          storePassword: '',
          isSandbox: true,
        },
      },
      manualPaymentConfig: {
        bkash: { number: '', qrCode: '', active: false },
        nagad: { number: '', qrCode: '', active: false },
        rocket: { number: '', qrCode: '', active: false },
        banglaQr: { qrCode: '', active: false },
        instructions: '',
      },
      courierConfig: {
        activeProvider: 'none',
        steadfast: { apiKey: '', secretKey: '' },
        pathao: { clientId: '', clientSecret: '', storeId: '' },
        redx: { apiKey: '' },
      },
      facebookDomainVerification: '',
      metaPixelId: '',
      facebookAccessToken: '',
      facebookTestEventCode: '',
    },
  });

  useEffect(() => {
    const controller = new AbortController();

    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings', { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();

          const result = settingsSchema.safeParse(data);
          if (result.success) {
            if (!controller.signal.aborted) {
              const sanitizedData: SettingsFormValues = {
                brandName: result.data.brandName || '',
                contact: {
                  email: result.data.contact?.email || '',
                  phone: result.data.contact?.phone || '',
                  address: result.data.contact?.address || '',
                },
                marqueeText: result.data.marqueeText || '',
                socialLinks: {
                  facebook: result.data.socialLinks?.facebook || '',
                  twitter: result.data.socialLinks?.twitter || '',
                  instagram: result.data.socialLinks?.instagram || '',
                  youtube: result.data.socialLinks?.youtube || '',
                  linkedin: result.data.socialLinks?.linkedin || '',
                  tiktok: result.data.socialLinks?.tiktok || '',
                  whatsapp: result.data.socialLinks?.whatsapp || '',
                },
                metaTitle: result.data.metaTitle || '',
                metaDescription: result.data.metaDescription || '',
                freeDeliveryThreshold: result.data.freeDeliveryThreshold ?? 0,
                deliveryChargeInsideDhaka: result.data.deliveryChargeInsideDhaka ?? 60,
                deliveryChargeOutsideDhaka: result.data.deliveryChargeOutsideDhaka ?? 120,
                subscriptionConfig: {
                  activationThreshold: result.data.subscriptionConfig?.activationThreshold ?? 5000,
                  rewardPercentage: result.data.subscriptionConfig?.rewardPercentage ?? 5,
                },
                logoUrl: result.data.logoUrl || '',
                uiTemplates: {
                  theme: result.data.uiTemplates?.theme || 'green',
                  logoFont: result.data.uiTemplates?.logoFont || 'orbitron',
                  bodyFont: result.data.uiTemplates?.bodyFont || 'inter',
                  layout: result.data.uiTemplates?.layout || 'v1',
                },
                paymentConfig: {
                  activeMethod: result.data.paymentConfig?.activeMethod || 'none',
                  sslcommerz: {
                    storeId: result.data.paymentConfig?.sslcommerz?.storeId || '',
                    storePassword: result.data.paymentConfig?.sslcommerz?.storePassword || '',
                    isSandbox: result.data.paymentConfig?.sslcommerz?.isSandbox ?? true,
                  },
                },
                manualPaymentConfig: {
                  bkash: {
                    number: result.data.manualPaymentConfig?.bkash?.number || '',
                    qrCode: result.data.manualPaymentConfig?.bkash?.qrCode || '',
                    active: result.data.manualPaymentConfig?.bkash?.active ?? false,
                  },
                  nagad: {
                    number: result.data.manualPaymentConfig?.nagad?.number || '',
                    qrCode: result.data.manualPaymentConfig?.nagad?.qrCode || '',
                    active: result.data.manualPaymentConfig?.nagad?.active ?? false,
                  },
                  rocket: {
                    number: result.data.manualPaymentConfig?.rocket?.number || '',
                    qrCode: result.data.manualPaymentConfig?.rocket?.qrCode || '',
                    active: result.data.manualPaymentConfig?.rocket?.active ?? false,
                  },
                  banglaQr: {
                    qrCode: result.data.manualPaymentConfig?.banglaQr?.qrCode || '',
                    active: result.data.manualPaymentConfig?.banglaQr?.active ?? false,
                  },
                  instructions: result.data.manualPaymentConfig?.instructions || '',
                },
                courierConfig: {
                  activeProvider: result.data.courierConfig?.activeProvider || 'none',
                  steadfast: {
                    apiKey: result.data.courierConfig?.steadfast?.apiKey || '',
                    secretKey: result.data.courierConfig?.steadfast?.secretKey || '',
                  },
                  pathao: {
                    clientId: result.data.courierConfig?.pathao?.clientId || '',
                    clientSecret: result.data.courierConfig?.pathao?.clientSecret || '',
                    storeId: result.data.courierConfig?.pathao?.storeId || '',
                  },
                  redx: {
                    apiKey: result.data.courierConfig?.redx?.apiKey || '',
                  },
                },
                facebookDomainVerification: result.data.facebookDomainVerification || '',
                metaPixelId: result.data.metaPixelId || '',
                facebookAccessToken: result.data.facebookAccessToken || '',
                facebookTestEventCode: result.data.facebookTestEventCode || '',
              };
              form.reset(sanitizedData);
            }
          } else {
            console.error('Settings validation failed:', result.error);
            console.log('Raw settings data received:', data);
            toast.error('Received invalid settings from server');
          }
        } else {
          if (!controller.signal.aborted) {
            toast.error(`Failed to load settings: ${res.status} ${res.statusText}`);
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          toast.error('Failed to load settings');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchSettings();
    return () => controller.abort();
  }, [form]);

  const onSubmit = async (values: SettingsFormValues) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success('Settings updated successfully');
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      toast.error('Error updating settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Global Settings</h1>
        <Button type="submit" form="settings-form" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form id="settings-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-4">
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>Manage your store's identity and visibility.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="brandName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">Brand Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Climax Apparels" {...field} className="h-12 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-primary transition-all" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">Store Logo</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onUpload={(url) => field.onChange(url)}
                            className="bg-white border-2 border-gray-100"
                            aspect="square"
                          />
                        </FormControl>
                        <FormDescription>Professional high-resolution logo (PNG, JPG, or WEBP)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('uiTemplates.layout') !== 'v2' && (
                    <FormField
                      control={form.control}
                      name="marqueeText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marquee/Ticker Text</FormLabel>
                          <FormControl>
                            <Input placeholder="Announcements, offers, promotions..." {...field} />
                          </FormControl>
                          <FormDescription>This text will display as a scrolling marquee at the top of the site.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="metaTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Global Meta Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Climax Apparels | Best Ecommerce in BD" {...field} />
                          </FormControl>
                          <FormDescription>Used as the primary browser title for the home page.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="metaDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Global Meta Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Shop the best products at Climax Apparels..." {...field} />
                          </FormControl>
                          <FormDescription>Used for search engine snippets and social sharing.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Update how customers can reach you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contact.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input placeholder="support@shop.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+880 1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Building name, Street, City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Links</CardTitle>
                  <CardDescription>Add links to your social media profiles.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="socialLinks.facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://facebook.com/your-page" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="socialLinks.twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>X (Twitter) URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://twitter.com/your-handle" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="socialLinks.instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://instagram.com/your-handle" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="socialLinks.youtube"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>YouTube URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://youtube.com/@your-channel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="socialLinks.linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/in/your-profile" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="socialLinks.tiktok"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TikTok URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://tiktok.com/@your-handle" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="socialLinks.whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://wa.me/your-number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card className="border-2 border-primary/10 shadow-none overflow-hidden rounded-3xl">
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle>Brand Aesthetics</CardTitle>
                  <CardDescription>Choose a theme that matches your brand identity.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <FormField
                    control={form.control}
                    name="uiTemplates.theme"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-base font-bold">Storefront Theme Preset</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl bg-background border-2 border-muted hover:border-primary/50 transition-all text-lg font-medium">
                              <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl p-2 max-h-[400px]">
                            {[
                              { id: 'default', label: 'Default (System)', color: 'bg-slate-500' },
                              { id: 'black', label: 'Black and White Theme', color: 'bg-black' },
                              { id: 'caffeine', label: 'Caffeine Theme', color: 'bg-[#6F4E37]' },
                              { id: 'claude', label: 'Claude Theme', color: 'bg-[#D97757]' },
                              { id: 'elegant', label: 'Elegant Luxury Theme', color: 'bg-[#D4AF37]' },
                              { id: 'marvel', label: 'Marvel Theme', color: 'bg-[#ED1D24]' },
                              { id: 'material', label: 'Material Design Theme', color: 'bg-[#6200EE]' },
                              { id: 'midnight', label: 'Midnight Bloom Theme', color: 'bg-[#2D1B69]' },
                              { id: 'nature', label: 'Nature Theme', color: 'bg-[#2E7D32]' },
                              { id: 'perplexity', label: 'Perplexity Theme', color: 'bg-[#202124]' },
                              { id: 'slack', label: 'Slack Theme', color: 'bg-[#4A154B]' },
                              { id: 'summer', label: 'Summer Theme', color: 'bg-[#FFD700]' },
                              { id: 'sunset', label: 'Sunset Theme', color: 'bg-[#FD5E53]' },
                              { id: 'valorant', label: 'Valorant Theme', color: 'bg-[#FF4655]' },
                              { id: 'supabase', label: 'Supabase Theme', color: 'bg-[#3ECF8E]' },
                              { id: 'amber', label: 'Amber Minimal Theme', color: 'bg-[#FFBF00]' },
                              { id: 'catppuccin', label: 'Catppuccin Theme', color: 'bg-[#CBA6F7]' },
                              { id: 'clay', label: 'Claymorphism Theme', color: 'bg-[#91A6FF]' },
                              { id: 'cyberpunk', label: 'Cyberpunk Theme', color: 'bg-[#FF00FF]' },
                              { id: 'darkmatter', label: 'Dark Matter Theme', color: 'bg-[#000000]' },
                              { id: 'ocean', label: 'Ocean Breeze Theme', color: 'bg-[#0077BE]' },
                              { id: 'quantum', label: 'Quantum Rose Theme', color: 'bg-[#FF1493]' },
                              { id: 't3', label: 'T3 Chat Theme', color: 'bg-[#E02424]' },
                              { id: 'tangerine', label: 'Tangerine Theme', color: 'bg-[#F28500]' },
                              { id: 'vintage', label: 'Vintage Paper Theme', color: 'bg-[#F5F5DC]' },
                              { id: 'green', label: 'Green Theme', color: 'bg-green-500' },
                              { id: 'red', label: 'Red Theme', color: 'bg-red-500' },
                              { id: 'rose', label: 'Rose Theme', color: 'bg-rose-500' },
                              { id: 'orange', label: 'Orange Theme', color: 'bg-orange-500' },
                              { id: 'blue', label: 'Blue Theme', color: 'bg-blue-500' },
                              { id: 'yellow', label: 'Yellow Theme', color: 'bg-yellow-500' },
                              { id: 'violet', label: 'Violet Theme', color: 'bg-violet-500' }
                            ].map((t) => (
                              <SelectItem key={t.id} value={t.id} className="rounded-xl h-12">
                                <div className="flex items-center gap-3">
                                  <div className={`h-4 w-4 rounded-full ${t.color} border border-black/10`} />
                                  <span className="font-medium">{t.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-sm">
                          Switching themes will instantly update your storefront colors, fonts, and overall vibe.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Logo Font Selection */}
                  <FormField
                    control={form.control}
                    name="uiTemplates.logoFont"
                    render={({ field }) => (
                      <FormItem className="space-y-4 mt-6">
                        <FormLabel className="text-base font-bold">Logo Typography</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl bg-background border-2 border-muted hover:border-primary/50 transition-all text-lg font-medium">
                              <SelectValue placeholder="Select a font for logo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl p-2 max-h-[300px]">
                            {FONT_OPTIONS.map((f) => (
                              <SelectItem key={f.id} value={f.id} className="rounded-xl h-12">
                                <span className="font-medium">{f.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-sm">
                          Select the font style for your Brand Name in the logo.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Body Font Selection */}
                  <FormField
                    control={form.control}
                    name="uiTemplates.bodyFont"
                    render={({ field }) => (
                      <FormItem className="space-y-4 mt-6">
                        <FormLabel className="text-base font-bold">Global Body Typography</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl bg-background border-2 border-muted hover:border-primary/50 transition-all text-lg font-medium">
                              <SelectValue placeholder="Select a font for body" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl p-2 max-h-[300px]">
                            {FONT_OPTIONS.map((f) => (
                              <SelectItem key={f.id} value={f.id} className="rounded-xl h-12">
                                <span className="font-medium">{f.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-sm">
                          This font will be applied to all text across your storefront.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-8 p-6 rounded-3xl bg-muted/30 border-2 border-dashed border-muted flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center">
                      <Truck className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold">Live Preview (Coming Soon)</h4>
                      <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">
                        In the next update, you'll be able to see a live preview of the theme before applying it.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Form>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Update your password and manage account security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <PasswordChangeForm hideHeader={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

