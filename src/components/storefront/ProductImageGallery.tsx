'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProductImageGalleryProps {
  images: string[];
}

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [activeImage, setActiveImage] = useState(images?.[0] || '/placeholder.png');
  
  useEffect(() => {
    setActiveImage(images?.[0] || '/placeholder.png');
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-muted/30 border flex items-center justify-center">
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-muted/30 border">
        <Image
          src={activeImage}
          alt="Product Image"
          fill
          className="object-cover transition-all"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(img)}
              className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

