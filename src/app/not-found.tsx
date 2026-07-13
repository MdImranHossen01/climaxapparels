'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ShoppingBag, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Abstract Background Design */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-60 h-60 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* Animated Error Code */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative inline-block"
        >
          <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/40 select-none opacity-20">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
             <motion.div 
               animate={{ y: [0, -10, 0] }} 
               transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
               className="bg-background/80 backdrop-blur-sm border-2 border-primary/20 rounded-2xl py-2 px-6 shadow-2xl"
             >
                <span className="text-xl md:text-2xl font-bold text-primary tracking-tight">Something is missing</span>
             </motion.div>
          </div>
        </motion.div>

        {/* Text and Actions */}
        <div className="space-y-4">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-2xl md:text-3xl font-bold tracking-tight"
          >
            Looking for something?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-muted-foreground text-sm md:text-base max-w-md mx-auto leading-relaxed"
          >
            We couldn't find the page you're looking for. It might have been moved or doesn't exist anymore.
          </motion.p>
        </div>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto font-semibold gap-2 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold gap-2 border-2 rounded-xl transition-all hover:bg-primary/5 hover:border-primary/40">
              <ShoppingBag className="h-4 w-4" />
              Browse Shop
            </Button>
          </Link>
        </motion.div>

        {/* Footer Link */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.8 }}
           className="pt-12"
        >
            <button 
                onClick={() => window.history.back()}
                className="text-muted-foreground text-sm flex items-center gap-1.5 mx-auto hover:text-primary transition-colors font-medium border-b border-transparent hover:border-primary/30 pb-0.5"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Go to previous page
            </button>
        </motion.div>
      </div>
    </div>
  );
}

