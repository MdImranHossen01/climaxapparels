'use client';

import { Star } from 'lucide-react';
import Image from 'next/image';
 
export default function TestimonialsSection({ content }: { content: any }) {
  return (
    <div className="container mx-auto px-4 max-w-5xl text-center">
      <h2 className="text-3xl font-black mb-12">{content.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {(content.reviews || []).map((r: any, idx: number) => (
          <div 
            key={idx} 
            className="p-6 md:p-8 bg-white rounded-[2rem] text-left border-2 border-gray-100/80 shadow-sm hover:shadow-xl hover:border-primary/10 transition-all flex flex-col justify-between relative"
          >
            <span className="text-6xl text-primary/10 absolute top-4 right-6 font-serif select-none pointer-events-none">“</span>
            
            <div className="space-y-4">
              {/* Star Rating */}
              <div className="flex gap-1 text-orange-400">
                {Array.from({ length: r.rating || 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>

              <p className="text-gray-700 text-sm leading-relaxed italic relative z-10">
                "{r.content}"
              </p>
            </div>

            <div className="flex items-center gap-3 mt-6">
              {r.avatar ? (
                <Image 
                  src={r.avatar} 
                  alt={r.name} 
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover border-2 border-primary/10" 
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-base border-2 border-primary/5">
                  {r.name?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <div className="font-bold text-sm text-gray-900">{r.name}</div>
                {r.role && <div className="text-xs text-muted-foreground font-semibold">{r.role}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
