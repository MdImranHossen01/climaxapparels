import { Metadata } from 'next';
import connectToDatabase from '@/lib/db';
import GlobalSettings from '@/models/GlobalSettings';
import { Separator } from '@/components/ui/separator';
import { FileText, ShoppingBag, Truck, UserCheck, Scale, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Climax Apparels',
  description: 'Understand the terms and conditions for shopping at Climax Apparels.',
};

async function getSettings() {
  try {
    await connectToDatabase();
    const settings = await GlobalSettings.findOne().lean();
    if (!settings) {
      return {
        brandName: "Climax Apparels",
        contact: {
          email: "support@climaxapparels.com",
          phone: "+8801234567890"
        }
      };
    }
    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    console.error('Error fetching settings for terms page:', error);
    return {
      brandName: "Climax Apparels",
      contact: {
        email: "support@climaxapparels.com",
        phone: "+8801234567890"
      }
    };
  }
}

export default async function TermsPage() {
  const settings = await getSettings();
  const brandName = settings.brandName || "RPL Market";
  const contactEmail = settings.contact?.email || "support@climaxapparels.com";
  const lastUpdated = "April 04, 2026";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Header */}
      <section className="bg-primary/5 py-16 md:py-24 border-b">
        <div className="container mx-auto px-4 md:px-0 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full bg-primary/10 text-primary">
            <FileText className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Terms & <span className="text-primary">Conditions</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Please read these terms and conditions carefully before using our services. By shopping with us, you agree to follow these rules.
          </p>
          <p className="mt-8 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Effective Date: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-20 font-serif">
        <div className="container mx-auto px-4 md:px-0 max-w-4xl">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">

            {/* Agreement to Terms */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Scale className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0 italic">1. Agreement to Terms</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using {brandName}'s particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </div>

            <Separator />

            {/* Your Account */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserCheck className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0 italic">2. Your Account</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                If you use this site, you are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password. {brandName} reserves the right to refuse service, terminate accounts, or cancel orders in its sole discretion.
              </p>
            </div>

            <Separator />

            {/* Shopping and Payment */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0 italic">3. Shopping and Payment</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                All prices are listed in the local currency and are subject to change without notice. We provide secure payment processing. You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store.
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
                <li>Orders are subject to availability.</li>
                <li>We reserve the right to cancel orders due to pricing errors.</li>
                <li>Payment must be completed in full before delivery.</li>
              </ul>
            </div>

            <Separator />

            {/* Delivery and Returns */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Truck className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0 italic">4. Delivery and Returns</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed italic border-l-4 border-primary/20 pl-4 py-2">
                Our delivery times are estimates and not guarantees. We work with trusted partners to ensure your products arrive safely.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Please refer to our separate "Return Policy" for detailed information on how to return items. Generally, items must be returned in their original packaging with all tags attached to be eligible for a refund or exchange.
              </p>
            </div>

            <Separator />

            {/* Intellectual Property */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0 italic">5. Intellectual Property</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                All content included on this site, such as text, graphics, logos, images, and software, is the property of {brandName} or its content suppliers and protected by international copyright laws.
              </p>
            </div>

            <Separator />

            {/* Limitation of Liability */}
            <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="h-6 w-6 text-red-500" />
                <h2 className="text-2xl font-bold m-0 italic">6. Limitation of Liability</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed m-0 italic">
                {brandName} shall not be liable for any direct, indirect, incidental, special or consequential damages resulting from the use or inability to use the services or for the cost of procurement of substitute goods and services.
              </p>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="bg-primary/5 p-10 rounded-3xl text-center shadow-sm border border-primary/10">
              <div className="flex flex-col items-center">
                <HelpCircle className="h-10 w-10 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-4 italic">Need Clarification?</h2>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                  Our support team is here to help you understand our terms and ensure a smooth shopping experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <a
                    href={`mailto:${contactEmail}`}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-full hover:shadow-lg transition-all"
                  >
                    Contact Support
                  </a>
                  <span className="text-muted-foreground font-serif">or call {settings.contact?.phone || "+880 1234-567890"}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Final Footer Bottom */}
      <section className="bg-muted py-12 border-t mt-auto">
        <div className="container mx-auto px-4 md:px-0 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
            <br className="sm:hidden" />
            <span className="hidden sm:inline mx-2">|</span>
            Crafted for premium service.
          </p>
        </div>
      </section>
    </div>
  );
}
