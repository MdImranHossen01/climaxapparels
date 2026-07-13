'use client';

import { Truck, Zap, Info } from 'lucide-react';

interface FreeDeliveryBannerProps {
  settings: any;
}

export function FreeDeliveryBanner({ settings }: FreeDeliveryBannerProps) {
  const threshold = settings?.freeDeliveryThreshold || 0;

  if (threshold <= 0) return null;

  return (
    <div className="bg-primary text-black py-3 relative overflow-hidden">
      {/* Moving Text Marquee Effect (Optional Style) */}
      <div className="container px-4 flex items-center justify-center gap-4 relative z-10">
        <Truck className="h-5 w-5 animate-bounce" />
        <p className="text-sm md:text-base font-black uppercase tracking-wider text-center">
          Free Shipping Alert! <span className="hidden md:inline mx-2">|</span> 
          Get <span className="bg-black text-white px-2 py-0.5 rounded">FREE DELIVERY</span> 
          on all orders over <span className="underline decoration-2">৳{threshold}</span>
        </p>
        <Zap className="h-5 w-5 fill-current" />
      </div>
      
      {/* Decorative pulse background */}
      <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
    </div>
  );
}

