import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShareButtons } from '@/components/storefront/ShareButtons';
import Image from 'next/image';
import { generateHtml } from '@/lib/server-html';

export default function BlogDetailsV1({ blog, readingTime }: { blog: any, readingTime: number }) {
  if (!blog) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="pt-12 pb-12 border-b bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Link href="/blog">
              <Button variant="ghost" className="mb-8 gap-2 -ml-4 hover:bg-transparent hover:text-primary">
                <ArrowLeft className="h-4 w-4" /> Back to Blog
              </Button>
            </Link>
            
            <div className="space-y-6">
              <h1 className="text-3xl md:text-6xl font-black tracking-tighter leading-[1.1]">
                {blog.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                  <Calendar className="h-4 w-4 text-primary" />
                  {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="h-1 w-1 rounded-full bg-border" />
                <div className="text-xs font-bold uppercase tracking-widest">
                  {readingTime} min read
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Featured Image */}
          {blog.thumbnail && (
            <div className="mb-16 relative shadow-xl rounded-3xl overflow-hidden aspect-[16/9]">
              <Image
                src={blog.thumbnail}
                alt={blog.title}
                fill
                priority
                className="object-cover"
              />
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar / Tools */}
            <aside className="lg:w-16 flex lg:flex-col items-center gap-4 lg:sticky lg:top-32 h-fit order-2 lg:order-1">
              <ShareButtons title={blog.title} />
            </aside>

            {/* Content Body */}
            <article className="flex-1 order-1 lg:order-2">
              <div className="ProseMirror max-w-none">
                <div
                  className="ProseMirror max-w-none min-h-[400px]"
                  dangerouslySetInnerHTML={{ __html: generateHtml(blog.content) }}
                />
              </div>

              <footer className="mt-16 pt-8 border-t">
                <div className="p-8 rounded-3xl bg-muted/30 border flex flex-col items-center text-center gap-4">
                  <h3 className="font-bold">Enjoyed this post?</h3>
                  <p className="text-sm text-muted-foreground">Share it with your network and join the conversation.</p>
                  <Link href="/blog">
                    <Button className="mt-2 font-bold px-8 rounded-full">Explore More Stories</Button>
                  </Link>
                </div>
              </footer>
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}

