/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface CategoryV2Props {
  categories: Category[];
}

export default function CategoryV2({ categories }: CategoryV2Props) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="bg-white dark:bg-neutral-950 py-32 px-6 overflow-hidden">
      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center space-y-6 mb-24">
           <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
              <Sparkles className="h-3 w-3 fill-current" /> Curated Collections
           </div>
           <h2 className="text-4xl md:text-7xl font-serif italic tracking-tighter leading-none">
             Seek by Essence
           </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           {categories.slice(0, 8).map((category, i) => (
             <Link 
               key={category._id} 
               href={`/shop?category=${encodeURIComponent(category.slug)}`}
               className="group relative aspect-[4/5] rounded-[3rem] overflow-hidden bg-neutral-100 dark:bg-neutral-900 border-4 border-white dark:border-neutral-900 shadow-2xl transition-all duration-700 hover:-translate-y-4"
             >
                <Image 
                  src={category.image || '/placeholder.png'} 
                  alt={category.name} 
                  fill 
                  className="object-cover transition-transform duration-[2s] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-10 flex flex-col justify-end">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <span className="text-[10px] font-black uppercase tracking-widest text-primary">Explore Series</span>
                         <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">{category.name}</h3>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-primary transition-colors">
                         <ArrowUpRight className="h-6 w-6" />
                      </div>
                   </div>
                </div>
             </Link>
           ))}
        </div>
      </div>
    </section>
  );
}

