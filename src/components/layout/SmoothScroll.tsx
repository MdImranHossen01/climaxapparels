"use client";

import { useEffect } from "react";
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Standard desktop breakpoint
    if (window.innerWidth < 1024) return;

    let lenisInstance: any = null;
    let rafId: number;
    let isCancelled = false;

    // Lazily import Lenis only when desktop breakpoint matches
    import("lenis").then(({ default: Lenis }) => {
      if (isCancelled) return;

      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });
      lenisInstance = lenis;

      function raf(time: number) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);
    });

    // Global fix for nested scrollables (dropdowns, popovers, etc.)
    // Automatically adds data-lenis-prevent to scrollable elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const scrollable = target.closest('.overflow-y-auto, [role="listbox"], [role="dialog"], [role="menu"], .scroll-area');
      if (scrollable && !scrollable.hasAttribute('data-lenis-prevent')) {
        scrollable.setAttribute('data-lenis-prevent', 'true');
      }
    };

    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      isCancelled = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (lenisInstance) {
        lenisInstance.destroy();
      }
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return <>{children}</>;
}

