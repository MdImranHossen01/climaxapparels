/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ProductDetailsV2Client from './ProductDetailsV2Client';
import Script from 'next/script';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { notFound } from 'next/navigation';

const sanitizeForScript = (json: any) => {
  return JSON.stringify(json).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
};

export default async function ProductDetailsV2({ product }: { product: any }) {
  if (!product) {
    notFound();
  }

  const productSchema = await generateProductSchema(product);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', item: '/' },
    { name: 'Shop', item: '/shop' },
    { name: product.name || 'Product', item: `/product/${product.slug || 'unknown-product'}` }
  ]);

  return (
    <div className="container px-4 md:px-8 mx-auto py-10">
      {productSchema && (
        <Script
          id="product-schema-v2"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <Script
          id="breadcrumb-schema-v2"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(breadcrumbSchema) }}
        />
      )}

      {/* Luxury Breadcrumb */}
      <div className="mb-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 overflow-hidden">
        <Link href="/" className="hover:text-primary transition-colors shrink-0">Discovery</Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href="/shop" className="hover:text-primary transition-colors shrink-0">Collection</Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-foreground truncate">{product.name}</span>
      </div>

      <ProductDetailsV2Client product={product} />
    </div>
  );
}

