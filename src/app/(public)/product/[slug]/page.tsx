/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { ProductDetailsSelector } from '@/components/templates/ServerRegistry';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ViewTracker } from '@/components/common/ViewTracker';
import { getCachedProductBySlug, getCachedSettings } from '@/lib/data-fetching';
import { notFound } from 'next/navigation';

const sanitizeForScript = (json: any) => {
  return JSON.stringify(json).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
};

const getProduct = async (slug: string) => {
  return getCachedProductBySlug(slug);
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProduct(slug),
    getCachedSettings()
  ]);
  if (!product) return { title: 'Product Not Found' };

  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const headersList = await headers();
  const hostname = headersList.get('host') || 'localhost';
  const baseUrl = `${protocol}://${hostname}`;

  // Strip HTML tags and JSON structure for a clean meta description
  const cleanDescription = (product.description ?? '')
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/\{"type":"doc"[\s\S]*\}/g, (match: string) => {
        try {
            const parsed = JSON.parse(match);
            const getText = (node: any): string => {
                if (node.text) return node.text;
                if (node.content) return node.content.map(getText).join(' ');
                return '';
            };
            return getText(parsed);
        } catch (e) {
            return match;
        }
    })
    .slice(0, 160);

  const safeDescription = cleanDescription;
  const mainImage = product.images?.[0] ? [{ url: product.images[0] }] : [];
  const twitterImage = product.images?.[0] ? [product.images[0]] : [];
  const siteName = settings?.brandName || 'Online Shop';

  return {
    title: product.name,
    description: safeDescription,
    openGraph: {
      title: product.name,
      description: safeDescription,
      images: mainImage,
      type: 'website',
      url: `${baseUrl}/product/${slug}`,
      siteName: siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: safeDescription,
      images: twitterImage,
    }
  };
}

import Script from 'next/script';

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProduct(slug),
    getCachedSettings()
  ]);

  if (!product) {
    notFound();
  }



  let related = [];
  try {
    const conn = await (await import('@/lib/db')).default();
    const ProductModel = (await import('@/models/Product')).default;
    const relatedProducts = await ProductModel.find({
      _id: { $ne: product._id },
      isPublished: true,
      $or: [
        { categories: { $in: (product.categories ?? []).map((category: { _id: string }) => category._id) } },
        { tags: { $in: product.tags || [] } },
      ],
    })
      .populate('categories')
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();
    related = JSON.parse(JSON.stringify(relatedProducts));
  } catch (error) {
    console.error("Error fetching related products:", error);
    related = [];
  }

  return (
    <div className="container px-4 md:px-0 mx-auto pt-2 pb-10">

      <div className="w-full">
        {/* Track View */}
        <ViewTracker id={product._id.toString()} type="product" />
        {/* Dynamic Product Detail Template Selector */}
        <ProductDetailsSelector style={settings?.uiTemplates?.productDetail || 'v1'} product={product} />
      </div>

      {Array.isArray(related) && related.length > 0 && (
        <section className="mt-20">
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">You May Also Like</h2>
              <p className="text-muted-foreground mt-1">Similar picks based on this product&apos;s category and tags.</p>
            </div>
            <Button variant="outline" render={<Link href="/shop" />} nativeButton={false}>
              Explore More
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {related.map((item: any) => (
              <ProductCard key={item._id} product={item} style={settings?.uiTemplates?.productCard || 'v1'} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

