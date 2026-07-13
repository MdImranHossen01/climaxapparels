'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface CategoryShowcaseProps {
  categories: Category[];
}

function CategoryItem({ category }: { category: Category }) {
  return (
    <Link
      href={`/shop?category=${encodeURIComponent(category.slug)}`}
      className="group block"
    >
      <div className="flex flex-col items-center gap-3 py-2 transition-all hover:-translate-y-1">
        <div className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 overflow-hidden rounded-full bg-background border border-muted shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Plus className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <h3 className="font-semibold text-xs sm:text-sm group-hover:text-primary transition-colors text-center line-clamp-2">
          {category.name}
        </h3>
      </div>
    </Link>
  );
}

export default function CategoryV1({ categories }: CategoryShowcaseProps) {
  // ── Mobile carousel state ──────────────────────────────────────────
  const [mobileIndex, setMobileIndex] = useState(0);
  const [mobileSnaps, setMobileSnaps] = useState<number[]>([]);
  const [mobileRef, mobileApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 'auto' },
    [Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const onMobileSelect = useCallback(() => {
    if (!mobileApi) return;
    setMobileIndex(mobileApi.selectedScrollSnap());
  }, [mobileApi]);

  useEffect(() => {
    if (!mobileApi) return;
    onMobileSelect();
    setMobileSnaps(mobileApi.scrollSnapList());
    mobileApi.on('select', onMobileSelect);
    mobileApi.on('reInit', onMobileSelect);
    return () => {
      mobileApi.off('select', onMobileSelect);
      mobileApi.off('reInit', onMobileSelect);
    };
  }, [mobileApi, onMobileSelect]);

  // ── Desktop carousel state (only used when >6 categories) ─────────
  const [desktopIndex, setDesktopIndex] = useState(0);
  const [desktopSnaps, setDesktopSnaps] = useState<number[]>([]);
  const [desktopRef, desktopApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 'auto' },
    [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const onDesktopSelect = useCallback(() => {
    if (!desktopApi) return;
    setDesktopIndex(desktopApi.selectedScrollSnap());
  }, [desktopApi]);

  useEffect(() => {
    if (!desktopApi) return;
    onDesktopSelect();
    setDesktopSnaps(desktopApi.scrollSnapList());
    desktopApi.on('select', onDesktopSelect);
    desktopApi.on('reInit', onDesktopSelect);
    return () => {
      desktopApi.off('select', onDesktopSelect);
      desktopApi.off('reInit', onDesktopSelect);
    };
  }, [desktopApi, onDesktopSelect]);

  if (!categories || categories.length === 0) return null;

  const manyCategories = categories.length > 6;

  return (
    <section className="bg-muted/30 py-6 md:py-12 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col items-center justify-center text-center space-y-2 mb-5 md:space-y-4 md:mb-10">
          <h2 className="text-2xl font-bold tracking-tighter md:text-4xl text-foreground">
            Browse by Category
          </h2>
        </div>

        {/* ── Mobile: horizontal scroll carousel ──────────────────────── */}
        <div className="md:hidden overflow-hidden">
          <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={mobileRef}>
            <div className="flex -ml-3">
              {categories.map((category) => (
                <div key={category._id} className="flex-[0_0_33.333%] min-w-0 pl-3 shrink-0">
                  <CategoryItem category={category} />
                </div>
              ))}
            </div>
          </div>
          {mobileSnaps.length > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              {mobileSnaps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => mobileApi?.scrollTo(index)}
                  className={`transition-all duration-300 cursor-pointer rounded-full h-1.5 ${
                    index === mobileIndex
                      ? 'w-6 bg-primary'
                      : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to group ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Desktop: centered static (≤6) or Embla carousel (>6) ───── */}
        <div className="hidden md:block">
          {!manyCategories ? (
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-0">
              {categories.map((category) => (
                <div key={category._id} className="w-[16%] lg:w-[13%]">
                  <CategoryItem category={category} />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={desktopRef}>
                <div className="flex -ml-4">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      className="flex-[0_0_25%] min-w-0 pl-4 lg:flex-[0_0_16.66%] xl:flex-[0_0_14.28%]"
                    >
                      <CategoryItem category={category} />
                    </div>
                  ))}
                </div>
              </div>
              {desktopSnaps.length > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  {desktopSnaps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => desktopApi?.scrollTo(index)}
                      className={`transition-all duration-300 cursor-pointer rounded-full h-1.5 ${
                        index === desktopIndex
                          ? 'w-8 bg-primary'
                          : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      aria-label={`Go to group ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
