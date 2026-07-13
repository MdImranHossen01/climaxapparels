'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
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

interface HeroV4Props {
  banners: Banner[];
}

const AUTOPLAY_DELAY = 5000;

export default function HeroV4({ banners }: HeroV4Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  // ── Desktop: main left slider ──────────────────────────────────────
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 35 },
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

  // ── Mobile: full-width slider (same as HeroV1) ─────────────────────
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const [mobileEmblaRef, mobileEmblaApi] = useEmblaCarousel(
    { loop: true, duration: 30 },
    [Autoplay({ delay: AUTOPLAY_DELAY, stopOnInteraction: false })]
  );

  const onMobileSelect = useCallback(() => {
    if (!mobileEmblaApi) return;
    setMobileActiveIndex(mobileEmblaApi.selectedScrollSnap());
  }, [mobileEmblaApi]);

  useEffect(() => {
    if (!mobileEmblaApi) return;
    onMobileSelect();
    mobileEmblaApi.on('select', onMobileSelect);
    mobileEmblaApi.on('reInit', onMobileSelect);
    return () => {
      mobileEmblaApi.off('select', onMobileSelect);
      mobileEmblaApi.off('reInit', onMobileSelect);
    };
  }, [mobileEmblaApi, onMobileSelect]);

  const mobileScrollPrev = useCallback(() => {
    if (mobileEmblaApi) mobileEmblaApi.scrollPrev();
  }, [mobileEmblaApi]);

  const mobileScrollNext = useCallback(() => {
    if (mobileEmblaApi) mobileEmblaApi.scrollNext();
  }, [mobileEmblaApi]);

  const mobileScrollTo = useCallback((index: number) => {
    if (mobileEmblaApi) mobileEmblaApi.scrollTo(index);
  }, [mobileEmblaApi]);

  // ── Data ───────────────────────────────────────────────────────────
  const slides = banners && banners.length > 0 ? banners : [
    { image: '/assets/images/Banner/fashion.webp', link: '/shop?category=fashion' }
  ];

  const totalBanners = slides.length;

  const rightBanners = [
    slides[(activeIndex + 1) % totalBanners],
    slides[(activeIndex + 2) % totalBanners],
    slides[(activeIndex + 3) % totalBanners],
  ];

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════
          MOBILE — HeroV1-style full-width slider (hidden on lg+)
      ══════════════════════════════════════════════════════════════ */}
      <section className="lg:hidden relative w-full h-[210px] sm:h-[480px] overflow-hidden bg-transparent group/slider text-white">
        {/* Embla Viewport */}
        <div className="h-full w-full overflow-hidden" ref={mobileEmblaRef}>
          <div className="flex h-full w-full">
            {slides.map((banner, index) => {
              const primaryHref = banner.primaryBtnLink || banner.link || '/shop';
              const primaryText = banner.primaryBtnText || 'Shop Now';
              const secondaryHref = banner.secondaryBtnLink || '/categories';
              const secondaryText = banner.secondaryBtnText;
              const isActive = index === mobileActiveIndex;

              return (
                <div key={banner._id || index} className="relative flex-[0_0_100%] min-w-0 h-full overflow-hidden">
                  {/* Ken Burns zooming background */}
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={banner.image || '/placeholder-banner.jpg'}
                      alt={banner.title || 'Hero Banner'}
                      fill
                      className={`object-cover object-top transition-transform duration-[8000ms] ease-linear ${isActive ? 'scale-110' : 'scale-100'}`}
                      priority={index === 0}
                      fetchPriority={index === 0 ? 'high' : undefined}
                      sizes="100vw"
                    />
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

                  {/* Content */}
                  <div className="absolute inset-0 flex items-end pb-10 z-20 px-4">
                    <div className="w-full max-w-[95%] flex flex-col items-start text-left">
                      <AnimatePresence mode="wait">
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <motion.h1
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
                              className="text-base font-black text-white leading-[1.1] tracking-tight mb-3 drop-shadow-2xl"
                            >
                              {banner.title}
                            </motion.h1>

                            {banner.subtitle && (
                              <motion.p
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.45, ease: 'easeOut' }}
                                className="text-[9px] text-white/80 max-w-[180px] mb-3 leading-snug drop-shadow-sm"
                              >
                                {banner.subtitle}
                              </motion.p>
                            )}

                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.7, delay: 0.6, ease: 'easeOut' }}
                              className="flex flex-wrap items-center gap-1.5"
                            >
                              <Link
                                href={primaryHref}
                                className="flex items-center gap-1 px-3 py-1 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all text-[8px] shadow-2xl"
                              >
                                <span>{primaryText}</span>
                                <ArrowRight className="w-2 h-2" />
                              </Link>

                              {secondaryText && (
                                <Link
                                  href={secondaryHref}
                                  className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-full hover:bg-white/20 transition-all text-[8px] shadow-sm"
                                >
                                  {secondaryText}
                                </Link>
                              )}
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prev / Next buttons */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={mobileScrollPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white opacity-0 group-hover/slider:opacity-100 hover:bg-primary hover:text-white transition-all cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={mobileScrollNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white opacity-0 group-hover/slider:opacity-100 hover:bg-primary hover:text-white transition-all cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] z-40 bg-white/5">
              <motion.div
                key={mobileActiveIndex}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: AUTOPLAY_DELAY / 1000, ease: 'linear' }}
                className="h-full bg-primary"
              />
            </div>
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════
          DESKTOP — original HeroV4 layout (hidden below lg)
      ══════════════════════════════════════════════════════════════ */}
      <section className="hidden lg:block w-full px-4 py-4 animate-in fade-in duration-1000">
        <div className="grid grid-cols-4 gap-4 items-stretch">

          {/* Left Column: Main Slider */}
          <div className="col-span-3">
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden group border border-border shadow-lg">
              <div className="h-full w-full overflow-hidden" ref={emblaRef}>
                <div className="flex h-full w-full">
                  {slides.map((banner, index) => {
                    const targetLink = banner.primaryBtnLink || banner.link || '/shop';
                    return (
                      <Link
                        key={banner._id || index}
                        href={targetLink}
                        className="relative flex-[0_0_100%] min-w-0 h-full w-full cursor-pointer block overflow-hidden"
                      >
                        <Image
                          src={banner.image || '/placeholder-banner.jpg'}
                          alt={banner.title || 'Hero Banner'}
                          fill
                          className="object-cover transition-transform duration-1000 group-hover:scale-105"
                          priority={index === 0}
                          fetchPriority={index === 0 ? 'high' : undefined}
                          sizes="75vw"
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Pagination Dots */}
              {slides.length > 1 && (
                <div className="absolute bottom-4 left-0 w-full z-20 flex justify-center gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => emblaApi && emblaApi.scrollTo(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === activeIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: 3 cards stacked vertically */}
          <div className="col-span-1 flex flex-col gap-4 justify-between">
            {rightBanners.map((banner, i) => {
              const targetLink = banner.primaryBtnLink || banner.link || '/shop';
              return (
                <Link
                  key={i}
                  href={targetLink}
                  className="relative flex-1 rounded-2xl overflow-hidden group border border-border shadow-md block"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={banner.image || i}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -40 }}
                      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                      className="absolute inset-0 w-full h-full"
                    >
                      <Image
                        src={banner.image || '/placeholder-banner.jpg'}
                        alt={banner.title || 'Side Banner'}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="25vw"
                      />
                    </motion.div>
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>

        </div>
      </section>
    </>
  );
}
