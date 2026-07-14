/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Youtube } from '@/components/ui/social-icons';
import { Mail, MapPin, Phone, ArrowUpRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DeveloperLogo from '@/components/ui/developerlogo';
import { useSettings } from '@/components/SettingsProvider';
import * as SocialIcons from '@/components/ui/social-icons';
import { Circle } from 'lucide-react';
import { useState, useEffect } from 'react';

const socialIconMap: Record<string, any> = {
  facebook: SocialIcons.Facebook || Circle,
  twitter: SocialIcons.Twitter || SocialIcons.X || Circle,
  instagram: SocialIcons.Instagram || Circle,
  youtube: SocialIcons.Youtube || Circle,
  linkedin: SocialIcons.Linkedin || Circle,
  tiktok: SocialIcons.Tiktok || Circle,
  whatsapp: SocialIcons.Whatsapp || Circle,
};

export default function FooterV2() {
  const currentYear = new Date().getFullYear();
  const settings = useSettings();
  const socialLinks = settings?.socialLinks || {};
  const hasSocialLinks = Object.values(socialLinks).some(v => v);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Detect iOS device
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      toast.success('App installed successfully!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      toast.info('To install this app on your iPhone/iPad: Tap the "Share" icon in Safari and select "Add to Home Screen".', {
        duration: 8000,
      });
      return;
    }

    if (!deferredPrompt) {
      toast.info('To install the app: Click your browser menu (e.g. three dots icon in Chrome) and select "Install App" or "Add to Home Screen".', {
        duration: 6000,
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('Thank you for installing our app!');
    }
    setDeferredPrompt(null);
  };

  const footerNav = settings?.footerNavigation && settings.footerNavigation.length > 0
    ? settings.footerNavigation
    : [
      { label: 'Shop All', href: '/shop' },
      { label: 'Factory Profile', href: '/factory-profile' },
      { label: 'New Arrivals', href: '/shop?filter=new' },
      { label: 'Order Tracking', href: '/track-order' },
      { label: 'Contact Support', href: '/contact' }
    ];

  return (
    <footer className="bg-background border-t border-muted text-foreground pt-16 pb-8 px-6 font-jost">
      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center lg:text-left lg:grid lg:grid-cols-12 lg:gap-16 mb-16 space-y-12 lg:space-y-0">

          {/* Brand Essence */}
          <div className="lg:col-span-4 space-y-6 flex flex-col items-center lg:items-start">
            <Link href="/" className="text-2xl md:text-3xl font-black tracking-tighter hover:scale-105 transition-all flex items-center gap-2 group text-foreground">
              <Image src="/logo.webp" width={40} height={40} alt="Climax Apparels Logo" className="object-contain" />
              {settings?.brandName || 'Climax Apparels'}
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed font-medium">
              Pushing the boundaries of design. Born in the heart of Dhaka, engineering for the world.
            </p>

            {/* PWA Download App Button */}
            {!isStandalone && (
              <Button
                onClick={handleInstallClick}
                variant="outline"
                className="mt-2 rounded-full border-neutral-300 dark:border-neutral-700 text-foreground hover:bg-primary hover:text-primary-foreground font-black text-[10px] tracking-widest gap-2 h-9 px-4 uppercase transition-all duration-300"
              >
                <Download className="h-3.5 w-3.5 animate-bounce" />
                Download App
              </Button>
            )}
          </div>

          {/* Dynamic Navigation */}
          <div className="lg:col-span-5 w-full">
            <div className="flex flex-col items-center lg:items-start space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-foreground">Quick Links</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 w-full lg:w-auto">
                {footerNav.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm font-bold text-muted-foreground hover:text-primary transition-all whitespace-nowrap">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social Icons & Policy Links */}
          <div className="lg:col-span-3 space-y-6 flex flex-col items-center lg:items-start">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-foreground text-center lg:text-left">Connect With Us</h3>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                {hasSocialLinks ? (
                  Object.entries(socialLinks).map(([platform, url]) => {
                    if (!url) return null;
                    const Icon = socialIconMap[platform];
                    if (!Icon) return null;

                    return (
                      <Link
                        key={platform}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full border border-muted flex items-center justify-center hover:bg-primary hover:border-primary transition-all group"
                        title={platform}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground italic">Follow us on social media for updates.</p>
                )}
              </div>

              {/* Privacy & Terms Moved Here */}
              <div className="flex items-center justify-center lg:justify-start gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground pt-2">
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Reduced Padding & Smart Layout */}
        <div className="pt-6 border-t border-muted flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          <p className="text-center md:text-left">© {currentYear} Climax Apparels CO. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-4">
            <DeveloperLogo className="opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all scale-90 md:scale-100" />
          </div>
        </div>
      </div>
    </footer>
  );
}

