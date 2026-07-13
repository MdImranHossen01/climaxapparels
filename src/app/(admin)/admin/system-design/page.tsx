'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Layout, 
  Palette, 
  Monitor, 
  Save, 
  ShieldCheck,
  ChevronRight,
  Eye,
  Globe,
  CreditCard,
  BarChart3,
  Truck,
  Settings2,
  Code,
  X,
  Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from '@/components/ui/image-upload';

const TEMPLATE_OPTIONS = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'];
const THEME_OPTIONS = ['default', 'emerald', 'black', 'caffeine', 'claude', 'elegant', 'marvel', 'material', 'midnight', 'nature', 'perplexity', 'slack', 'summer', 'sunset', 'valorant', 'supabase', 'amber', 'catppuccin', 'clay', 'cyberpunk', 'darkmatter', 'ocean', 'quantum', 't3', 'tangerine', 'vintage', 'green', 'red', 'rose', 'orange', 'blue', 'yellow', 'violet'];

const TEMPLATE_CONFIG = [
  { id: 'layout', label: 'Primary Layout' },
  { id: 'navbar', label: 'Navbar' },
  { id: 'hero', label: 'Hero Section' },
  { id: 'productCard', label: 'Product Card' },
  { id: 'productDetail', label: 'Product Detail' },
  { id: 'categories', label: 'Category View' },
  { id: 'footer', label: 'Footer' },
  { id: 'shopListing', label: 'Shop Page' },
  { id: 'blogListing', label: 'Blog Listing' },
  { id: 'blogDetail', label: 'Blog Detail' },
];

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

