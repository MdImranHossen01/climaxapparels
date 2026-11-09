"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  
  // Adding spring physics for a more professional "liquid" feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 35,
    restDelta: 0.001,
  });

  // Strictly clamp between 0 and 1 so it never overshoots 100vw and causes a horizontal scrollbar
  const scaleX = useTransform(smoothProgress, (val) => Math.min(1, Math.max(0, val)));

  return (
    <div className="fixed bottom-0 left-0 right-0 h-1.5 z-[9999] pointer-events-none bg-muted/20 overflow-hidden">
      <motion.div
        className="h-full bg-primary origin-left"
        style={{ scaleX }}
      />
    </div>
  );
}
