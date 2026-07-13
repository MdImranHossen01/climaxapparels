/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

interface Banner {
  _id?: string;
  title?: string;
  subtitle?: string;
  image?: string;
  link?: string;
  primaryBtnText?: string;
  primaryBtnLink?: string;
  secondaryBtnText?: string;
  secondaryBtnLink?: string;
}

interface HeroSliderProps {
  banners: Banner[];
}

const AUTOPLAY_DELAY = 6000;

export default function HeroV2({ banners }: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = banners && banners.length > 0 ? banners : [];

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      duration: 0,
      watchDrag: false
    },
    [Autoplay({ delay: AUTOPLAY_DELAY, stopOnInteraction: false })]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = (index: number) => emblaApi?.scrollTo(index);
  const scrollNext = () => emblaApi?.scrollNext();

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full aspect-video md:aspect-auto md:h-[600px] lg:h-screen overflow-hidden bg-transparent font-jost">
      {/* Logic Layer (Hidden Embla) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-0" ref={emblaRef}>
        <div className="flex h-full w-full">
          {slides.map((_, i) => <div key={i} className="flex-[0_0_100%] min-w-0 h-full" />)}
        </div>
      </div>

      {/* Visual Layer (Cross-Fade + Zoom) */}
      <div
        className="relative h-full w-full cursor-pointer"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a')) return;
          scrollNext();
        }}
      >
        <AnimatePresence initial={false}>
          {slides.map((banner, index) => index === activeIndex && (
            <motion.div
              key={banner._id || index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 flex items-end overflow-hidden"
            >
              {/* Background with Optimized Smooth Zoom */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.1 }}
                  transition={{ duration: 8, ease: "linear" }}
                  className="h-full w-full relative z-0"
                >
                  <Image
                    src={banner.image || '/placeholder-banner.jpg'}
                    alt={banner.title || 'Hero Banner'}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    fetchPriority={index === 0 ? "high" : undefined}
                    sizes="100vw"
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 z-10" />
              </div>

              {/* Text Content */}
              <div className="container relative z-20 mx-auto px-6 sm:px-12 md:px-20 lg:px-32 h-full flex items-end">
                <div className="max-w-[60%] sm:max-w-3xl w-full flex flex-col pb-10 sm:pb-16 lg:pb-24 text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    <h1 className="text-[18px] sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tighter mb-6 sm:mb-8 drop-shadow-2xl uppercase">
                      {banner.title}
                    </h1>

                    <div className="flex flex-row items-center justify-start gap-2 sm:gap-6">
                      <Link
                        href={banner.primaryBtnLink || banner.link || '/shop'}
                        className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-12 sm:py-5 bg-primary text-white font-black rounded-full hover:bg-white hover:text-black transition-all text-[8px] sm:text-base uppercase tracking-widest shadow-2xl"
                      >
                        {banner.primaryBtnText || 'Shop Now'}
                        <ArrowRight className="h-3 w-3 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-2" />
                      </Link>

                      {banner.secondaryBtnText && (
                        <Link
                          href={banner.secondaryBtnLink || '/contact'}
                          className="inline-flex items-center px-3.5 py-1.5 sm:px-12 sm:py-5 bg-white/10 backdrop-blur-md border border-white/30 text-white font-black rounded-full hover:bg-white hover:text-black transition-all text-[8px] sm:text-base uppercase tracking-widest"
                        >
                          {banner.secondaryBtnText}
                        </Link>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Center Animated Scroll Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-30 hidden sm:flex flex-col items-center gap-1 sm:gap-2 text-white/50"
      >
        <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">Explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4 sm:h-6" />
        </motion.div>
      </motion.div>

      {/* Pagination Dots — bottom right for all devices */}
      <div className="absolute bottom-8 right-6 sm:bottom-12 sm:right-12 z-30 hidden sm:flex flex-row items-center gap-1">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className="transition-all duration-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
            aria-label={`Go to slide ${i + 1}`}
          >
            <span
              className={`transition-all duration-300 rounded-full ${i === activeIndex
                  ? "w-8 h-1 sm:w-8 sm:h-1.5 bg-primary shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                  : "w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/30"
                }`}
            />
          </button>
        ))}
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/10 z-40">
        <motion.div
          key={activeIndex}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: AUTOPLAY_DELAY / 1000, ease: "linear" }}
          className="h-full bg-primary shadow-[0_0_10px_#ff0000]"
        />
      </div>
    </section>
  );
}
