'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  createdAt: string | Date;
  metaDescription?: string;
}

interface BlogRecentProps {
  blogs: Blog[];
}

export function BlogRecent({ blogs }: BlogRecentProps) {
  if (!blogs || blogs.length === 0) return null;

  const blog = blogs[0];

  return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto px-4 ">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-12 gap-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter">
              Latest from our <span className="text-primary italic">Blog</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Discover tips, news, and trends from the Climax Apparels community.
            </p>
          </div>
          <Button asChild variant="default" className="rounded-full font-bold group">
            <Link href="/blog">
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Single Blog — Split Layout */}
        <Link
          href={`/blog/${blog.slug}`}
          className="group grid grid-cols-1 lg:grid-cols-2 overflow-hidden border bg-card hover:shadow-2xl transition-all duration-500"
        >
          {/* Left — Image */}
          <div className="relative aspect-video lg:aspect-auto lg:h-full overflow-hidden bg-muted w-full">
            {blog.thumbnail ? (
              <Image
                src={blog.thumbnail}
                alt={blog.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                <BookOpen className="h-16 w-16 opacity-20" />
              </div>
            )}
            {/* Overlay gradient on hover */}
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Right — Content */}
          <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 space-y-6">
            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {(() => {
                try {
                  const date = new Date(blog.createdAt);
                  return isNaN(date.getTime()) ? 'Recent Post' : format(date, 'MMMM dd, yyyy');
                } catch (e) {
                  return 'Recent Post';
                }
              })()}
            </div>

            <h3 className="text-lg md:text-2xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2">
              {blog.title}
            </h3>

            {blog.metaDescription && (
              <p className="text-muted-foreground text-base leading-relaxed line-clamp-3">
                {blog.metaDescription}
              </p>
            )}

            <div className="pt-2">
              <span className={cn(
                buttonVariants({ size: 'default', variant: 'default' }),
                "rounded-full font-bold group/btn inline-flex items-center gap-2 pointer-events-none"
              )}>
                Read Article
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

