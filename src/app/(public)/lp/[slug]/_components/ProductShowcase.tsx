'use client'; 

import { CheckCircle2, Star } from 'lucide-react';
import Image from 'next/image';

export default function ProductShowcase({ content }: { content: any }) {
  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Product Image */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-2xl group-hover:bg-primary/20 transition-all" />
          <Image 
            src={content.image || '/assets/product-placeholder.webp'} 
            alt={content.title}
            width={600}
            height={600}
            priority
            className="relative w-full h-auto rounded-[2rem] shadow-2xl object-cover"
          />
          {content.price > 0 && content.salePrice && content.salePrice < content.price && (
            <div className="absolute top-6 right-6 bg-red-600 text-white font-black px-6 py-2 rounded-full shadow-xl rotate-3">
              -{Math.round(((content.price - content.salePrice) / content.price) * 100)}% OFF
            </div>
          )}
          {content.price > 0 && content.salePrice && content.salePrice >= content.price && (
             <div className="absolute top-6 right-6 bg-emerald-600 text-white font-black px-6 py-2 rounded-full shadow-xl rotate-3">
               SALE
             </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-1 text-orange-500">
               {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
               <span className="text-xs font-bold text-muted-foreground ml-2">(4.9/5 Based on 120+ Reviews)</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight text-gray-900">
              {content.title}
            </h2>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-primary">৳{content.salePrice || content.price}</span>
              {content.salePrice && content.salePrice < content.price && (
                <span className="text-2xl text-muted-foreground line-through opacity-50 font-bold">৳{content.price}</span>
              )}
            </div>
          </div>

          <p className="text-lg text-gray-600 leading-relaxed">
            {content.description}
          </p>

          {Array.isArray(content.benefits) && content.benefits.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {content.benefits.map((benefit: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border-2 border-transparent hover:border-primary/20 transition-all">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-sm text-gray-800">{benefit}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4">
             <a 
               href="#order" 
               className="inline-flex items-center justify-center w-full md:w-auto bg-gray-900 text-white h-14 px-12 rounded-2xl font-black text-lg hover:bg-primary transition-colors shadow-lg"
             >
               Buy Now
             </a>
          </div>
        </div>
      </div>
    </div>
  );
}
