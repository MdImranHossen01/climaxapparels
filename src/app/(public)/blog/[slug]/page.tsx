import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getCachedBlogBySlug, getCachedSettings } from '@/lib/data-fetching';
import { BlogDetailsSelector } from '@/components/templates/ServerRegistry';
import { ViewTracker } from '@/components/common/ViewTracker';
import { FBBlogTracker } from '@/components/common/FBBlogTracker';

import { generateBlogSchema, generateBreadcrumbSchema } from '@/lib/seo';
import Script from 'next/script';

interface BlogDetailProps {
  params: Promise<{ slug: string }>;
}

const sanitizeForScript = (json: any) => {
  return JSON.stringify(json).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
};

const getReadingTime = (content: string) => {
  const words = content ? content.split(' ').length : 0;
  return Math.max(1, Math.ceil(words / 220));
};

async function getBlog(slug: string) {
  return getCachedBlogBySlug(slug);
}

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const [blog, settings] = await Promise.all([
    getBlog(slug),
    getCachedSettings()
  ]);

  if (!blog) return { title: 'Blog Not Found' };

  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const headersList = await headers();
  const hostname = headersList.get('host') || 'localhost';
  const baseUrl = `${protocol}://${hostname}`;

  const title = blog.metaTitle || blog.title;
  const description = blog.metaDescription || blog.title;
  const image = blog.thumbnail ? [blog.thumbnail] : [];
  const siteName = settings?.brandName || 'Online Shop';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image,
      type: 'article',
      url: `${baseUrl}/blog/${slug}`,
      siteName: siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image,
    }
  };
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { slug } = await params;
  const [blog, settings] = await Promise.all([
    getBlog(slug),
    getCachedSettings()
  ]);

  if (!blog) notFound();

  const readingTime = getReadingTime(blog.content);
  const style = settings?.uiTemplates?.blogDetail || 'v1';
  const blogId = blog._id.toString();

  const blogSchema = await generateBlogSchema(blog);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', item: '/' },
    { name: 'Blog', item: '/blog' },
    { name: blog.title, item: `/blog/${blog.slug}` }
  ]);

  return (
    <>
      {blogSchema && (
        <Script
          id="blog-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(blogSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(breadcrumbSchema) }}
        />
      )}
      <FBBlogTracker title={blog.title} id={blogId} />
      <ViewTracker id={blogId} type="blog" />
      <BlogDetailsSelector
        style={style}
        blog={blog}
        readingTime={readingTime}
      />
    </>
  );
}

