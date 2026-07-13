'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Facebook, Twitter, Linkedin } from '@/components/ui/social-icons';
import { Calendar, Clock, Mail, Share2, MoveLeft, Cpu, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { toast } from 'sonner';

interface BlogAuthor {
  name: string;
  avatar?: string;
  bio?: string;
}

interface Blog {
  _id: string;
  title: string;
  content: string;
  coverImage?: string;
  author?: BlogAuthor;
  createdAt?: string;
  publishedAt?: string;
}

interface BlogDetailsV3Props {
  blog: Blog;
  readingTime: number;
}

export default function BlogDetailsV3({ blog, readingTime }: BlogDetailsV3Props) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleSubscribe = () => {
    if (!email || !email.includes('@')) {
      toast.error('INVALID_IDENTITY_SEQUENCE');
      return;
    }
    toast.success('CORE_FEED_SYNCED: Check your terminal');
    setEmail('');
  };

  const handleShare = (platform: string) => {
    if (!currentUrl) return;
    const url = encodeURIComponent(currentUrl);
    const title = encodeURIComponent(blog.title);

    let shareUrl = '';
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
    if (platform === 'linkedin') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;

    if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'SYS_UNKNOWN_DATE';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'SYS_UNKNOWN_DATE' : date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '.');
  };

  const cleanContent = blog.content ? DOMPurify.sanitize(blog.content) : '';

  return (
    <div className="bg-[#f8f9fa] dark:bg-[#0a0a0a] min-h-screen animate-in fade-in duration-1000">
      {/* High-Precision Header */}
      <div className="relative h-[80vh] w-full overflow-hidden">
        <Image
          src={blog.coverImage || '/placeholder.png'}
          alt={blog.title}
          fill
          className="object-cover transition-transform duration-[10s] hover:scale-110"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f8f9fa] dark:from-[#0a0a0a] via-transparent to-black/20" />

        <div className="absolute inset-0 flex items-end justify-center pb-32 px-6">
          <div className="max-w-5xl w-full text-center space-y-10">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-black/10 backdrop-blur-3xl rounded-xl border border-white/10 text-white font-mono font-black uppercase tracking-[0.4em] text-[10px]">
              <Zap className="h-4 w-4 fill-primary text-primary" /> Core Intel Insight
            </div>
            <h1 className="text-6xl md:text-[10rem] font-black tracking-tighter text-foreground leading-[0.8] uppercase break-words drop-shadow-2xl">
              {blog.title}
            </h1>
            <div className="flex items-center justify-center gap-12 text-foreground/60 font-mono font-black uppercase tracking-widest text-[10px]">
              <span className="flex items-center gap-2 border-b-2 border-primary/20 pb-1"><Calendar className="h-3 w-3" /> {formatDate(blog.createdAt || blog.publishedAt)}</span>
              <span className="flex items-center gap-2 border-b-2 border-primary/20 pb-1"><Clock className="h-3 w-3" /> {readingTime || 0} MIN_PROCESS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">

          {/* Module: Narrative Engine */}
          <article className="lg:col-span-8">
            <div
              className="ProseMirror max-w-none"
              dangerouslySetInnerHTML={{ __html: cleanContent }}
            />

            <div className="mt-24 pt-12 border-t border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <Link href="/blog" className="group flex items-center gap-4 text-[10px] font-mono font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-all">
                <MoveLeft className="h-5 w-5 group-hover:-translate-x-2 transition-transform" /> Ret_To_Archive
              </Link>
              <div className="flex items-center gap-4 text-[10px] font-mono font-black uppercase tracking-[0.4em] text-muted-foreground">
                SEC_LEVEL: <span className="text-primary">ALPHA_01</span>
              </div>
            </div>
          </article>

          {/* Module: Intelligence Hub */}
          <aside className="lg:col-span-4 space-y-16">
            {/* Author Intelligence */}
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-[3rem] p-10 border-2 border-neutral-200 dark:border-neutral-800 space-y-8">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-3xl overflow-hidden shadow-xl shadow-primary/20 rotate-3">
                  {blog.author?.avatar ? (
                    <Image src={blog.author.avatar} alt="Author" width={80} height={80} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-mono">JE</span>
                  )}
                </div>
                <div>
                  <h4 className="font-black text-xl uppercase tracking-tighter leading-none">{blog.author?.name || 'Climax Apparels Intelligence'}</h4>
                  <p className="text-[10px] font-mono font-black text-primary uppercase tracking-widest mt-2">Logistics Analyst</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed opacity-80">
                {blog.author?.bio || 'Synthesizing global commerce data into actionable retail narratives.'}
              </p>
            </div>

            {/* Comm Link Module */}
            <div className="bg-primary text-white rounded-[3rem] p-10 shadow-2xl shadow-primary/30 space-y-8 relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] opacity-10">
                <Cpu className="h-48 w-48 rotate-12" />
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Secure Feed</h3>
                <p className="text-white/60 font-mono text-[10px] uppercase tracking-widest leading-relaxed">Join 50K+ operatives receiving elite market intel.</p>
              </div>
              <div className="space-y-4 relative z-10">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 rounded-2xl bg-white/10 border-2 border-white/20 px-6 font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-white transition-all"
                  placeholder="ENTER_EMAIL_ADDR"
                />
                <Button
                  onClick={handleSubscribe}
                  className="w-full h-14 rounded-2xl bg-white text-primary hover:bg-neutral-100 font-black font-mono text-xs uppercase tracking-[0.2em] shadow-xl"
                >
                  INIT_JOIN
                </Button>
              </div>
            </div>

            {/* Distribution Grid */}
            <div className="space-y-6">
              <h3 className="text-center font-mono font-black text-[10px] uppercase tracking-[0.5em] text-muted-foreground border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-4">Distribute_Intel</h3>
              <div className="flex justify-center gap-6">
                {[
                  { icon: Facebook, name: 'facebook', color: 'hover:bg-[#1877F2]' },
                  { icon: Twitter, name: 'twitter', color: 'hover:bg-[#1DA1F2]' },
                  { icon: Linkedin, name: 'linkedin', color: 'hover:bg-[#0A66C2]' }
                ].map((Platform) => (
                  <Button
                    key={Platform.name}
                    variant="outline"
                    size="icon"
                    className={`rounded-2xl h-16 w-16 border-2 border-neutral-200 dark:border-neutral-800 hover:text-white transition-all ${Platform.color}`}
                    onClick={() => handleShare(Platform.name)}
                  >
                    <Platform.icon className="h-6 w-6" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Safety Protocols */}
            <div className="pt-10 flex flex-col gap-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure Protocol V4.2
              </div>
              <div className="flex items-center gap-3 text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
                <Mail className="h-4 w-4 text-primary" /> Verified Transmission
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

