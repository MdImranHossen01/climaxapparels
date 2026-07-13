/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowDown, Share2, Bookmark, MessageSquare, Sparkles, MoveRight, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { toast } from 'sonner';

interface BlogDetailsV4Props {
  blog: any;
  readingTime: number;
}

export default function BlogDetailsV4({ blog, readingTime }: BlogDetailsV4Props) {
  const [isScrolled, setIsScrolled] = useState(false);

  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);

    // Initialize bookmark state
    const bookmarks = JSON.parse(localStorage.getItem('blog_bookmarks') || '[]');
    setIsBookmarked(bookmarks.includes(blog._id));

    return () => window.removeEventListener('scroll', handleScroll);
  }, [blog._id]);

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('blog_bookmarks') || '[]');
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = bookmarks.filter((id: string) => id !== blog._id);
      toast.success('Removed from Discovery Journal');
    } else {
      newBookmarks = [...bookmarks, blog._id];
      toast.success('Archived in Discovery Journal');
    }
    localStorage.setItem('blog_bookmarks', JSON.stringify(newBookmarks));
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      try {
        if (navigator.share) {
          await navigator.share({ title: blog.title, url: window.location.href });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link Embedded');
        }
      } catch (err) {
        toast.error('Share link failed');
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'PRESENT';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'PRESENT' : date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const cleanContent = blog.content ? DOMPurify.sanitize(blog.content) : '';
  const firstWord = blog.title ? blog.title.split(' ')[0] : 'NARRATIVE';

  return (
    <div className="bg-white dark:bg-black min-h-screen animate-in fade-in duration-1000">
      {/* Immersive Ethereal Header */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {blog.thumbnail || blog.coverImage ? (
            <Image
              src={blog.thumbnail || blog.coverImage}
              alt={blog.title || 'Discovery Journal Entry'}
              fill
              className="object-cover scale-110 opacity-70 transition-transform duration-[10s] hover:scale-100"
              priority
            />
          ) : (
            <div className="w-full h-full bg-neutral-900" />
          )}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[4px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center space-y-12 max-w-6xl">
          <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-10 duration-1000">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 backdrop-blur-3xl rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.5em]">
              <Sparkles className="h-4 w-4 fill-primary text-primary" /> Curated Experience
            </div>

            <h1 className="text-7xl md:text-[12rem] font-black text-white tracking-tighter leading-[0.75] animate-in slide-in-from-bottom-20 duration-1000 delay-300">
              <span className="block opacity-10 italic font-serif" aria-hidden="true">{firstWord}</span>
              <span className="block -mt-6 md:-mt-12">{blog.title}</span>
            </h1>

            <div className="flex items-center gap-8 text-white/40 text-[10px] font-black uppercase tracking-[0.4em] pt-10">
              <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(blog.createdAt || blog.publishedAt)}</span>
              <span className="h-1 w-1 bg-white/40 rounded-full" />
              <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {readingTime || 0} Min Discovery</span>
            </div>
          </div>

          <div className="flex justify-center animate-bounce-slow pt-20">
            <ArrowDown className="h-12 w-12 text-white/30" />
          </div>
        </div>
      </section>

      {/* Narrative Canvas */}
      <article className="max-w-4xl mx-auto px-6 py-40 relative">
        {/* Floating Social Bar */}
        <div className={`fixed left-12 top-1/2 -translate-y-1/2 hidden 2xl:flex flex-col gap-8 transition-all duration-700 ${isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
          <button onClick={handleShare} className="h-14 w-14 rounded-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-xl group">
            <Share2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={toggleBookmark}
            className={`h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-xl group ${isBookmarked ? 'bg-primary text-white' : 'bg-neutral-50 dark:bg-neutral-900 hover:bg-primary hover:text-white'}`}
            aria-label={isBookmarked ? 'Remove Bookmark' : 'Save Bookmark'}
          >
            <Bookmark className={`h-6 w-6 group-hover:scale-110 transition-transform ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <div className="h-20 w-[2px] bg-neutral-100 dark:bg-neutral-800 mx-auto" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em] rotate-180 [writing-mode:vertical-rl] text-neutral-400">Interact</span>
        </div>

        <div className="relative">
          <div
            className="ProseMirror max-w-none"
            dangerouslySetInnerHTML={{ __html: cleanContent }}
          />

          <footer className="mt-40 pt-20 border-t border-neutral-100 dark:border-neutral-900 flex flex-col items-center gap-12">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-neutral-100 dark:bg-neutral-900 p-1 relative overflow-hidden">
                <Image
                  src={blog.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.author?.name || 'Climax Apparels')}`}
                  alt="Author"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest">{blog.author?.name || 'Climax Apparels Curators'}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Design Narrative Expert</span>
              </div>
            </div>

            <Link href="/blog">
              <Button variant="outline" className="h-16 px-12 rounded-full font-black uppercase tracking-[0.3em] text-[10px] border-2 group">
                Continue Discovery <MoveRight className="ml-3 h-4 w-4 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </footer>
        </div>
      </article>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

