"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  
  // Adding spring physics for a more professional "liquid" feel
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 h-1.5 z-[9999] pointer-events-none bg-muted/20">
      <motion.div
        className="h-full bg-primary origin-left shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
        style={{ scaleX }}
      />
    </div>
  );
}

