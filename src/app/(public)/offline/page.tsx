'use client';

import { WifiOff, Home } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-muted rounded-full p-6 mb-6">
        <WifiOff className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-black mb-2 tracking-tight">You're Offline</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        It looks like you've lost your internet connection. Don't worry, you can still browse parts of the store that you've visited recently!
      </p>
      <div className="flex gap-4">
        <Link href="/" className={cn(buttonVariants({ variant: 'default' }), "h-10 px-6")}>
          <Home className="mr-2 h-4 w-4" /> Go to Home
        </Link>
        <Button variant="outline" className="h-10 px-6" onClick={() => window.location.reload()}>
          Retry Connection
        </Button>
      </div>
    </div>
  );
}

