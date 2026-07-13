/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ArrowLeft, Share2, Bookmark, MessageSquare, Clock, Calendar, MoveLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import DOMPurify from 'isomorphic-dompurify';

interface BlogDetailsV2Props {
  blog: any;
  readingTime: number;
}

export default function BlogDetailsV2({ blog, readingTime }: BlogDetailsV2Props) {

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      try {
        if (navigator.share) {
          await navigator.share({ title: blog.title, url: window.location.href });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link Saved to Clipboard');
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        toast.error('Share system unavailable');
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'DATETIME_PENDING';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'DATETIME_PENDING' : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const cleanContent = blog.content ? DOMPurify.sanitize(blog.content) : '';

  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen py-32 px-6 animate-in fade-in duration-1000">
      <div className="max-w-4xl mx-auto">

        {/* Navigation Context */}
        <Link href="/blog" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-all mb-20 group">
          <MoveLeft className="h-4 w-4 group-hover:-translate-x-2 transition-transform" /> Back to Journal
        </Link>

        {/* Boutique Editorial Header */}
        <header className="space-y-10 mb-24">
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.5em] text-primary/60">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(blog.createdAt)}</div>
            <div className="h-1 w-1 rounded-full bg-neutral-200" />
            <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {readingTime || 0} Minute Immersion</div>
          </div>

          <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-[0.9] text-foreground">
            {blog.title || 'Untitled Narrative'}
          </h1>

          <div className="flex items-center gap-6">
            <div className="flex -space-x-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 w-12 rounded-full border-4 border-white dark:border-neutral-950 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center overflow-hidden shadow-sm">
                  <Image src={`https://ui-avatars.com/api/?name=Author+${i}&background=random`} alt="Contributor" width={48} height={48} />
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Words by</span>
              <span className="text-sm font-bold">Climax Apparels Editorial</span>
            </div>
          </div>
        </header>

        {/* Content Experience */}
        <article className="max-w-none">

          <div
            className="ProseMirror drop-cap-editorial"
            dangerouslySetInnerHTML={{ __html: cleanContent }}
          />

          <footer className="mt-32 pt-16 border-t border-neutral-100 dark:border-neutral-900">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex items-center gap-10">
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all group"
                >
                  <Share2 className="h-6 w-6 group-hover:scale-110 transition-transform" /> Share Piece
                </button>
                <button
                  onClick={() => toast.info('Vaulting available soon')}
                  className="flex flex-col items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all group"
                >
                  <Bookmark className="h-6 w-6 group-hover:scale-110 transition-transform" /> Save to Vault
                </button>
                <button
                  onClick={() => toast.info('Discussions loading')}
                  className="flex flex-col items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all group"
                >
                  <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" /> Join Discourse
                </button>
              </div>

              <div className="flex items-center gap-4 px-8 py-4 bg-neutral-50 dark:bg-neutral-900 rounded-full border border-neutral-100 dark:border-neutral-800">
                <Sparkles className="h-4 w-4 text-primary fill-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">End of Narrative</span>
              </div>
            </div>
          </footer>
        </article>
      </div>

      <style jsx global>{`
        .drop-cap-editorial p:first-of-type::first-letter {
          float: left;
          font-size: 5.5rem;
          line-height: 4.5rem;
          padding-top: 4px;
          padding-right: 12px;
          padding-left: 3px;
          font-family: serif;
          font-style: italic;
          font-weight: 900;
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}

