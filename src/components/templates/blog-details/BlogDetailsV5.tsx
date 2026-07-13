'use client';

import { Terminal, Zap, Hash, ChevronRight, Share, Box } from 'lucide-react';
import { generateHtml } from '@/lib/server-html';

interface Blog {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface BlogDetailsV5Props {
  blog: Blog;
  readingTime: number;
}

export default function BlogDetailsV5({ blog, readingTime }: BlogDetailsV5Props) {
  // Safe date and ID processing
  const safeId = blog?._id ? blog._id.slice(-6) : 'UNKNOWN';
  const safeDate = (() => {
    if (!blog?.createdAt) return 'UNKNOWN_DATE';
    const date = new Date(blog.createdAt);
    return isNaN(date.getTime()) ? 'UNKNOWN_DATE' : date.toLocaleDateString();
  })();
  const safeReadingTime = typeof readingTime === 'number' ? readingTime : 0;

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden font-mono shadow-2xl">
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
         <div className="flex items-center gap-4 text-xs text-neutral-500">
            <div className="flex gap-1.5">
               <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
               <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
               <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
            <div className="flex items-center gap-2">
               <Terminal className="h-3 w-3" /> system.journal_v5.log
            </div>
         </div>
         <div className="h-3 w-10 bg-neutral-800 rounded" />
      </div>

      {/* Content Panel */}
      <div className="p-8 md:p-12 space-y-10">
         <div className="space-y-4">
            <div className="text-primary font-bold text-xs flex items-center gap-2">
               <Zap className="h-4 w-4 fill-current" /> EXECUTION_START: BLOG_DETAILS
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none border-l-4 border-primary pl-6">
               {blog?.title || 'UNTITLED_LOG'}
            </h1>
            <div className="flex items-center gap-6 text-[10px] text-neutral-500 pt-2 uppercase">
               <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> ID_{safeId}</span>
               <span><ChevronRight className="h-3 w-3 inline" /> {safeDate}</span>
               <span className="text-primary font-bold"><ChevronRight className="h-3 w-3 inline" /> {safeReadingTime}m_READ</span>
            </div>
         </div>

         <article className="ProseMirror max-w-none">
            <div dangerouslySetInnerHTML={{ __html: generateHtml(blog?.content || '') }} />
         </article>

         <footer className="mt-20 pt-8 border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-500">
            <div className="flex gap-4">
               <button className="hover:text-primary transition-colors">GITHUB</button>
               <button className="hover:text-primary transition-colors">TWITTER</button>
            </div>
            <button className="flex items-center gap-2 text-primary hover:underline">
               <Share className="h-4 w-4" /> SHARE_DATA
            </button>
         </footer>
      </div>
    </div>
  );
}

