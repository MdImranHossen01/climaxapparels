import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Marquee } from '@/components/layout/Marquee';
import { getCachedSettings } from '@/lib/data-fetching';
import { headers } from 'next/headers';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { MobileBottomNavbar } from '@/components/layout/MobileBottomNavbar';
import SubscriptionBlocker from '../components/SubscriptionBlocker';
import { auth } from '@/auth';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isSuperAdmin = (session?.user as any)?.role === 'super_admin';

  let settings = null;
  try {
    settings = await getCachedSettings();
  } catch (error) {
    console.error('Failed to fetch settings:', error);
  }

  // Subscription Enforcement Logic
  const sub = settings?.saasSubscription;
  // If sub is missing, default to not expired (allow access by default)
  const isExpired = sub ? (sub.status !== 'Active' || (sub.expiryDate && new Date(sub.expiryDate).getTime() < new Date().getTime())) : false;

  // Only show blocker if expired and NOT a super admin
  const showBlocker = isExpired && !isSuperAdmin;

  const marqueeText = settings?.marqueeText || 'Welcome to Climax Apparels! Free shipping on orders over $500.';
  const ui = {
    layout: settings?.uiTemplates?.layout || 'v1',
    navbar: settings?.uiTemplates?.navbar || 'v1',
    footer: settings?.uiTemplates?.footer || 'v1',
  };

  return (
    <>
      {showBlocker && <SubscriptionBlocker brandName={settings?.brandName || 'Climax Apparels'} />}
      {ui.layout !== 'v2' && <Marquee marqueeText={marqueeText} />}
      <Navbar style={ui.navbar} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer style={ui.footer} />
      <ScrollToTop />
      <MobileBottomNavbar />
    </>
  );
}

