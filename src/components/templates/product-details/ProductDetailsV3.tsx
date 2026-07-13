/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ProductDetailsV3Client from './ProductDetailsV3Client';
import Script from 'next/script';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { notFound } from 'next/navigation';

const sanitizeForScript = (json: any) => {
  return JSON.stringify(json).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
};

export default async function ProductDetailsV3({ product }: { product: any }) {
  if (!product) {
    notFound();
  }

  const productSchema = await generateProductSchema(product);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', item: '/' },
    { name: 'Shop', item: '/shop' },
    { name: product.name, item: `/product/${product.slug}` }
  ]);

  return (
    <div className="container px-4 md:px-12 mx-auto py-10">
      {productSchema && (
        <Script
          id="product-schema-v3"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <Script
          id="breadcrumb-schema-v3"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(breadcrumbSchema) }}
        />
      )}

      {/* Industrial Breadcrumb */}
      <div className="mb-16 flex items-center gap-3 text-[10px] font-mono font-black uppercase tracking-[0.4em] text-muted-foreground/60">
        <Link href="/" className="hover:text-primary transition-colors">ROOT</Link>
        <span className="opacity-20">/</span>
        <Link href="/shop" className="hover:text-primary transition-colors">CATALOG</Link>
        <span className="opacity-20">/</span>
        <span className="text-foreground truncate">{product.name}</span>
      </div>

      <ProductDetailsV3Client product={product} />
    </div>
  );
}

