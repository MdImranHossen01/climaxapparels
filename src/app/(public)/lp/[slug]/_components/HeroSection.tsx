'use client'; 

import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection({ content, styles }: { content: any; styles: any }) {
  const textColor = styles?.textColor || (styles?.backgroundColor === '#111827' ? 'text-white' : 'text-gray-900');
  
  return (
    <div className="container mx-auto px-4 relative overflow-hidden">
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6 md:space-y-8">
        <h1 className={`text-4xl md:text-6xl font-black tracking-tighter leading-tight ${textColor}`}>
          {content.headline}
        </h1>
        <p className={`text-lg md:text-xl opacity-80 max-w-2xl ${textColor}`}>
          {content.subheadline}
        </p>
        <div className="pt-4">
          <Link 
            href={content.ctaLink || '#order'} 
            className="inline-flex items-center justify-center bg-primary text-white h-14 px-10 rounded-full font-black text-lg shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
          >
            {content.ctaText}
          </Link>
        </div>
      </div>
      
      {content.backgroundImage && (
        <div className="mt-12 rounded-3xl overflow-hidden shadow-2xl border-8 border-white/10 relative h-[300px] md:h-[500px]">
           <Image 
             src={content.backgroundImage} 
             alt="Hero" 
             fill
             className="object-cover" 
             priority
           />
        </div>
      )}
    </div>
  );
}
