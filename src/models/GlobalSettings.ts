import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGlobalSettings extends Document {
  brandName: string;
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  logoUrl?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  marqueeText?: string;
  freeDeliveryThreshold?: number;
  deliveryChargeInsideDhaka?: number;
  deliveryChargeOutsideDhaka?: number;
  metaTitle?: string;
  metaDescription?: string;
  googleTagManagerId?: string;
  searchConsoleMeta?: string;
  facebookDomainVerification?: string;
  metaPixelId?: string;
  facebookAccessToken?: string;
  facebookTestEventCode?: string;
  tiktokPixelId?: string;
  tiktokAccessToken?: string;
  courierConfig?: {
    activeProvider?: 'steadfast' | 'pathao' | 'redx' | 'none';
    steadfast?: {
      apiKey?: string;
      secretKey?: string;
    };
    pathao?: {
      clientId?: string;
      clientSecret?: string;
      storeId?: string;
    };
    redx?: {
      apiKey?: string;
    };
    bdCourier?: {
      apiKey?: string;
    };
  };
  subscriptionConfig?: {
    activationThreshold?: number;
    rewardPercentage?: number;
  };
  paymentConfig?: {
    activeMethod?: 'sslcommerz' | 'none';
    sslcommerz?: {
      storeId?: string;
      storePassword?: string;
      isSandbox?: boolean;
    };
  };
  manualPaymentConfig?: {
    bkash?: { number: string; qrCode?: string; active: boolean };
    nagad?: { number: string; qrCode?: string; active: boolean };
    rocket?: { number: string; qrCode?: string; active: boolean };
    banglaQr?: { qrCode?: string; active: boolean };
    instructions?: string;
  };
  googleAnalyticsId?: string; // GA4 Measurement ID (G-XXXXXX)
  googleAnalyticsPropertyId?: string; // GA4 Property ID (Numeric)
  googleSearchConsoleId?: string; // Search Console Site URL (e.g. https://www.example.com/ or sc-domain:example.com)
  superAdminNote?: string;
  aiConfig?: {
    geminiApiKey?: string;
  };
  uiTemplates?: {
    layout?: string;
    navbar?: string;
    hero?: string;
    categories?: string;
    productCard?: string;
    productDetail?: string;
    blogDetail?: string;
    shopListing?: string;
    blogListing?: string;
    footer?: string;
    theme?: string;
    logoFont?: string;
    bodyFont?: string;
  };
  saasSubscription?: {
    expiryDate: Date;
    status: 'Active' | 'Expired' | 'Suspended';
  };
  footerNavigation?: {
    label: string;
    href: string;
  }[];
  testimonials?: {
    name: string;
    role: string;
    content: string;
    image: string;
    rating: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

import { encrypt, decrypt } from '@/lib/encryption';

const GlobalSettingsSchema: Schema<IGlobalSettings> = new Schema(
  {
    brandName: { type: String },
    contact: { type: Object, default: {} },
    logoUrl: { type: String, default: '/logo.webp' },
    socialLinks: { type: Object, default: {} },
    marqueeText: { type: String },
    freeDeliveryThreshold: { type: Number, default: 0 },
    deliveryChargeInsideDhaka: { type: Number, default: 60 },
    deliveryChargeOutsideDhaka: { type: Number, default: 120 },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    googleTagManagerId: { type: String },
    searchConsoleMeta: { type: String },
    facebookDomainVerification: { type: String },
    metaPixelId: { type: String },
    facebookAccessToken: { type: String },
    facebookTestEventCode: { type: String },
    tiktokPixelId: { type: String },
    tiktokAccessToken: { type: String },
    courierConfig: { type: Object, default: { activeProvider: 'none' } },
    subscriptionConfig: { type: Object, default: { activationThreshold: 5000, rewardPercentage: 5 } },
    paymentConfig: { type: Object, default: { activeMethod: 'none' } },
    manualPaymentConfig: { type: Object, default: {} },
    googleAnalyticsId: { type: String },
    googleAnalyticsPropertyId: { type: String },
    googleSearchConsoleId: { type: String },
    superAdminNote: { type: String },
    aiConfig: {
      geminiApiKey: { type: String }
    },
    uiTemplates: { type: Object, default: {} },
    saasSubscription: {
      expiryDate: { type: Date, index: true },
      status: { type: String, enum: ['Active', 'Expired', 'Suspended'], default: 'Active' },
    },
    footerNavigation: [
      {
        label: { type: String },
        href: { type: String },
      }
    ],
    testimonials: [
      {
        name: { type: String },
        role: { type: String },
        content: { type: String },
        image: { type: String },
        rating: { type: Number, default: 5 },
      }
    ],
  },
  {
    timestamps: true,
    toJSON: {
      getters: false, // Prevent automatic decryption and exposure in API responses
      transform: (doc, ret) => {
        // Security: Explicitly remove sensitive courier credentials from serialized output
        if (ret.courierConfig) {
          delete ret.courierConfig.steadfast;
          delete ret.courierConfig.pathao;
          delete ret.courierConfig.redx;
        }
        // Security: Remove sensitive Payment credentials
        if (ret.paymentConfig) {
          delete ret.paymentConfig.sslcommerz;
        }
        return ret;
      }
    },
    toObject: { getters: true } // Keep getters enabled for internal server-side logic
  }
);

const GlobalSettings: Model<IGlobalSettings> =
  mongoose.models.GlobalSettings || mongoose.model<IGlobalSettings>('GlobalSettings', GlobalSettingsSchema);

export default GlobalSettings;
