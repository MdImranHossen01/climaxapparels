/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, Sparkles, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroV5Props {
   banners: any[];
}

export default function HeroV5({ banners }: HeroV5Props) {
   const banner = banners?.[0] || {
      title: 'Pure Intentions',
      subtitle: 'THE ART OF MINIMALIST COMMERCE',
      image: '/placeholder.png'
   };

   return (
      <section className="relative min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center pt-40 pb-20 px-4 overflow-hidden">
         {/* Immersive Background Typography */}
         <div className="absolute top-1/4 left-0 w-full text-center text-[30vw] font-black text-neutral-100 dark:text-neutral-900/40 leading-none select-none pointer-events-none uppercase tracking-tighter opacity-50 z-0">
            {banner?.title?.split(' ')[0] ?? 'LUXE'}
         </div>

         <div className="container mx-auto max-w-6xl relative z-10 space-y-20">
            {/* Storytelling Header */}
            <div className="text-center space-y-8 animate-in fade-in slide-in-from-top duration-1000">
               <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-white dark:bg-neutral-900 rounded-[2rem] flex items-center justify-center shadow-xl shadow-black/5 rotate-12 hover:rotate-0 transition-transform duration-700">
                     <Sparkles className="h-6 w-6 text-primary" />
                  </div>
               </div>

               <h1 className="text-7xl md:text-[10rem] font-serif italic tracking-tighter leading-[0.8] animate-in fade-in slide-in-from-top duration-1000 delay-200">
                  {banner?.title ?? 'Elevated Artistry'}
               </h1>

               <div className="flex flex-col items-center gap-4">
                  <div className="h-[1px] w-32 bg-primary/30" />
                  <p className="text-[10px] md:text-xs text-neutral-500 font-black tracking-[0.6em] uppercase animate-in fade-in slide-in-from-top duration-1000 delay-400">
                     {banner?.subtitle ?? 'CURATED SELECTIONS'}
                  </p>
               </div>
            </div>

            {/* Floating Centerpiece */}
            <div className="relative group perspective-1000">
               <div className="relative aspect-[16/8] w-full rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in duration-[1.5s] delay-500 rotate-x-2 transition-all duration-[2s] border-8 border-white dark:border-neutral-900">
                  <Image
                     src={banner?.image || '/placeholder.png'}
                     alt={banner?.title || 'Boutique Banner'}
                     fill
                     priority
                     fetchPriority="high"
                     className="object-cover transition-transform duration-[4s] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                  {/* Quick Action Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-black/10 backdrop-blur-[2px]">
                     <Link href="/shop">
                        <Button className="h-20 px-12 rounded-full bg-white text-black hover:bg-primary hover:text-white font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all duration-500">
                           Enter Atelier
                        </Button>
                     </Link>
                  </div>
               </div>

               {/* Artistic Floating Element */}
               <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-primary rounded-[2rem] flex flex-col items-center justify-center text-white p-4 shadow-2xl animate-float">
                  <span className="text-[8px] font-black uppercase tracking-widest text-center">New Narrative</span>
                  <MoveRight className="h-6 w-6 mt-2" />
               </div>
            </div>

            {/* Navigation Seed */}
            <div className="hidden sm:flex flex-col items-center pt-10">
               <button
                  className="flex flex-col items-center gap-6 group transition-all duration-700 hover:scale-110"
                  onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
               >
                  <div className="relative h-20 w-20 flex items-center justify-center">
                     <div className="absolute inset-0 rounded-full border border-primary/20 group-hover:border-primary/60 transition-all duration-700 animate-ping" />
                     <div className="absolute inset-2 rounded-full border border-primary/40 group-hover:border-primary transition-all duration-700" />
                     <ArrowDown className="h-6 w-6 text-primary transition-all duration-700 group-hover:translate-y-2" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[1em] text-neutral-400 group-hover:text-primary transition-all duration-700">Explore_Atelier</span>
               </button>
            </div>
         </div>

         {/* Vertical Aesthetic Tag */}
         <div className="absolute right-12 top-1/2 -translate-y-1/2 rotate-180 [writing-mode:vertical-rl] text-[9px] font-black tracking-[0.6em] text-neutral-300 uppercase select-none pointer-events-none hidden xl:block">
            DESIGNED FOR DISCOVERY • Climax Apparels.2026
         </div>

         <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s infinite ease-in-out;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .rotate-x-2:hover {
          transform: rotateX(2deg);
        }
      `}</style>
      </section>
   );
}

