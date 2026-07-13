/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/storefront/ProductCard';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

interface ProductCarouselSectionProps {
  title: string;
  description?: string;
  products: any[];
  viewAllLink: string;
  isFlashSale?: boolean;
  saleEndTimestamp?: number | string;
  bgColor?: string;
  cardStyle?: string;
  layout?: string;
}

export function ProductCarouselSection({
  title,
  description,
  products,
  viewAllLink,
  isFlashSale = false,
  bgColor = "bg-background",
  cardStyle = 'v1',
  layout
}: ProductCarouselSectionProps) {

  // Initialize Embla Carousel with Autoplay
  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      slidesToScroll: 1,
      dragFree: true,
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  if (!products || products.length === 0) return null;

  return (
    <section className={`py-8 ${bgColor} overflow-hidden`}>
      <div className="container mx-auto px-4 md:px-0">

        {/* Header */}
        <div className="flex flex-row items-center justify-between mb-8 md:mb-10 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl md:text-4xl font-black tracking-tighter text-foreground">
                {title}
              </h2>
              {isFlashSale && (
                <Badge variant="default" className="hidden sm:flex bg-primary text-primary-foreground animate-pulse border-none rounded-full items-center gap-1.5 px-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  LIVE
                </Badge>
              )}
            </div>

          </div>

          <Button asChild variant="default" className="rounded-full font-bold group">
            <Link href={viewAllLink}>
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Embla Carousel Viewport */}
        <div className="relative">
          <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
            <div className="flex -ml-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="flex-[0_0_42%] min-w-0 pl-4 md:flex-[0_0_33.33%] lg:flex-[0_0_25%]"
                >
                  <ProductCard product={product} isFlashSale={isFlashSale} style={cardStyle} layout={layout} />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