export default function SuperConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to load settings: ${res.status}`);
      }
      const data = await res.json();
      setSettings(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!settings) {
      toast.error('No settings data available to save');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success('System Infrastructure Configured Successfully!');
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Update failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = (key: string, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      uiTemplates: {
        ...(settings.uiTemplates || {}),
        [key]: value
      }
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
    </div>
  );

  const ui = settings?.uiTemplates || {};

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] md:text-xs">
            <ShieldCheck className="h-4 w-4" /> System Infrastructure Control
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter">Global Config</h1>
          <p className="text-muted-foreground text-sm">Manage keys, tracking, and design orchestration for the entire platform.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button 
            onClick={handleUpdate} 
            disabled={saving || !settings}
            className="h-11 md:h-12 px-6 md:px-8 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 text-sm"
          >
            {saving ? 'Applying...' : <><Save className="h-5 w-5" /> Save Configuration</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Brand Identity */}
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-5 md:p-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg shrink-0">
                <Settings2 className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl font-bold leading-tight">Brand Identity & Typography</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Font */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Code className="w-4 h-4 text-orange-500" />
                  Logo Typography
                </Label>
                <Select 
                  value={settings?.uiTemplates?.logoFont || 'orbitron'} 
                  onValueChange={(v) => updateTemplate('logoFont', v)}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-orange-500 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl min-w-[300px] max-h-[450px] shadow-2xl border-2 border-orange-500/10">
                    {FONT_OPTIONS.map(f => (
                      <SelectItem key={f.id} value={f.id} className="rounded-xl py-3 focus:bg-orange-50 transition-colors">
                        <span className="font-medium text-sm">{f.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Body Font */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-orange-500" />
                  Body Typography
                </Label>
                <Select 
                  value={settings?.uiTemplates?.bodyFont || 'inter'} 
                  onValueChange={(v) => updateTemplate('bodyFont', v)}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-orange-500 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl min-w-[300px] max-h-[450px] shadow-2xl border-2 border-orange-500/10">
                    {FONT_OPTIONS.map(f => (
                      <SelectItem key={f.id} value={f.id} className="rounded-xl py-3 focus:bg-orange-50 transition-colors">
                        <span className="font-medium text-sm">{f.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SaaS Subscription Control */}
        <Card className="lg:col-span-1 border-2 border-red-500/20 shadow-none overflow-hidden rounded-3xl bg-white/50 backdrop-blur-sm">
          <CardHeader className="bg-red-500/5 border-b">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <CreditCard className="h-5 w-5" /> Subscription Control
              </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sub-expiry" className="font-bold text-xs text-gray-600">Expiry Date & Time</Label>
                <input 
                  id="sub-expiry" 
                  type="datetime-local" 
                  value={(() => {
                    if (!settings?.saasSubscription?.expiryDate) return '';
                    const date = new Date(settings.saasSubscription.expiryDate);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                  })()}
                  onChange={(e) => {
                    const localDate = new Date(e.target.value);
                    setSettings({
                      ...(settings ?? {}), 
                      saasSubscription: {
                        ...(settings?.saasSubscription || {}),
                        expiryDate: localDate.toISOString()
                      }
                    });
                  }} 
                  className="w-full h-12 rounded-xl border-2 bg-white px-4 text-sm focus:border-red-500 outline-none transition-all" 
                />
                <p className="text-[10px] text-muted-foreground italic">Set when the tenant's access will automatically expire.</p>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs text-gray-600">Access Status</Label>
                <Select 
                  value={settings?.saasSubscription?.status || 'Active'} 
                  onValueChange={(v) => setSettings({
                    ...settings, 
                    saasSubscription: {
                      ...(settings?.saasSubscription || {}),
                      status: v
                    }
                  })}
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 bg-white focus:border-red-500 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Active">Active (Live)</SelectItem>
                    <SelectItem value="Expired">Expired (Blocked)</SelectItem>
                    <SelectItem value="Suspended">Suspended (Manual Block)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* 1. System Identification */}
        <Card className="lg:col-span-3 border-2 border-primary/20 shadow-none overflow-hidden rounded-3xl">
            <CardHeader className="bg-primary/5 border-b p-5 md:px-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                 <Globe className="h-5 w-5 text-primary" /> Tracking & SEO Core
              </CardTitle>
           </CardHeader>
           <CardContent className="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="gtm-id" className="font-bold">GTM ID (Tag Manager)</Label>
                <input 
                  id="gtm-id"
                  value={settings?.googleTagManagerId || ''} 
                  onChange={(e) => setSettings({...(settings ?? {}), googleTagManagerId: e.target.value})}
                  placeholder="GTM-XXXXXXX"
                  className="w-full h-12 rounded-xl border px-4 focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ga4-id" className="font-bold text-xs uppercase tracking-tight opacity-70">GA4 Measurement ID (G-XXXX)</Label>
                <input 
                  id="ga4-id"
                  value={settings?.googleAnalyticsId || ''} 
                  onChange={(e) => setSettings({...(settings ?? {}), googleAnalyticsId: e.target.value})}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full h-12 rounded-xl border px-4 focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ga4-property-id" className="font-bold text-xs uppercase tracking-tight opacity-70">GA4 Property ID (Analytics)</Label>
                <input 
                  id="ga4-property-id"
                  value={settings?.googleAnalyticsPropertyId || ''} 
                  onChange={(e) => setSettings({...(settings ?? {}), googleAnalyticsPropertyId: e.target.value})}
                  placeholder="e.g. 534447077"
                  className="w-full h-12 rounded-xl border px-4 focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </div>
           </CardContent>
        </Card>

        {/* 2. Advanced Tracking */}
        <Card className="lg:col-span-3 border-2 shadow-none overflow-hidden rounded-3xl">
           <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                 <BarChart3 className="h-5 w-5 text-primary" /> Marketing & Meta Pixel
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-6">
               <div className="space-y-2">
                <Label htmlFor="meta-pixel-id" className="font-bold text-xs">Meta Pixel ID</Label>
                <input id="meta-pixel-id" value={settings?.metaPixelId || ''} onChange={(e) => setSettings({...settings, metaPixelId: e.target.value})} className="w-full h-12 rounded-xl border px-4 text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fb-access-token" className="font-bold text-xs">Facebook Access Token</Label>
                <input id="fb-access-token" type="text" value={settings?.facebookAccessToken || ''} onChange={(e) => setSettings({...settings, facebookAccessToken: e.target.value})} className="w-full h-12 rounded-xl border px-4 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fb-domain-verify" className="font-bold text-xs">FB Domain Verification</Label>
                  <input id="fb-domain-verify" value={settings?.facebookDomainVerification || ''} onChange={(e) => setSettings({...settings, facebookDomainVerification: e.target.value})} className="w-full h-12 rounded-xl border px-4 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-test-code" className="font-bold text-xs">FB Test Event Code</Label>
                  <input id="fb-test-code" value={settings?.facebookTestEventCode || ''} onChange={(e) => setSettings({...settings, facebookTestEventCode: e.target.value})} className="w-full h-12 rounded-xl border px-4 text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sc-api-url" className="font-bold text-xs">Search Console ID / URL (for Analytics)</Label>
                <input id="sc-api-url" value={settings?.googleSearchConsoleId || ''} onChange={(e) => setSettings({...settings, googleSearchConsoleId: e.target.value})} placeholder="e.g. https://www.example.com/ or sc-domain:example.com" className="w-full h-12 rounded-xl border px-4 text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-console-meta" className="font-bold text-xs">Search Console Meta Tag (for Verification)</Label>
                <input id="search-console-meta" value={settings?.searchConsoleMeta || ''} onChange={(e) => setSettings({...settings, searchConsoleMeta: e.target.value})} className="w-full h-12 rounded-xl border px-4 text-sm" />
              </div>
           </CardContent>
        </Card>

        {/* 3. AI Intelligence */}
        <Card className="lg:col-span-3 border-2 border-purple-500/20 shadow-none overflow-hidden rounded-3xl">
           <CardHeader className="bg-purple-500/5 border-b">
              <CardTitle className="flex items-center gap-2">
                 <Settings2 className="h-5 w-5 text-purple-600" /> AI Bot Configuration
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-6">
               <div className="space-y-2">
                <Label htmlFor="gemini-api-key" className="font-bold text-xs">Gemini API Key</Label>
                <input id="gemini-api-key" type="text" value={settings?.aiConfig?.geminiApiKey || ''} onChange={(e) => setSettings({...settings, aiConfig: {...(settings?.aiConfig || {}), geminiApiKey: e.target.value}})} className="w-full h-12 rounded-xl border px-4 text-sm" />
              </div>
           </CardContent>
        </Card>

         {/* 4. Courier Logistics */}
        <Card className="lg:col-span-3 border-2 border-orange-500/20 shadow-none overflow-hidden rounded-3xl">
           <CardHeader className="bg-orange-500/5 border-b">
              <CardTitle className="flex items-center gap-2">
                 <Truck className="h-5 w-5 text-orange-600" /> Courier & Shipping Rules
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Active Provider</Label>
                    <Select value={settings?.courierConfig?.activeProvider || 'none'} onValueChange={(v) => setSettings({...settings, courierConfig: {...(settings?.courierConfig || {}), activeProvider: v}})}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="steadfast">Steadfast</SelectItem>
                        <SelectItem value="pathao">Pathao</SelectItem>
                        <SelectItem value="redx">RedX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inside-dhaka" className="font-bold">Inside Dhaka (TK)</Label>
                    <input id="inside-dhaka" type="number" value={settings?.deliveryChargeInsideDhaka || 0} onChange={(e) => setSettings({...settings, deliveryChargeInsideDhaka: Number(e.target.value)})} className="w-full h-12 rounded-xl border px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outside-dhaka" className="font-bold">Outside Dhaka (TK)</Label>
                    <input id="outside-dhaka" type="number" value={settings?.deliveryChargeOutsideDhaka || 0} onChange={(e) => setSettings({...settings, deliveryChargeOutsideDhaka: Number(e.target.value)})} className="w-full h-12 rounded-xl border px-4" />
                  </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border">
                 <div className="md:col-span-2 font-black text-xs uppercase opacity-50 mb-2">Provider Credentials</div>
                  <div className="space-y-2">
                    <Label htmlFor="steadfast-api-key" className="font-bold text-xs">Steadfast API Key</Label>
                    <input id="steadfast-api-key" type="text" value={settings?.courierConfig?.steadfast?.apiKey || ''} onChange={(e) => setSettings({...settings, courierConfig: {...(settings?.courierConfig || {}), steadfast: {...(settings?.courierConfig?.steadfast || {}), apiKey: e.target.value}}})} className="w-full h-10 rounded-lg border px-3 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="steadfast-secret-key" className="font-bold text-xs">Steadfast Secret Key</Label>
                    <input id="steadfast-secret-key" type="text" value={settings?.courierConfig?.steadfast?.secretKey || ''} onChange={(e) => setSettings({...settings, courierConfig: {...(settings?.courierConfig || {}), steadfast: {...(settings?.courierConfig?.steadfast || {}), secretKey: e.target.value}}})} className="w-full h-10 rounded-lg border px-3 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pathao-store-id" className="font-bold text-xs">Pathao Store ID</Label>
                    <input id="pathao-store-id" value={settings?.courierConfig?.pathao?.storeId || ''} onChange={(e) => setSettings({...settings, courierConfig: {...(settings?.courierConfig || {}), pathao: {...(settings?.courierConfig?.pathao || {}), storeId: e.target.value}}})} className="w-full h-10 rounded-lg border px-3 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="redx-api-key" className="font-bold text-xs">RedX API Key</Label>
                    <input id="redx-api-key" type="text" value={settings?.courierConfig?.redx?.apiKey || ''} onChange={(e) => setSettings({...settings, courierConfig: {...(settings?.courierConfig || {}), redx: {...(settings?.courierConfig?.redx || {}), apiKey: e.target.value}}})} className="w-full h-10 rounded-lg border px-3 text-xs" />
                  </div>
              </div>
           </CardContent>
        </Card>

        {/* 5. Payment Gateway Configuration */}
        <Card className="lg:col-span-3 border-2 border-blue-500/20 shadow-none overflow-hidden rounded-3xl">
           <CardHeader className="bg-blue-500/5 border-b">
              <CardTitle className="flex items-center gap-2">
                 <CreditCard className="h-5 w-5 text-blue-600" /> Payment Gateway (SSLCommerz)
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Active Payment Method</Label>
                    <Select 
                      value={settings?.paymentConfig?.activeMethod || 'none'} 
                      onValueChange={(v) => setSettings({
                        ...settings, 
                        paymentConfig: {
                          ...(settings?.paymentConfig || {}), 
                          activeMethod: v
                        }
                      })}
                    >
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Cash on Delivery Only)</SelectItem>
                        <SelectItem value="sslcommerz">SSLCommerz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-4">
                    <input 
                      type="checkbox" 
                      id="is-sandbox"
                      checked={settings?.paymentConfig?.sslcommerz?.isSandbox ?? true}
                      onChange={(e) => setSettings({
                        ...settings, 
                        paymentConfig: {
                          ...(settings?.paymentConfig || {}),
                          sslcommerz: {
                            ...(settings?.paymentConfig?.sslcommerz || {}),
                            isSandbox: e.target.checked
                          }
                        }
                      })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="is-sandbox" className="font-bold text-sm">Enable Sandbox Mode</Label>
                  </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border">
                 <div className="md:col-span-2 font-black text-xs uppercase opacity-50 mb-2">SSLCommerz Credentials</div>
                  <div className="space-y-2">
                    <Label htmlFor="ssl-store-id" className="font-bold text-xs">Store ID</Label>
                    <input 
                      id="ssl-store-id" 
                      value={settings?.paymentConfig?.sslcommerz?.storeId || ''} 
                      onChange={(e) => setSettings({
                        ...settings, 
                        paymentConfig: {
                          ...(settings?.paymentConfig || {}),
                          sslcommerz: {
                            ...(settings?.paymentConfig?.sslcommerz || {}),
                            storeId: e.target.value
                          }
                        }
                      })} 
                      className="w-full h-10 rounded-lg border px-3 text-xs" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssl-store-passwd" className="font-bold text-xs">Store Password</Label>
                    <input 
                      id="ssl-store-passwd" type="text"
                      value={settings?.paymentConfig?.sslcommerz?.storePassword || ''} 
                      onChange={(e) => setSettings({
                        ...settings, 
                        paymentConfig: {
                          ...(settings?.paymentConfig || {}),
                          sslcommerz: {
                            ...(settings?.paymentConfig?.sslcommerz || {}),
                            storePassword: e.target.value
                          }
                        }
                      })} 
                      className="w-full h-10 rounded-lg border px-3 text-xs" 
                      placeholder="Enter Password"
                    />
                  </div>
              </div>
           </CardContent>
        </Card>

        {/* 6. Manual Payment Configuration */}
        <Card className="lg:col-span-3 border-2 border-pink-500/20 shadow-none overflow-hidden rounded-3xl">
           <CardHeader className="bg-pink-500/5 border-b">
              <CardTitle className="flex items-center gap-2">
                 <CreditCard className="h-5 w-5 text-pink-600" /> Manual Payment (Mobile Banking)
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {['bkash', 'nagad', 'rocket'].map((method) => (
                  <div key={method} className="space-y-4 p-4 rounded-2xl border bg-muted/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image src={`/assets/${method}logo.webp`} alt={method} width={24} height={24} className="h-6 w-6 object-contain" />
                        <Label className="font-bold capitalize">{method}</Label>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings?.manualPaymentConfig?.[method]?.active ?? false}
                        onChange={(e) => setSettings({
                          ...settings,
                          manualPaymentConfig: {
                            ...(settings?.manualPaymentConfig || {}),
                            [method]: {
                              ...(settings?.manualPaymentConfig?.[method] || {}),
                              active: e.target.checked
                            }
                          }
                        })}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase opacity-60">Number</Label>
                      <input 
                        type="text"
                        value={settings?.manualPaymentConfig?.[method]?.number || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          manualPaymentConfig: {
                            ...(settings?.manualPaymentConfig || {}),
                            [method]: {
                              ...(settings?.manualPaymentConfig?.[method] || {}),
                              number: e.target.value
                            }
                          }
                        })}
                        placeholder="017XXXXXXXX"
                        className="w-full h-10 rounded-lg border px-3 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bangla QR Section */}
              <div className="p-6 rounded-3xl border-2 border-dashed border-primary/20 bg-primary/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Bangla QR (Universal Pay)</h4>
                      <p className="text-xs text-muted-foreground">Accept payment from any bank app via Bangla QR</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings?.manualPaymentConfig?.banglaQr?.active ?? false}
                    onChange={(e) => setSettings({
                      ...settings,
                      manualPaymentConfig: {
                        ...(settings?.manualPaymentConfig || {}),
                        banglaQr: {
                          ...(settings?.manualPaymentConfig?.banglaQr || {}),
                          active: e.target.checked
                        }
                      }
                    })}
                    className="h-5 w-5 rounded-md border-primary text-primary focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Upload Bangla QR</Label>
                    <div className="flex items-center gap-4">
                      {settings?.manualPaymentConfig?.banglaQr?.qrCode && (
                        <div className="h-16 w-16 rounded-xl border bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                          <Image src={settings.manualPaymentConfig.banglaQr.qrCode} alt="QR" width={64} height={64} className="max-h-full max-w-full object-contain" />
                          <button 
                            onClick={() => setSettings({
                              ...settings,
                              manualPaymentConfig: {
                                ...(settings?.manualPaymentConfig || {}),
                                banglaQr: {
                                  ...(settings?.manualPaymentConfig?.banglaQr || {}),
                                  qrCode: ''
                                }
                              }
                            })}
                            className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex-1">
                        <ImageUpload 
                          onUpload={(url) => setSettings({
                            ...settings,
                            manualPaymentConfig: {
                              ...(settings?.manualPaymentConfig || {}),
                              banglaQr: {
                                ...(settings?.manualPaymentConfig?.banglaQr || {}),
                                qrCode: url
                              }
                            }
                          })} 
                          className="h-16 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary transition-all bg-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white/50 rounded-2xl border border-primary/10">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Tip:</strong> You can download your Bangla QR from your bank app and upload it here.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Payment Instructions</Label>
                <textarea 
                  value={settings?.manualPaymentConfig?.instructions || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    manualPaymentConfig: {
                      ...(settings?.manualPaymentConfig || {}),
                      instructions: e.target.value
                    }
                  })}
                  className="w-full h-24 rounded-xl border p-4 text-sm resize-none"
                  placeholder="Instructions for the user..."
                />
              </div>
           </CardContent>
        </Card>

        {/* Design Templates */}
        <Card className="lg:col-span-3 border-2 border-primary/10 shadow-none overflow-hidden rounded-3xl">
           <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2 text-primary">
                 <Layout className="h-5 w-5" /> Design Orchestration
              </CardTitle>
              <CardDescription>Select the active version for each UI component across the platform.</CardDescription>
           </CardHeader>
           <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {TEMPLATE_CONFIG.map((template) => (
                 <div key={template.id} className="space-y-2">
                   <Label className="font-bold text-[10px] uppercase tracking-wider opacity-60">{template.label}</Label>
                   <Select 
                     value={ui[template.id] ?? 'v1'} 
                     onValueChange={(v) => updateTemplate(template.id, v)}
                   >
                     <SelectTrigger className="h-12 rounded-xl bg-background border-2 border-muted hover:border-primary/50 transition-colors">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl">
                       {TEMPLATE_OPTIONS.map(o => (
                         <SelectItem key={o} value={o} className="rounded-lg">
                           Version {o.toUpperCase()}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               ))}
               
                {/* Theme Selector */}
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider opacity-60 text-primary">Active Brand Theme</Label>
                  <Select 
                    value={ui.theme ?? 'default'} 
                    onValueChange={(v) => updateTemplate('theme', v)}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-background border-2 border-muted hover:border-primary/50 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {THEME_OPTIONS.map(o => (
                        <SelectItem key={o} value={o} className="rounded-lg capitalize">
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
           </CardContent>
        </Card>

        {/* Super Admin Note Section */}
        <Card className="lg:col-span-3 w-full border-none shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden rounded-3xl">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-5 md:p-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg shrink-0">
                <Database className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl font-bold leading-tight">Super Admin Note</CardTitle>
                <CardDescription className="text-indigo-100 text-xs md:text-sm mt-1">
                  Save project credentials, API keys, and system notes securely.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 md:p-8">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                Credentials & System Notes
              </Label>
              <textarea
                value={settings?.superAdminNote || ''}
                onChange={(e) => setSettings({
                  ...(settings ?? {}),
                  superAdminNote: e.target.value
                })}
                placeholder="Enter database URLs, credentials, courier secrets, or private dev notes..."
                className="w-full min-h-[200px] p-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-indigo-500 focus:bg-white outline-none transition-all resize-y font-mono text-sm shadow-inner"
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
