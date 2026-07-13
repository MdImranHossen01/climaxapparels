/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface CategoryV4Props {
  categories: Category[];
}

export default function CategoryV4({ categories }: CategoryV4Props) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="bg-white dark:bg-black py-32 px-6">
      <div className="container mx-auto">
        <div className="text-center space-y-4 mb-24">
           <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary">The Boutique Selection</span>
           <h2 className="text-5xl md:text-8xl font-serif italic tracking-tighter leading-tight">
             Showcase of Distinction
           </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-16 lg:gap-24">
           {categories.slice(0, 6).map((category) => (
             <Link 
               key={category._id} 
               href={`/shop?category=${encodeURIComponent(category.slug)}`}
               className="group flex flex-col items-center text-center space-y-8"
             >
                <div className="relative h-48 w-48 md:h-64 md:w-64 rounded-full p-2 border-2 border-dashed border-neutral-200 dark:border-neutral-800 group-hover:border-primary transition-all duration-700">
                   <div className="relative h-full w-full rounded-full overflow-hidden shadow-2xl">
                      <Image 
                        src={category.image || '/placeholder.png'} 
                        alt={category.name} 
                        fill 
                        className="object-cover transition-transform duration-[2s] group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                   </div>
                   
                   {/* Badge Element */}
                   <div className="absolute -top-4 -right-4 h-12 w-12 bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center shadow-xl border border-neutral-100 dark:border-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <Star className="h-5 w-5 text-primary fill-primary" />
                   </div>
                </div>

                <div className="space-y-2">
                   <h3 className="text-2xl font-serif italic tracking-tight">{category.name}</h3>
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground group-hover:text-primary transition-colors">Examine Series</span>
                </div>
             </Link>
           ))}
        </div>
      </div>
    </section>
  );
}

