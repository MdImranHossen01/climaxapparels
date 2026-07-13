import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Poppins,
  Roboto,
  Montserrat,
  Playfair_Display,
  Outfit,
  Lora,
  Manrope,
  Urbanist,
  Orbitron,
  Open_Sans,
  Lato,
  Oswald,
  Raleway,
  Nunito,
  Ubuntu,
  Merriweather,
  Kanit,
  Quicksand,
  Josefin_Sans,
  Syne,
  Space_Grotesk,
  Jost
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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});
const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

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

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${poppins.variable} ${roboto.variable} ${montserrat.variable} ${playfair.variable} ${outfit.variable} ${lora.variable} ${manrope.variable} ${urbanist.variable} ${orbitron.variable} ${openSans.variable} ${lato.variable} ${oswald.variable} ${raleway.variable} ${nunito.variable} ${ubuntu.variable} ${merriweather.variable} ${kanit.variable} ${quicksand.variable} ${josefinSans.variable} ${syne.variable} ${spaceGrotesk.variable} ${jost.variable} ${themeClass} ${fontClass} ${logoFontClass}`} suppressHydrationWarning>
      <head>
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
