'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Share, Link as LinkIcon, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonsProps {
  title: string;
}

export function ShareButtons({ title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const getUrl = () => typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = async () => {
    const url = getUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
        toast.success('Shared successfully!');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback: Open a custom share menu or just copy link
      handleFacebookShare();
    }
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(getUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noreferrer,noopener');
  };

  const handleTwitterShare = () => {
    const url = encodeURIComponent(getUrl());
    const text = encodeURIComponent(title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noreferrer,noopener');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      toast.success('Link copied to clipboard!');
      
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <>
      <button 
        type="button"
        onClick={handleShare}
        className="p-3 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20" 
        title="Share via Device"
        aria-label="Share via Device"
      >
        <Send className="h-5 w-5" />
      </button>

      <button 
        type="button"
        onClick={handleFacebookShare}
        className="p-3 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20" 
        title="Share on Facebook"
        aria-label="Share on Facebook"
      >
        <Share className="h-5 w-5" />
      </button>

      <button 
        type="button"
        onClick={handleTwitterShare}
        className="p-3 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20" 
        title="Share on Twitter"
        aria-label="Share on Twitter"
      >
        <div className="relative">
             <svg 
                viewBox="0 0 24 24" 
                aria-hidden="true" 
                className="h-5 w-5 fill-current"
             >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
             </svg>
        </div>
      </button>

      <button 
        type="button"
        onClick={handleCopyLink}
        className="p-3 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20" 
        title="Copy Link"
        aria-label="Copy Link"
      >
        {copied ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <LinkIcon className="h-5 w-5" />
        )}
      </button>
    </>
  );
}

