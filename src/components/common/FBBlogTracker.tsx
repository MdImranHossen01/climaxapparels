'use client';

import { useEffect } from 'react';
import { fbEvent } from '@/lib/fpixel';

interface FBBlogTrackerProps {
  title: string;
  id: string;
}

export function FBBlogTracker({ title, id }: FBBlogTrackerProps) {
  useEffect(() => {
    if (title && id) {
      fbEvent('BlogView', {
        content_name: title,
        content_ids: [id],
        content_type: 'blog'
      });
    }
  }, [title, id]);

  return null;
}
