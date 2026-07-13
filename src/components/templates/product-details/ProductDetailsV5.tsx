/* eslint-disable @typescript-eslint/no-explicit-any */
import ProductDetailsV5Client from './ProductDetailsV5Client';
import Script from 'next/script';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const sanitizeForScript = (json: any) => {
  return JSON.stringify(json).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
};

export default async function ProductDetailsV5({ product }: { product: any }) {
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
    <div className="w-full">
      {productSchema && (
        <Script
          id="product-schema-v5"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <Script
          id="breadcrumb-schema-v5"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(breadcrumbSchema) }}
        />
      )}

      <ProductDetailsV5Client product={product} />
    </div>
  );
}

