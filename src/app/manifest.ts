import type { MetadataRoute } from 'next';
import { getCachedSettings } from '@/lib/data-fetching';

export const dynamic = 'force-dynamic';

/**
 * Mapping of theme names to hex colors for PWA theme_color
 */
const THEME_COLORS: Record<string, string> = {
  vintage: '#B8860B',
  tangerine: '#FF8C00',
  t3: '#E91E63',
  quantum: '#FF00FF',
  ocean: '#008080',
  darkmatter: '#1A1A1A',
  cyberpunk: '#FFFF00',
  clay: '#7B68EE',
  catppuccin: '#CBA6F7',
  green: '#00D1B2',
  default: '#00D1B2',
};

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getCachedSettings();

  const brandName = settings?.brandName || 'Climax Apparelsr';
  const themeName = settings?.uiTemplates?.theme?.toLowerCase() || 'default';
  const themeColor = THEME_COLORS[themeName] || THEME_COLORS.default;

  return {
    name: brandName,
    short_name: brandName.split(' ')[0],
    description: settings?.metaDescription || `The most popular online shop in Bangladesh. High performance ecommerce platform for ${brandName}.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: themeColor,
    icons: [
      {
        src: settings?.logoUrl || '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: settings?.logoUrl || '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}

