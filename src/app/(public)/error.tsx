'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console
    console.error('Unhandled runtime error in public layout:', error);

    // Auto-recovery for ChunkLoadErrors (highly common after new deployments)
    const isChunkError = 
      error.message && 
      (error.message.toLowerCase().includes('chunk') || 
       error.message.toLowerCase().includes('loading') || 
       error.message.toLowerCase().includes('failed to fetch'));

    if (isChunkError) {
      const reloadKey = 'pwa-chunk-reload-timestamp';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();

      // Only attempt auto-reload if we haven't done so in the last 15 seconds (prevents loops)
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem(reloadKey, now.toString());
        console.warn('Chunk load error detected. Attempting automatic reload...');
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-background relative overflow-hidden">
      {/* Decorative Blur Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-md w-full space-y-6">
        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-primary animate-pulse">
          <AlertTriangle className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The page encountered a temporary issue while loading. This usually happens due to a weak connection or system update.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            onClick={() => {
              // Try to reset the Next.js boundary first
              reset();
              // In case reset fails to reload components, do a full window reload
              setTimeout(() => {
                window.location.reload();
              }, 200);
            }}
            className="w-full sm:w-auto font-semibold gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <RotateCw className="h-4 w-4" />
            Reload Page
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto font-semibold gap-2 border-2 hover:bg-primary/5 hover:border-primary/40"
            >
              <Home className="h-4 w-4" />
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
