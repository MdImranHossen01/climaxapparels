/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface CategoryV3Props {
  categories: Category[];
}

export default function CategoryV3({ categories }: CategoryV3Props) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="bg-background py-10 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((category) => (
            <Link 
              key={category._id} 
              href={`/shop?category=${encodeURIComponent(category.slug)}`}
              className="group flex flex-col items-center justify-center p-5 bg-card text-card-foreground rounded-xl border border-border/80 hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <div className="relative w-20 h-20 rounded-full border border-border/60 bg-background flex items-center justify-center overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                {category.image ? (
                  <Image 
                    src={category.image} 
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 80px, 80px"
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="text-muted-foreground font-black text-xs uppercase">
                    {category.name.slice(0, 2)}
                  </div>
                )}
              </div>
              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors text-center line-clamp-1">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

