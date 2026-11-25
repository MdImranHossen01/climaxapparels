import { Metadata } from 'next';
import { getCachedBlogs, getCachedSettings } from '@/lib/data-fetching';
import { BlogListingSelector } from '@/components/templates/ServerRegistry';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedSettings();
  const brandName = settings?.brandName || 'Climax Apparels';
  const rawSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000');
  const baseUrl = rawSiteUrl.startsWith('http') ? rawSiteUrl : `https://${rawSiteUrl}`;

  return {
    title: `Health, Medicine & Wellness Blog | Expert Medical Guides | ${brandName}`,
    description: `Read professional health articles, daily wellness advice, baby care guides, disease prevention tips, and expert medical updates from the clinical team at ${brandName}.`,
    openGraph: {
      title: `Blog | ${brandName}`,
      description: `Stay updated with the latest news and guides from ${brandName}.`,
      url: `${baseUrl}/blog`,
      siteName: brandName,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Blog | ${brandName}`,
      description: `Stay updated with the latest news and guides from ${brandName}.`,
    },
  };
}

export default async function BlogListingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page = '1', q = '' } = await searchParams;

  // Safe page parsing and clamping
  const parsedPage = parseInt(page, 10);
  const currentPage = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);

  const limit = 12;

  // Fetch settings
  const settings = await getCachedSettings();

  // Fetch blogs based on a reasonable high limit for listing
  const allBlogs = await getCachedBlogs(500);

  const filteredBlogs = allBlogs.filter((blog: any) => {
    const searchTerm = q.toLowerCase().trim();
    if (!searchTerm) return true;
    return (
      (blog.title ?? '').toLowerCase().includes(searchTerm) ||
      (blog.metaDescription ?? '').toLowerCase().includes(searchTerm)
    );
  });

  const totalBlogs = filteredBlogs.length;
  const totalPages = Math.ceil(totalBlogs / limit);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);

  const startIndex = (safeCurrentPage - 1) * limit;
  const paginatedBlogs = filteredBlogs.slice(startIndex, startIndex + limit);

  return (
    <BlogListingSelector
      variant={settings?.uiTemplates?.blogListing || 'v1'}
      blogs={paginatedBlogs}
      totalBlogs={totalBlogs}
      currentPage={safeCurrentPage}
      totalPages={totalPages}
      searchTerm={q}
    />
  );
}

