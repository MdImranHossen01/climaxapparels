/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ProductDetailsV4Client from './ProductDetailsV4Client';
import Script from 'next/script';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { notFound } from 'next/navigation';

const sanitizeForScript = (json: any) => {
  return JSON.stringify(json).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
};

export default async function ProductDetailsV4({ product }: { product: any }) {
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
    <div className="container px-4 md:px-16 mx-auto py-10">
      {productSchema && (
        <script
          id="product-schema-v4"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          id="breadcrumb-schema-v4"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(breadcrumbSchema) }}
        />
      )}

      {/* Boutique Breadcrumb */}
      <div className="mb-20 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/40">
        <Link href="/" className="hover:text-primary transition-colors">Atelier</Link>
        <span className="h-1 w-1 rounded-full bg-neutral-200" />
        <Link href="/shop" className="hover:text-primary transition-colors">Showroom</Link>
        <span className="h-1 w-1 rounded-full bg-neutral-200" />
        <span className="text-foreground font-black truncate">{product.name}</span>
      </div>

      <ProductDetailsV4Client product={product} />
    </div>
  );
}

