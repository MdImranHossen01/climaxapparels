import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/db';
import GlobalSettings from '@/models/GlobalSettings';
import { auth } from '@/auth';

// Helper to return settings without masking sensitive data or fallback to environment variables
const getMaskedSettings = (raw: any, masked: any) => ({
  ...masked,
  facebookAccessToken: masked.facebookAccessToken || null,
  tiktokAccessToken: masked.tiktokAccessToken || null,
  courierConfig: masked.courierConfig ? {
    ...masked.courierConfig,
    steadfast: masked.courierConfig.steadfast || null,
    pathao: masked.courierConfig.pathao || null,
    redx: masked.courierConfig.redx || null,
    bdCourier: masked.courierConfig.bdCourier || null,
  } : masked.courierConfig,
  paymentConfig: masked.paymentConfig ? {
    ...masked.paymentConfig,
    sslcommerz: masked.paymentConfig.sslcommerz || null,
  } : masked.paymentConfig,
  aiConfig: masked.aiConfig ? {
    ...masked.aiConfig,
    geminiApiKey: masked.aiConfig.geminiApiKey || null,
  } : masked.aiConfig
});

// GET global settings
export async function GET() {
  try {
    await connectToDatabase();
    const settings = await GlobalSettings.findOne().sort({ updatedAt: -1 });
    if (!settings) {
      return NextResponse.json({
        brandName: process.env.NEXT_PUBLIC_STORE_NAME || "Climax Apparels",
        contact: {
          email: "support@Climax Apparels.com",
          phone: "+8801234567890",
          address: "Dhaka, Bangladesh"
        },
        socialLinks: {
          facebook: '',
          twitter: '',
          instagram: '',
          youtube: '',
          linkedin: '',
          tiktok: '',
          whatsapp: ''
        },
        marqueeText: "Welcome to Climax Apparels!",
        metaTitle: process.env.NEXT_PUBLIC_STORE_NAME || "Climax Apparels",
        metaDescription: "The most popular online shop in Bangladesh.",
        logoUrl: "/logo.webp",
        freeDeliveryThreshold: 0,
        deliveryChargeInsideDhaka: 60,
        deliveryChargeOutsideDhaka: 120,
        uiTemplates: {
          theme: 'green',
          logoFont: 'orbitron',
          bodyFont: 'inter',
        }
      });
    }

    const rawSettings = settings.toObject({ getters: false });
    const maskedSettings = settings.toObject({ getters: true });

    return NextResponse.json(getMaskedSettings(rawSettings, maskedSettings));
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create or update global settings (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !(['admin', 'super_admin'].includes((session.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ message: 'Invalid JSON request body' }, { status: 400 });
    }

    // Whitelist allowed fields for standard admins
    const allowedFields = [
      'brandName', 'contact', 'socialLinks',
      'marqueeText', 'metaTitle', 'metaDescription',
      'subscriptionConfig',
      'freeDeliveryThreshold',
      'deliveryChargeInsideDhaka',
      'deliveryChargeOutsideDhaka',
      'theme',
      'logoUrl',
      'footerNavigation',
      'testimonials',
      'paymentConfig',
      'manualPaymentConfig',
      'courierConfig',
      'facebookDomainVerification',
      'metaPixelId',
      'facebookAccessToken',
      'facebookTestEventCode',
      'tiktokPixelId',
      'tiktokAccessToken',
      'googleTagManagerId'
    ];

    // Restricted fields - ONLY for super_admin
    const superAdminFields = [
      'uiTemplates',
      'storeId',
      'googleAnalyticsId',
      'googleAnalyticsPropertyId',
      'googleSearchConsoleId',
      'aiConfig',
      'searchConsoleMeta',
      'saasSubscription',
      'superAdminNote'
    ];

    const isSuperAdmin = (session.user as any).role === 'super_admin';
    const allowedBody: any = {};

    Object.keys(body).forEach((key) => {
      if (allowedFields.includes(key)) {
        allowedBody[key] = body[key];
      }
      if (superAdminFields.includes(key) && isSuperAdmin) {
        allowedBody[key] = body[key];
      }
    });

    if (Object.keys(allowedBody).length === 0) {
      return NextResponse.json({ message: 'No valid fields provided for update' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if settings already exist
    let settings = await GlobalSettings.findOne().sort({ updatedAt: -1 });
    if (settings) {
      // Helper to recursively remove masked values ('********************')
      const removeMasked = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(removeMasked);

        const cleaned: any = {};
        Object.keys(obj).forEach(k => {
          if (obj[k] === '********************') return;
          if (typeof obj[k] === 'object' && obj[k] !== null) {
            cleaned[k] = removeMasked(obj[k]);
          } else {
            cleaned[k] = obj[k];
          }
        });
        return cleaned;
      };

      // Recursive Deep Merge helper
      const deepMerge = (target: any, source: any) => {
        Object.keys(source).forEach(key => {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        });
        return target;
      };

      // Update existing settings document manually to trigger setters/encryption
      Object.keys(allowedBody).forEach((key) => {
        let newValue = allowedBody[key];

        // Clean masked values from newValue
        newValue = removeMasked(newValue);

        if (newValue !== undefined) {
          if (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) {
            // Use Deep Merge for objects (contact, socialLinks, courierConfig, etc.)
            const currentValue = (settings as any)[key] || {};
            (settings as any)[key] = deepMerge({ ...currentValue }, newValue);
            (settings as any).markModified(key); // Explicitly mark as modified for Mongoose
          } else {
            // Standard overwrite for primitives
            (settings as any)[key] = newValue;
          }
        }
      });
      await settings.save({ validateBeforeSave: false });
    } else {
      // Create new settings record
      settings = await GlobalSettings.create({ ...allowedBody });
    }

    revalidateTag('settings', 'max');
    revalidateTag('products', 'max');
    revalidateTag('categories', 'max');
    revalidateTag('faqs', 'max');
    revalidatePath('/', 'layout');
    revalidatePath('/shop', 'page');
    revalidatePath('/blog', 'page');

    // Mask sensitive response data for the return
    const updatedRaw = settings.toObject({ getters: false });
    const updatedMasked = settings.toObject({ getters: true });

    return NextResponse.json(getMaskedSettings(updatedRaw, updatedMasked), { status: 200 });
  } catch (error: any) {
    console.error('CRITICAL: Error updating settings:', error);
    if (error.name === 'ValidationError') {
      console.error('Mongoose Validation Details:', JSON.stringify(error.errors, null, 2));
      const fieldErrors = Object.keys(error.errors || {}).join(', ');
      return NextResponse.json({
        message: `Validation Error: Missing or invalid fields (${fieldErrors}). Please ensure General Settings are filled.`,
        details: error.errors
      }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

