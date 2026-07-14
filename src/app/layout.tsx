import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono
} from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";
import "./prosemirror.css";
import Script from "next/script";
import { PWARegistry } from "@/components/pwa-registry";
import GoogleTagManager from "./components/GoogleTagManager";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { generateOrganizationSchema } from "@/lib/seo";
import FacebookPixel from "./components/FacebookPixel";
import TikTokPixel from "./components/TikTokPixel";
import { headers } from "next/headers";
import { getCachedSettings } from "@/lib/data-fetching";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const googleFontMap: Record<string, { family: string; weights?: string }> = {
  inter: { family: "Inter", weights: "300..800" },
  poppins: { family: "Poppins", weights: "300..800" },
  roboto: { family: "Roboto", weights: "300;400;500;700" },
  montserrat: { family: "Montserrat", weights: "300..800" },
  playfair: { family: "Playfair Display", weights: "400..700" },
  lora: { family: "Lora", weights: "400..700" },
  outfit: { family: "Outfit", weights: "300..800" },
  urbanist: { family: "Urbanist", weights: "300..800" },
  manrope: { family: "Manrope", weights: "300..800" },
  opensans: { family: "Open Sans", weights: "300..800" },
  lato: { family: "Lato", weights: "300;400;700" },
  oswald: { family: "Oswald", weights: "300..700" },
  raleway: { family: "Raleway", weights: "300..700" },
  nunito: { family: "Nunito", weights: "300..700" },
  ubuntu: { family: "Ubuntu", weights: "300;400;500;700" },
  merriweather: { family: "Merriweather", weights: "300;400;700" },
  kanit: { family: "Kanit", weights: "300;400;500;700" },
  quicksand: { family: "Quicksand", weights: "300..700" },
  josefinsans: { family: "Josefin Sans", weights: "100..700" },
  syne: { family: "Syne", weights: "400..800" },
  spacegrotesk: { family: "Space Grotesk", weights: "300..700" },
  orbitron: { family: "Orbitron", weights: "400..900" },
  jost: { family: "Jost", weights: "300..800" },
};

function getGoogleFontsUrl(fonts: string[]) {
  const uniqueFamiliesMap = new Map<string, string>();
  for (const fontKey of fonts) {
    if (!fontKey) continue;
    const key = fontKey.toLowerCase().replace(/[-_\s]/g, '');
    const mapped = googleFontMap[key];
    if (mapped) {
      uniqueFamiliesMap.set(mapped.family, mapped.weights ? `:wght@${mapped.weights}` : '');
    }
  }
  if (uniqueFamiliesMap.size === 0) return null;
  const families: string[] = [];
  uniqueFamiliesMap.forEach((weights, family) => {
    families.push(`family=${encodeURIComponent(family)}${weights}`);
  });
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const hostname = headersList.get('host') || 'localhost';
  const baseUrl = `https://${hostname}`;

  try {
    const settings = await getCachedSettings();

    if (!settings) throw new Error("No settings found");

    return {
      metadataBase: new URL(baseUrl),
      title: {
        default: settings.metaTitle || settings.brandName,
        template: `%s`,
      },
      description: settings.metaDescription || settings.brandName || "Your ultimate destination for quality products.",
      manifest: '/manifest.json',
      icons: {
        icon: settings.logoUrl || '/favicon.ico',
        shortcut: settings.logoUrl || '/favicon.ico',
        apple: settings.logoUrl || '/icon-512x512.png',
      },
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: settings.brandName || "Climax Apparels",
      },
      formatDetection: {
        telephone: false,
      },
      openGraph: {
        title: settings.metaTitle || settings.brandName || "Climax Apparels",
        description: settings.metaDescription || settings.brandName || "Your ultimate destination for quality products.",
        url: baseUrl,
        siteName: settings.brandName || "Climax Apparels",
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: settings.metaTitle || settings.brandName || "Climax Apparels",
        description: settings.metaDescription || settings.brandName || "Your ultimate destination for quality products.",
      },
      verification: {
        google: settings.searchConsoleMeta,
      },
      alternates: {
        canonical: './',
      },
      other: {
        ...(settings.facebookDomainVerification
          ? { "facebook-domain-verification": settings.facebookDomainVerification }
          : {}),
      },
    };
  } catch (error) {
    return {
      title: "Climax Apparels",
      description: "Your ultimate destination for quality products.",
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getCachedSettings();

  let jsonLd = null;
  try {
    if (settings) {
      jsonLd = await generateOrganizationSchema(settings);
    }
  } catch (e) {
    console.error("Error generating JSON-LD structured data", e);
  }

  // Security Helper: Validate GA ID format (G-XXXX or UA-XXXX)
  const isValidGAId = (id?: string) => id ? /^(G-[A-Z0-9]+|UA-[0-9-]+)$/i.test(id) : false;
  const gaId = settings?.googleAnalyticsId;

  const theme = settings?.uiTemplates?.theme;
  const themeClass = (theme && theme !== 'default') ? `theme-${theme.toLowerCase()}` : '';

  const bodyFont = settings?.uiTemplates?.bodyFont || 'inter';
  const logoFont = settings?.uiTemplates?.logoFont || 'orbitron';

  const fontClass = `font-${bodyFont}`;
  const logoFontClass = `logo-font-${logoFont}`;

  const googleFontsUrl = getGoogleFontsUrl([bodyFont, logoFont]);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${themeClass} ${fontClass} ${logoFontClass}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}
        <link rel="preload" as="image" href="/assets/login_banner_v2.webp" />
        <link rel="preload" as="image" href="/assets/register_banner_v2.webp" />
        <link rel="preload" as="image" href="/assets/forgetpassrod.webp" />
      </head>
      <body
        className="antialiased min-h-full flex flex-col overflow-x-hidden font-sans"
        suppressHydrationWarning
      >
        <PWARegistry />
        {jsonLd && (
          <Script
            id="json-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        <Providers settings={settings}>
          {settings?.googleTagManagerId && (
            <GoogleTagManager gtmId={settings.googleTagManagerId} />
          )}

          {settings?.metaPixelId && (
            <Suspense fallback={null}>
              <FacebookPixel
                pixelId={settings.metaPixelId}
              />
            </Suspense>
          )}

          {settings?.tiktokPixelId && (
            <Suspense fallback={null}>
              <TikTokPixel
                pixelId={settings.tiktokPixelId}
              />
            </Suspense>
          )}

          {isValidGAId(gaId) && (
            <>
              <Script
                id="google-analytics"
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              />
              <Script
                id="ga-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${gaId}');
                  `,
                }}
              />
            </>
          )}

          <SmoothScroll>
            {children}
            <ScrollProgress />
          </SmoothScroll>
        </Providers>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
