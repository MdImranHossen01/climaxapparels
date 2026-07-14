'use client';

import React, { useEffect, useState, useRef } from 'react';

interface StatItem {
  value: string;
  label: string;
}

const stats: StatItem[] = [
  { value: '12+', label: 'Years of Apparel Excellence' },
  { value: '500000+', label: 'Pcs Production / Month' },
  { value: '2+', label: 'Key Compliance Certifications' },
  { value: '4+', label: 'Export Markets Worldwide' },
];

function AnimatedCounter({ value }: { value: string }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const target = parseInt(value.replace(/[^0-9]/g, ''), 10);
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    let observer: IntersectionObserver;
    let animationFrameId: number;

    const startAnimation = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      const duration = 1500; // 1.5s
      const startTime = performance.now();

      const updateCount = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        // Ease out quad
        const easeProgress = progress * (2 - progress);
        setCount(Math.floor(easeProgress * target));

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(updateCount);
        } else {
          setCount(target);
        }
      };

      animationFrameId = requestAnimationFrame(updateCount);
    };

    if (elementRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            startAnimation();
          } else {
            setCount(0);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(elementRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [target]);

  // Format count with commas for large numbers (e.g. 500,000)
  const formatNumber = (num: number) => {
    if (num >= 100000) {
      return num.toLocaleString();
    }
    return num.toString();
  };

  return (
    <span ref={elementRef}>
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

export function CounterSection() {
  return (
    <section className="py-12 bg-primary text-primary-foreground border-b border-primary/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <div key={i} className="p-4 space-y-1">
              <p className="text-4xl md:text-5xl font-black tracking-tight">
                <AnimatedCounter value={s.value} />
              </p>
              <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-primary-foreground/80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
