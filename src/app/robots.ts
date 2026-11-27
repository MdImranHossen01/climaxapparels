import { MetadataRoute } from 'next';

export const revalidate = 31536000;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');
  const BASE_URL = rawSiteUrl.startsWith('http') ? rawSiteUrl.replace(/\/+$/, '') : `https://${rawSiteUrl.replace(/\/+$/, '')}`;
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/', 
        '/dashboard/', 
        '/api/', 
        '/checkout/', 
        '/login/', 
        '/register/', 
        '/forgot-password/', 
        '/reset-password/',
        '/wishlist/'
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

