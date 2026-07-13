'use client';

import { useEffect } from 'react';
import { trackView } from '@/app/actions/view-tracking';

interface ViewTrackerProps {
  id: string;
  type: 'product' | 'blog';
}

export function ViewTracker({ id, type }: ViewTrackerProps) {
  useEffect(() => {
    if (id) {
      trackView(id, type).catch(err => console.error(`Failed to track ${type} view:`, err));
    }
  }, [id, type]);

  return null;
}

