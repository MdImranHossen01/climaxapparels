'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useDebounce } from '../../hooks/use-debounce';

export function BlogSearch({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const debouncedValue = useDebounce(value, 500);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedValue) {
      params.set('q', debouncedValue);
    } else {
      params.delete('q');
    }
    params.set('page', '1'); // Reset to first page on search

    startTransition(() => {
      router.push(`/blog?${params.toString()}`);
    });
  }, [debouncedValue, router, searchParams]);

  return (
    <div className="relative w-full md:max-w-md">
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isPending ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by title or topic..."
        className="flex h-10 w-full rounded-xl border border-input bg-background px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all border-border/50 focus:border-primary/50"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      ) }
    </div>
  );
}

