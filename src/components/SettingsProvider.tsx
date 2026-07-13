'use client';

import React, { createContext, useContext } from 'react';

interface SettingsContextType {
  brandName?: string;
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
  uiTemplates?: {
    theme?: string;
    logoFont?: string;
    bodyFont?: string;
  };
  aiConfig?: {
    geminiApiKey?: string;
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
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ 
  children, 
  settings 
}: { 
  children: React.ReactNode; 
  settings: SettingsContextType;
}) {
  const sanitizedSettings = React.useMemo(() => {
    if (!settings) return settings;
    const socialLinks = settings.socialLinks ? { ...settings.socialLinks } : undefined;
    
    if (socialLinks) {
      Object.keys(socialLinks).forEach((platform) => {
        const key = platform as keyof typeof socialLinks;
        let url = socialLinks[key]?.trim();
        if (url) {
          // If the platform is whatsapp, handle formats like 'wa.me/...' or a raw phone number
          if (key === 'whatsapp') {
            let phone = '';
            if (url.includes('wa.me/')) {
              const parts = url.split('wa.me/');
              phone = parts[parts.length - 1];
            } else if (url.includes('whatsapp.com/')) {
              const parts = url.split('phone=');
              if (parts.length > 1) {
                phone = parts[1];
              } else {
                phone = url.replace(/[^0-9]/g, '');
              }
            } else {
              phone = url.replace(/[^0-9]/g, '');
            }
            
            // Strip query params or non-digit chars
            phone = phone.split('?')[0].replace(/[^0-9]/g, '');
            socialLinks.whatsapp = `https://wa.me/${phone}`;
          } else {
            // For other social links, ensure they are absolute URLs
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              socialLinks[key] = `https://${url}`;
            }
          }
        }
      });
    }
    
    return {
      ...settings,
      socialLinks,
    };
  }, [settings]);

  return (
    <SettingsContext.Provider value={sanitizedSettings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined || context === null) {
    // Return empty settings instead of throwing or returning null
    return {} as SettingsContextType;
  }
  return context;
}

