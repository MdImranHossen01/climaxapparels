import Link from 'next/link';
import {
  Calendar,
  ArrowRight,
  Newspaper,
  Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Pagination } from '@/components/ui/pagination';
import { BlogSearch } from '@/components/blog-listing/BlogSearch';

export default function BlogListingV1({
  blogs,
  totalBlogs,
  totalPages,
  currentPage,
  q
}: {
  blogs: any[];
  totalBlogs: number;
  totalPages: number;
  currentPage: number;
  q: string;
  style?: string;
}) {
  const [featuredBlog, ...gridBlogs] = blogs;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/[0.03] via-background to-background">
      <div className="container mx-auto px-4 py-16 md:py-20 max-w-7xl">
        <div className="space-y-5 mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
            Latest Stories & <span className="text-primary italic">Insights</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Product ideas, commerce playbooks, and practical updates from Climax Apparels.
          </p>
        </div>

        <div className="mb-12 rounded-3xl border bg-card/40 backdrop-blur-xl p-4 md:p-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-border/50">
          <BlogSearch defaultValue={q} />
          <p className="text-sm text-muted-foreground font-medium bg-muted/30 px-4 py-2 rounded-full border border-border/50">
            Showing <span className="font-bold text-foreground">{totalBlogs}</span> article{totalBlogs === 1 ? '' : 's'}
          </p>
        </div>

        {featuredBlog && (
          <Link
            href={`/blog/${featuredBlog.slug}`}
            className="group grid grid-cols-1 lg:grid-cols-2 overflow-hidden border bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 mb-16 border-border/50"
          >
            {/* Left — Image */}
            <div className="relative aspect-video lg:aspect-auto lg:h-full overflow-hidden bg-muted w-full">
              {featuredBlog.thumbnail ? (
                <Image
                  src={featuredBlog.thumbnail}
                  alt={featuredBlog.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground/20">
                  <Newspaper className="h-20 w-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Right — Content */}
            <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 space-y-6">
              <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {new Date(featuredBlog.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>

              <h3 className="text-lg md:text-2xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2">
                {featuredBlog.title}
              </h3>

              {featuredBlog.metaDescription && (
                <p className="text-muted-foreground text-base leading-relaxed line-clamp-3">
                  {featuredBlog.metaDescription}
                </p>
              )}

              <div className="pt-2">
                <span className="h-11 px-8 rounded-full bg-primary text-primary-foreground font-bold inline-flex items-center gap-2 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20">
                  Read Article
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        )}

        {blogs.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border/50">
            <Newspaper className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold">No posts found</h2>
            <p className="text-muted-foreground">Try another keyword or check back later for new content.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(currentPage === 1 && featuredBlog ? gridBlogs : blogs).map((blog: any) => (
              <Link
                key={blog._id}
                href={`/blog/${blog.slug}`}
                className="group flex flex-col bg-card border overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2 border-border/50"
              >
                <div className="aspect-video overflow-hidden relative bg-muted">
                  {blog.thumbnail ? (
                    <Image
                      src={blog.thumbnail}
                      alt={blog.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="h-12 mb-4">
                    <h3 className="text-lg font-black leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                  </div>
                  <div className="h-[4.5rem] mb-6">
                    <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                      {blog.metaDescription}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read More <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 pt-8 border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="/blog"
              query={{ q }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

