import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Factory, 
  MapPin, 
  Calendar, 
  Cpu, 
  Award, 
  ShieldCheck, 
  Clock, 
  Globe2, 
  CreditCard, 
  Layers, 
  Package, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Globe, 
  ArrowRight,
  Sparkles,
  BookmarkCheck
} from 'lucide-react';
import connectToDatabase from '@/lib/db';
import GlobalSettings from '@/models/GlobalSettings';
import { Button } from '@/components/ui/button';
import { CounterSection } from './CounterSection';

export const metadata: Metadata = {
  title: 'Factory Profile | Climax Apparels',
  description: 'Climax Apparels - State-of-the-art underwear and apparel manufacturing facility in Dhaka, Bangladesh. Specializing in high-capacity OEM & private label production for global brands.',
};

async function getSettings() {
  try {
    await connectToDatabase();
    const settings = await GlobalSettings.findOne().lean();
    if (!settings) {
      return {
        brandName: "Climax Apparels",
        contact: {
          email: "info@climaxapparels.com",
          phone: "+8801724-338581",
          address: "Sarkarbari, Helal Market, Uttar Khan, Dhaka, Bangladesh"
        }
      };
    }
    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    console.error('Error fetching settings for factory profile:', error);
    return null;
  }
}

export default async function FactoryProfilePage() {
  const settings = await getSettings();
  const brandName = settings?.brandName || "Climax Apparels";
  const contactEmail = settings?.contact?.email || "info@climaxapparels.com";
  const contactPhone = settings?.contact?.phone || "+8801724-338581";
  const factoryAddress = settings?.contact?.address || "Sarkarbari, Helal Market, Uttar Khan, Dhaka, Bangladesh";

  const profileSpecs = [
    { name: "Company Name", value: brandName },
    { name: "Location", value: "Dhaka, Bangladesh" },
    { name: "Establishment", value: "Since 2014" },
    { name: "Production Capacity", value: "5,00,000 pcs/month" },
    { name: "Specialization", value: "OEM / Private Label Manufacturing" },
    { name: "Certificates", value: "ISO, BSCI" },
    { name: "Core Strengths", value: "High-quality fabrics, competitive pricing, fast delivery" }
  ];

  const processes = [
    {
      title: "Production Division",
      description: "Our advanced cutting and sewing sections are equipped with modern machinery to bring custom designs to life. Supported by an expert in-house design and production team, we maintain optimal stitch quality and seamless fabric joining.",
      image: "/assets/factory_production.png",
      badge: "Cutting & Sewing"
    },
    {
      title: "Finishing & Packaging",
      description: "We perform rigorous quality control checks during the finishing stage. We offer diverse packaging options tailored to your needs, including standard polybags, branded OEM boxes, customized hangtags, and eco-friendly packaging.",
      image: "/assets/factory_finishing.png",
      badge: "Quality Assurance"
    }
  ];

  const shippingInfo = [
    { 
      title: "Lead Time", 
      value: "25–40 days (depending on order size)", 
      icon: Clock,
      description: "Efficient planning and execution to ensure prompt production completion."
    },
    { 
      title: "Export Markets", 
      value: "Europe, USA, Middle East, and Asia", 
      icon: Globe2,
      description: "Serving global clients with optimized international shipping logistics."
    },
    { 
      title: "Payment Terms", 
      value: "T/T, Cash (Negotiable)", 
      icon: CreditCard,
      description: "Flexible payment methods supporting secure B2B transactions."
    }
  ];

  const productCats = [
    {
      title: "Calvin Klein Style Underwear",
      specs: [
        "Materials: 100% Cotton / Cotton Spandex / Polyester",
        "Sizes: S – XXL",
        "Styles: Regular Fit, Slim Fit, Printed",
        "Features: Soft waistband, breathable, anti-sweat",
        "MOQ: 300 pcs",
        "Design: OEM Logo, Custom Packaging"
      ]
    },
    {
      title: "Tommy Hilfiger Style",
      specs: [
        "Materials: Cotton Lycra / Modal / Bamboo Fiber",
        "Sizes: S – XXL",
        "Styles: Low-rise, Mid-rise, Sports",
        "Features: Stretchable, skin-friendly, strong waistband",
        "MOQ: 300 pcs",
        "Design: Private Label, Branded Elastic, Tagless Printing"
      ]
    },
    {
      title: "Versace Style",
      specs: [
        "Materials: Cotton Lycra / Modal / Bamboo Fiber",
        "Sizes: S – XXL",
        "Styles: Low-rise, Mid-rise, Sports",
        "Features: Stretchable, skin-friendly, strong waistband",
        "MOQ: 300 pcs",
        "Design: Private Label, Branded Elastic, Tagless Printing"
      ]
    },
    {
      title: "Hugo Boss Style",
      specs: [
        "Materials: Cotton Lycra / Modal / Bamboo Fiber",
        "Sizes: S – XXL",
        "Styles: Low-rise, Mid-rise, Sports",
        "Features: Stretchable, skin-friendly, strong waistband",
        "MOQ: 300 pcs",
        "Design: Private Label, Branded Elastic, Tagless Printing"
      ]
    },
    {
      title: "Polo Ralph Lauren Style",
      specs: [
        "Materials: Cotton Lycra / Modal / Bamboo Fiber",
        "Sizes: S – XXL",
        "Styles: Low-rise, Mid-rise, Sports",
        "Features: Stretchable, skin-friendly, strong waistband",
        "MOQ: 300 pcs",
        "Design: Private Label, Branded Elastic, Tagless Printing"
      ]
    },
    {
      title: "Swim Shorts & Casuals",
      specs: [
        "Materials: Cotton Lycra / Modal / Bamboo Fiber",
        "Sizes: S – XXL",
        "Styles: Low-rise, Mid-rise, Sports",
        "Features: Stretchable, skin-friendly, strong waistband",
        "MOQ: 300 pcs",
        "Design: Private Label, Branded Elastic, Tagless Printing"
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-transparent py-20 md:py-28 border-b border-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
            <Sparkles className="h-3 w-3" /> State-of-the-Art Garment Manufacturing
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-6">
            Factory <span className="text-primary">Profile</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            Discover the manufacturing infrastructure behind <strong className="text-primary">{brandName}</strong>. With over 10 years of experience in the textile and garment industry, our Bangladesh factory is a premier center for high-capacity men's underwear, T-shirt, and Polo shirt production.
          </p>
        </div>
      </section>

      {/* Stats Counter Section */}
      <CounterSection />

      {/* About & Specs */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Description Column */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Premium Innerwear Solutions for Global Brands
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                We offer comprehensive <strong>OEM (Original Equipment Manufacturer)</strong> and <strong>ODM (Original Design Manufacturer)</strong> services. This allows our global clients to bring their custom designs to life with full backend support from our in-house design and production teams.
              </p>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Our factory specializes in high-quality fabrics (combed cotton, modal, spandex, and sustainable bamboo fibers), precision craftsmanship, and strict compliance standards. We focus on comfort, durability, and modern styles to serve retailers, wholesalers, and iconic global brands.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3 p-4 rounded-xl border bg-card/30">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Quality Guarantee</h4>
                    <p className="text-xs text-muted-foreground mt-1">Rigorous inspection points throughout sewing, finishing, and final packaging.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl border bg-card/30">
                  <BookmarkCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Sustainable Practices</h4>
                    <p className="text-xs text-muted-foreground mt-1">Ethical manufacturing policies, eco-friendly packaging options, and certified fabrics.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Company Profile Table Column */}
            <div className="lg:col-span-5 border rounded-2xl bg-card overflow-hidden shadow-sm">
              <div className="p-5 border-b bg-muted/30">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <Factory className="h-5 w-5 text-primary" />
                  Company Profile Table
                </h3>
              </div>
              <div className="divide-y divide-border/60">
                {profileSpecs.map((spec, i) => (
                  <div key={i} className="p-4 grid grid-cols-3 gap-4 text-sm hover:bg-muted/10 transition-colors">
                    <span className="font-semibold text-muted-foreground col-span-1">{spec.name}</span>
                    <span className="text-foreground col-span-2">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Production Facilities / Processes */}
      <section className="py-16 md:py-24 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Our Manufacturing Divisions</h2>
            <p className="text-muted-foreground text-sm">
              Explore how we handle production from sewing and assembly to strict quality inspections and custom packaging.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {processes.map((proc, i) => (
              <div key={i} className="flex flex-col border bg-background rounded-2xl overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300">
                <div className="relative h-64 w-full overflow-hidden">
                  <Image 
                    src={proc.image} 
                    alt={proc.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
                    {proc.badge}
                  </span>
                </div>
                <div className="p-6 md:p-8 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">{proc.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{proc.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Categories Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Product Customization & Capabilities</h2>
            <p className="text-muted-foreground text-sm">
              We specialize in premium branded designs manufactured according to client specification sheets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productCats.map((cat, i) => (
              <div key={i} className="bg-card border rounded-2xl p-6 md:p-8 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-md">
                <div className="space-y-4">
                  <div className="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-lg">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{cat.title}</h3>
                  <ul className="space-y-2">
                    {cat.specs.map((spec, sIdx) => (
                      <li key={sIdx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Production & Shipping */}
      <section className="py-16 bg-primary/5 border-t border-b border-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Production & Shipping Terms</h2>
            <p className="text-muted-foreground text-sm">
              Standard lead times and international trade terms configured for global import.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {shippingInfo.map((info, i) => (
              <div key={i} className="bg-background border rounded-2xl p-6 text-center space-y-4 shadow-sm">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <info.icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-muted-foreground text-xs uppercase tracking-wider">{info.title}</h4>
                  <p className="font-extrabold text-foreground text-lg">{info.value}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{info.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Factory Contact Information */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-card border rounded-3xl p-8 md:p-12 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10">
                  Get in Touch
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mt-3">
                  Contact Our Bangladesh Factory
                </h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Connect with our factory representatives directly to request samples, factory audits, or project quotations.
              </p>

              <div className="space-y-3.5">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4.5 w-4.5 text-primary shrink-0" />
                  <a href={`tel:${contactPhone}`} className="text-foreground hover:text-primary hover:underline transition-colors font-medium">
                    {contactPhone}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4.5 w-4.5 text-primary shrink-0" />
                  <a href={`mailto:${contactEmail}`} className="text-foreground hover:text-primary hover:underline transition-colors font-medium">
                    {contactEmail}
                  </a>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground leading-snug">{factoryAddress}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/40 rounded-2xl p-6 md:p-8 space-y-4">
              <h3 className="font-bold text-lg text-foreground">Need a Custom Quotation?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide us with your tech packs, material specifications, and order quantities to receive an estimate within 48 hours.
              </p>
              <div className="pt-2">
                <Link href="/contact" passHref className="block w-full">
                  <Button className="w-full rounded-xl py-5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                    Request Quotation <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
