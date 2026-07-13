'use client';

import { useState, useEffect } from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from './ProductCard';
import Link from 'next/link';

interface FlashSaleProps {
  products: any[];
  saleEndTimestamp?: number | string;
}

export function FlashSale({ products, saleEndTimestamp }: FlashSaleProps) {
  const calculateTimeLeft = () => {
    let target: number;
    
    if (saleEndTimestamp) {
      target = typeof saleEndTimestamp === 'string' ? new Date(saleEndTimestamp).getTime() : saleEndTimestamp;
    } else {
      // Default to end of current day (client-side timezone)
      target = new Date().setHours(23, 59, 59, 999);
    }

    const difference = target - Date.now();
    
    if (difference <= 0) return { hours: 0, minutes: 0, seconds: 0 };
    
    return {
      hours: Math.floor((difference / (1000 * 60 * 60))),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  };

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <section className="py-16 bg-primary/5">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-2xl animate-pulse">
                <Zap className="h-6 w-6 fill-current" />
            </div>
            <div>
                <h2 className="text-3xl font-black tracking-tight">Flash Sale</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Ending In:</span>
                    <div className="flex gap-1 text-primary font-mono font-bold font-black tabular-nums" suppressHydrationWarning>
                        <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
                        <span>:</span>
                        <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
                        <span>:</span>
                        <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
                    </div>
                </div>
            </div>
          </div>
          <Link href="/shop?filter=sale">
            <Button variant="outline" className="rounded-full font-bold group">
                View All Deals <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

