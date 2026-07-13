/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, MoveUpRight } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface CategoryV5Props {
  categories: Category[];
}

export default function CategoryV5({ categories }: CategoryV5Props) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="bg-neutral-50 dark:bg-neutral-950 py-40 px-6 overflow-hidden">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
           <div className="space-y-8">
              <div className="inline-flex items-center gap-3 text-primary font-black uppercase tracking-[0.4em] text-[10px]">
                 <Sparkles className="h-4 w-4 fill-primary" /> Artistic Fluidity
              </div>
              <h2 className="text-6xl md:text-[8rem] font-black tracking-tighter leading-[0.8] uppercase">
                The New <br /> <span className="text-primary italic">Narrative</span>
              </h2>
           </div>
           <div className="relative">
              <p className="text-xl md:text-2xl text-muted-foreground font-medium italic leading-relaxed max-w-lg">
                Breaking traditional boundaries with asymmetric collections designed for the modern explorer.
              </p>
              <div className="absolute -top-20 -right-20 h-64 w-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
           {categories.slice(0, 6).map((category, i) => (
             <Link 
               key={category._id} 
               href={`/shop?category=${encodeURIComponent(category.slug)}`}
               className={`group relative flex flex-col transition-all duration-1000 ${i % 2 === 1 ? 'lg:translate-y-20' : ''}`}
             >
                <div className="relative aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl transition-all duration-[1s] group-hover:rounded-[2rem] group-hover:shadow-primary/20">
                   <Image 
                     src={category.image || '/placeholder.png'} 
                     alt={category.name} 
                     fill 
                     className="object-cover transition-transform duration-[3s] group-hover:scale-110"
                   />
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                   
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700">
                      <div className="h-20 w-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform">
                         <MoveUpRight className="h-8 w-8" />
                      </div>
                   </div>
                </div>

                <div className="pt-10 flex items-end justify-between">
                   <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Discover Module</span>
                      <h3 className="text-4xl font-black uppercase tracking-tighter group-hover:tracking-normal transition-all">{category.name}</h3>
                   </div>
                   <span className="text-5xl font-serif italic text-neutral-200 dark:text-neutral-800">0{(i+1)}</span>
                </div>
             </Link>
           ))}
        </div>
      </div>
    </section>
  );
}

