import { Metadata } from 'next';
import connectToDatabase from '@/lib/db';
import GlobalSettings from '@/models/GlobalSettings';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Info, Share2, Lock, Eye, Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Climax Apparels',
  description: 'Learn how Climax Apparels collects, uses, and protects your personal information.',
};

async function getSettings() {
  try {
    await connectToDatabase();
    const settings = await GlobalSettings.findOne().lean();
    if (!settings) {
      return {
        brandName: "Climax Apparels",
        contact: {
          email: "support@Climax Apparels.com"
        }
      };
    }
    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    console.error('Error fetching settings for privacy page:', error);
    return {
      brandName: "Climax Apparels",
      contact: {
        email: "support@Climax Apparels.com"
      }
    };
  }
}

export default async function PrivacyPage() {
  const settings = await getSettings();
  const brandName = settings.brandName || "RPL Market";
  const contactEmail = settings.contact?.email || "support@Climax Apparels.com";
  const lastUpdated = "April 04, 2026";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Header */}
      <section className="bg-primary/5 py-16 md:py-24 border-b">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Privacy <span className="text-primary">Policy</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we handle your data and ensure your security while shopping with us.
          </p>
          <p className="mt-8 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Last Updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">

            {/* Introduction */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Info className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0 italic">Introduction</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to {brandName}. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
              </p>
            </div>

            <Separator className="my-8" />

            {/* Information We Collect */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0 italic">Information We Collect</h2>
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground list-none p-0">
                <li className="flex gap-3 bg-muted/30 p-4 rounded-xl border">
                  <span className="font-bold text-primary">Identity:</span> Includes first name, last name, and username.
                </li>
                <li className="flex gap-3 bg-muted/30 p-4 rounded-xl border">
                  <span className="font-bold text-primary">Contact:</span> Includes email address, phone number, and delivery address.
                </li>
                <li className="flex gap-3 bg-muted/30 p-4 rounded-xl border">
                  <span className="font-bold text-primary">Financial:</span> Includes payment card details (processed securely).
                </li>
                <li className="flex gap-3 bg-muted/30 p-4 rounded-xl border">
                  <span className="font-bold text-primary">Technical:</span> Includes IP address, browser type, and login data.
                </li>
              </ul>
            </div>

            <Separator className="my-8" />

            {/* How We Use Your Data */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Bell className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0 italic">How We Use Your Data</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We will only use your personal data for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
                <li>To register you as a new customer and process your orders.</li>
                <li>To deliver and manage payments, fees, and charges.</li>
                <li>To manage our relationship with you, including notifications about policy changes.</li>
                <li>To enable you to partake in competitions or complete surveys.</li>
                <li>To improve our website, products, services, and customer experiences.</li>
              </ul>
            </div>

            <Separator className="my-8" />

            {/* Data Sharing */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Share2 className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0 italic">Sharing Your Information</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal data to third parties. We only share your data with trusted partners (like delivery services and payment processors) who are essential for fulfilling your orders and providing our services. All third-party service providers are required to take appropriate security measures to protect your personal data.
              </p>
            </div>

            <Separator className="my-8" />

            {/* Security */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0 italic">Security of Data</h2>
              </div>
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl">
                <p className="text-muted-foreground italic leading-relaxed m-0">
                  We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees and partners who have a business need to know.
                </p>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Contact Information */}
            <div className="bg-muted p-8 rounded-3xl text-center shadow-inner">
              <h2 className="text-2xl font-bold mb-4 italic">Questions or Concerns?</h2>
              <p className="text-muted-foreground mb-6">
                If you have any questions about this privacy policy or our privacy practices, please contact us.
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="text-primary font-bold text-lg hover:underline transition-all"
              >
                {contactEmail}
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Footer Disclaimer */}
      <section className="bg-muted/50 py-12 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            This privacy policy is a living document. We reserve the right to update it as our services and legal requirements evolve. Your continued use of {brandName} constitutes acceptance of these terms.
          </p>
        </div>
      </section>
    </div>
  );
}
