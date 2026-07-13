'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  className?: string;
  starClassName?: string;
}

export function RatingStars({ 
  rating, 
  maxRating = 5, 
  className,
  starClassName 
}: RatingStarsProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[...Array(maxRating)].map((_, i) => {
        const fillAmount = Math.min(Math.max(rating - i, 0), 1);
        
        return (
          <div key={i} className="relative">
            {/* Empty Star (Background) */}
            <Star 
              className={cn(
                "h-4 w-4 text-gray-300 fill-gray-300", 
                starClassName
              )} 
            />
            {/* Filled Star (Foreground with clip-path) */}
            {fillAmount > 0 && (
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - fillAmount * 100}% 0 0)` }}
              >
                <Star 
                  className={cn(
                    "h-4 w-4 text-yellow-400 fill-yellow-400", 
                    starClassName
                  )} 
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
