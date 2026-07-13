'use client';

// Loyalty promotion banner component for home page
import { Sparkles, Trophy, Wallet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface LoyaltyBannerProps {
  settings: any;
  layout?: string;
}

export function LoyaltyBanner({ settings, layout }: LoyaltyBannerProps) {
  const threshold = settings?.subscriptionConfig?.activationThreshold || 5000;
  const percentage = settings?.subscriptionConfig?.rewardPercentage || 5;

  return (
    <section className={`py-16 bg-zinc-950 border-y border-white/[0.05] text-white overflow-hidden relative ${layout === 'v3' ? 'lg:rounded-sm lg:py-10' : ''}`}>
      <div className="container px-4 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-widest w-fit">
              <Sparkles className="h-3 w-3" />
              Lifetime Rewards
            </div>
            <h2 className={`text-2xl sm:text-3xl ${layout === 'v3' ? 'lg:text-3xl' : 'md:text-5xl'} font-black tracking-tight md:tracking-tighter leading-tight md:leading-none break-words`}>
              JOIN THE <span className="text-primary">Climax Apparels</span> <br />
              LOYALTY CLUB
            </h2>
            <p className={`text-gray-400 ${layout === 'v3' ? 'lg:text-sm' : 'text-lg'} max-w-md`}>
              Unlock exclusive lifetime benefits. Spend <span className="text-white font-bold">৳{threshold}</span> once and earn <span className="text-primary font-bold">{percentage}% tokens</span> on every future purchase!
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild className={`rounded-full px-8 ${layout === 'v3' ? 'lg:h-10 lg:px-6 lg:text-xs' : 'h-12'} bg-primary hover:bg-primary/90 text-black font-black`}>
                <Link href="/shop">
                  SHOP & ACTIVATE NOW
                </Link>
              </Button>
              <Button asChild className={`rounded-full px-8 ${layout === 'v3' ? 'lg:h-10 lg:px-6 lg:text-xs' : 'h-12'} bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-bold transition-colors`}>
                <Link href="/register">
                  CREATE ACCOUNT
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className={`p-6 ${layout === 'v3' ? 'lg:p-4 lg:rounded-xl' : 'rounded-2xl'} bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group`}>
              <div className={`h-12 w-12 ${layout === 'v3' ? 'lg:h-10 lg:w-10 lg:rounded-lg' : 'rounded-xl'} bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Trophy className={`h-6 w-6 ${layout === 'v3' ? 'lg:h-5 lg:w-5' : ''} text-primary`} />
              </div>
              <h3 className={`font-bold ${layout === 'v3' ? 'lg:text-sm lg:mb-0.5' : 'mb-1'}`}>Activate</h3>
              <p className="text-xs text-neutral-400">Buy products worth ৳{threshold} in a single order.</p>
            </div>

            <div className={`p-6 ${layout === 'v3' ? 'lg:p-4 lg:rounded-xl' : 'rounded-2xl'} bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group`}>
              <div className={`h-12 w-12 ${layout === 'v3' ? 'lg:h-10 lg:w-10 lg:rounded-lg' : 'rounded-xl'} bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Wallet className={`h-6 w-6 ${layout === 'v3' ? 'lg:h-5 lg:w-5' : ''} text-primary`} />
              </div>
              <h3 className={`font-bold ${layout === 'v3' ? 'lg:text-sm lg:mb-0.5' : 'mb-1'}`}>Earn Tokens</h3>
              <p className="text-xs text-neutral-400">Get {percentage}% back as tokens on every future order.</p>
            </div>

            <div className={`p-6 ${layout === 'v3' ? 'lg:p-4 lg:rounded-xl' : 'rounded-2xl'} bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group`}>
              <div className={`h-12 w-12 ${layout === 'v3' ? 'lg:h-10 lg:w-10 lg:rounded-lg' : 'rounded-xl'} bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <ArrowRight className={`h-6 w-6 ${layout === 'v3' ? 'lg:h-5 lg:w-5' : ''} text-primary`} />
              </div>
              <h3 className={`font-bold ${layout === 'v3' ? 'lg:text-sm lg:mb-0.5' : 'mb-1'}`}>Save Big</h3>
              <p className="text-xs text-neutral-400">Use tokens for instant discounts on your next checkout.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


