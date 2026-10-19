'use client';

import { Globe, Truck, ShieldCheck, Headphones, Zap, CreditCard, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Globe,
    title: "Worldwide Shipping",
    desc: "USA, Europe & Worldwide",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: ShieldCheck,
    title: "Premium Quality",
    desc: "Ethically crafted apparel",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: RefreshCcw,
    title: "Easy Returns",
    desc: "30-day hassle-free returns",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    desc: "256-bit SSL encrypted",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Dedicated global service",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: Zap,
    title: "Fast Dispatch",
    desc: "Ships within 24-48 hours",
    color: "bg-primary/10 text-primary"
  }
];

export function FeaturesSection() {
  return (
    <section className="py-12 border-y bg-muted/20">
      <div className="container mx-auto px-4 md:px-0 ">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter">
            Why Shop With <span className="text-primary italic">Climax Apparels</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-8">
          {features.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4 md:p-6 rounded-3xl bg-card border border-border/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group"
            >
              <div className={`p-4 rounded-2xl mb-4 transition-transform group-hover:scale-110 ${item.color}`}>
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm mb-1">{item.title}</h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

