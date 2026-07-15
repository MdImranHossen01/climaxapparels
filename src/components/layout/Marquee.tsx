'use client';

import { useEffect, useState } from 'react';
import FastMarquee from 'react-fast-marquee';

export function Marquee({ marqueeText: initialText }: { marqueeText?: string }) {
  const [marqueeText, setMarqueeText] = useState(initialText || '');

  useEffect(() => {
    if (initialText) return; // Skip fetch if provided as prop

    const controller = new AbortController();

    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings', { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to fetch settings');

        const data = await res.json();
        setMarqueeText(data.marqueeText || 'Welcome to Climax Apparels! Free shipping on orders over $500.');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching marquee text:', error);
          setMarqueeText('Welcome to Climax Apparels! Free shipping on orders over $500.');
        }
      }
    }
    fetchSettings();

    return () => controller.abort();
  }, [initialText]);

  if (!marqueeText) return null;

  return (
    <div className="bg-primary text-black dark:text-neutral-950 py-2 overflow-hidden flex items-center font-semibold">
      <FastMarquee
        gradient={false}
        speed={50}
        pauseOnHover={true}
      >
        <span className="mx-10 font-medium uppercase tracking-wider text-xs sm:text-sm flex items-center">
          {marqueeText}
        </span>
        <span className="mx-10 font-medium uppercase tracking-wider text-xs sm:text-sm flex items-center border-l border-black/25 pl-10">
          {marqueeText}
        </span>
        <span className="mx-10 font-medium uppercase tracking-wider text-xs sm:text-sm flex items-center border-l border-black/25 pl-10">
          {marqueeText}
        </span>
        <span className="mx-10 font-medium uppercase tracking-wider text-xs sm:text-sm flex items-center border-l border-black/25 pl-10">
          {marqueeText}
        </span>
      </FastMarquee>
    </div>
  );
}

