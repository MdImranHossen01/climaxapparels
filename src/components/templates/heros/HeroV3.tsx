/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroV3Props {
   banners: any[];
   onPlay?: () => void;
}

export default function HeroV3({ banners, onPlay }: HeroV3Props) {
   const sectionRef = useRef<HTMLElement>(null);

   const banner = banners?.[0] || {
      title: 'Defining the Horizon',
      subtitle: 'A NEW ERA OF CURATED EXCELLENCE',
      image: '/placeholder.png'
   };

   const handleScroll = () => {
      const nextSection = sectionRef.current?.nextElementSibling;
      if (nextSection) {
         nextSection.scrollIntoView({ behavior: 'smooth' });
      }
   };

   return (
      <section
         ref={sectionRef}
         className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden bg-transparent"
      >
         {/* Immersive Parallax Background */}
         <div className="absolute inset-0 z-0">
            <Image
               src={banner.image || '/placeholder.png'}
               alt="Hero Background"
               fill
               priority
               fetchPriority="high"
               className="object-cover scale-110 opacity-60 transition-transform duration-[10s] hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
         </div>

         {/* Cinematic Center Content */}
         <div className="relative z-10 container mx-auto px-4 text-center space-y-12 max-w-5xl">

            <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
               <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 text-white/60 text-[9px] font-black uppercase tracking-[0.5em]">
                  <Sparkles className="h-3 w-3 fill-primary text-primary" /> Established Horizon
               </div>

               <h1 className="text-6xl md:text-9xl font-serif italic text-white tracking-tighter leading-none px-4">
                  {banner.title}
               </h1>

               <div className="h-[1px] w-24 bg-primary/50" />

               <p className="text-white/60 text-xs md:text-sm font-black uppercase tracking-[0.6em] max-w-2xl leading-relaxed">
                  {banner.subtitle}
               </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-10 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-500">
               {onPlay && (
                  <button
                     onClick={onPlay}
                     className="group flex items-center gap-4 text-white hover:text-primary transition-all"
                  >
                     <div className="h-16 w-16 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center border border-white/20 group-hover:bg-primary group-hover:border-primary transition-all shadow-2xl">
                        <Play className="h-6 w-6 fill-current ml-1" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.3em]">Watch Film</span>
                  </button>
               )}

               <div className="flex gap-4">
                  <Link href="/shop">
                     <Button className="h-16 px-12 rounded-full bg-white text-black hover:bg-primary hover:text-white font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl">
                        Explore Selection
                     </Button>
                  </Link>
                  <Link href="/categories">
                     <Button variant="ghost" className="h-16 px-12 rounded-full border border-white/20 text-white hover:bg-white hover:text-black font-black text-xs uppercase tracking-[0.3em] transition-all duration-500">
                        Categories
                     </Button>
                  </Link>
               </div>
            </div>
         </div>

         {/* Elegant Scroll Hint */}
         <button
            onClick={handleScroll}
            aria-label="Scroll to content"
            className="absolute bottom-12 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-4 text-white/30 hover:text-primary transition-all group"
         >
            <span className="text-[9px] font-black uppercase tracking-[0.5em] vertical-rl h-16 w-[1px] bg-white/20 relative overflow-hidden">
               <span className="absolute top-0 left-0 w-full h-1/2 bg-primary animate-scroll-indicator" />
            </span>
            <ChevronDown className="h-6 w-6 group-hover:translate-y-2 transition-transform" />
         </button>

         <style jsx>{`
        @keyframes scroll-indicator {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        .animate-scroll-indicator {
          animation: scroll-indicator 3s infinite ease-in-out;
        }
      `}</style>
      </section>
   );
}

