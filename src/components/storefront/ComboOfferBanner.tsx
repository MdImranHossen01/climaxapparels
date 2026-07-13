'use client';

import { useState, useEffect } from 'react';
import { Ticket, Plus, Wallet, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ComboOfferBannerProps {
  activeCoupon: any;
  settings: any;
  layout?: string;
}

function CountdownUnit({ value, label, layout }: { value: number; label: string; layout?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-14 h-14 ${layout === 'v3' ? 'lg:w-11 lg:h-11' : 'md:w-16 md:h-16'} flex items-center justify-center rounded-xl bg-black/30 border border-white/20 backdrop-blur-sm shadow-inner`}>
        <span className={`text-2xl ${layout === 'v3' ? 'lg:text-lg' : 'md:text-3xl'} font-black tabular-nums leading-none text-white`}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className={`text-[9px] ${layout === 'v3' ? 'lg:text-[8px]' : ''} font-bold uppercase tracking-widest mt-1.5 text-black/60`}>
        {label}
      </span>
    </div>
  );
}

function CountdownSeparator() {
  return (
    <span className="text-2xl font-black text-black/50 pb-4 select-none">:</span>
  );
}

function Countdown({ targetDate, layout }: { targetDate: Date; layout?: string }) {
  const calcTimeLeft = () => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const [time, setTime] = useState(calcTimeLeft);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setTime(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-end gap-1.5">
      {time.days > 0 && (
        <>
          <CountdownUnit value={time.days} label="Days" layout={layout} />
          <CountdownSeparator />
        </>
      )}
      <CountdownUnit value={time.hours} label="Hours" layout={layout} />
      <CountdownSeparator />
      <CountdownUnit value={time.minutes} label="Mins" layout={layout} />
      <CountdownSeparator />
      <CountdownUnit value={time.seconds} label="Secs" layout={layout} />
    </div>
  );
}

export function ComboOfferBanner({ activeCoupon, settings, layout }: ComboOfferBannerProps) {
  if (!activeCoupon) return null;

  const discountText = activeCoupon.discountType === 'percentage'
    ? `${activeCoupon.discountValue}%`
    : `৳${activeCoupon.discountValue}`;

  const expiryDateValue = activeCoupon.expiryDate;
  const isValidDate = !!expiryDateValue && !isNaN(new Date(expiryDateValue).getTime());
  const expiryDate = isValidDate ? new Date(expiryDateValue) : new Date();

  return (
    <section className={`py-12 bg-primary text-black relative overflow-hidden ${layout === 'v3' ? 'lg:rounded-sm lg:py-8' : ''}`}>
      {/* Background texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      {/* Decorative slants */}
      <div className="absolute top-0 right-0 w-32 h-full bg-white/10 -skew-x-12 translate-x-16" />
      <div className="absolute top-0 right-0 w-16 h-full bg-white/5 -skew-x-12 translate-x-8" />

      <div className="container px-4 mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left — Offer text */}
          <div className="flex items-center justify-center sm:justify-start gap-5 flex-1 w-full sm:w-auto">
            <div className={`hidden ${layout === 'v3' ? 'lg:hidden sm:flex' : 'sm:flex'} h-16 w-16 rounded-2xl bg-black/10 border border-black/10 items-center justify-center shrink-0`}>
              <Ticket className="h-8 w-8 text-black" />
            </div>
            <div className="space-y-1 flex flex-col items-center sm:items-start text-center sm:text-left">
              <p className={`text-[10px] ${layout === 'v3' ? 'lg:text-[9px]' : ''} font-black uppercase tracking-[0.25em] text-black/60`}>Limited Time Deal</p>
              <h2 className={`text-3xl ${layout === 'v3' ? 'lg:text-2xl' : 'md:text-4xl'} font-black tracking-tighter uppercase italic leading-none`}>
                Special Offer!
              </h2>
              <p className={`text-base ${layout === 'v3' ? 'lg:text-sm' : ''} font-bold leading-snug mt-1`}>
                Get{' '}
                <span className="underline decoration-black decoration-4">{discountText} OFF</span>{' '}
                using code{' '}
                <span className={`mx-1 ${layout === 'v3' ? 'lg:px-2 lg:py-0.5 lg:text-base' : 'px-3 py-0.5'} bg-black text-white rounded-lg font-mono text-xl align-middle`}>
                  {activeCoupon.code}
                </span>
              </p>
              <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">
                *Stackable with your loyalty tokens for extra savings
              </p>
              <div className="pt-4">
                <Button asChild className={`rounded-full px-8 ${layout === 'v3' ? 'lg:h-10 lg:px-6 lg:text-xs' : 'h-12'} bg-black hover:bg-black/90 text-white font-black shadow-lg`}>
                  <Link href="/shop">
                    SHOP NOW
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Right — Countdown */}
          {isValidDate && (
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-black/60">
                <Clock className="h-3 w-3" />
                Offer ends in
              </div>
              <Countdown targetDate={expiryDate} layout={layout} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

