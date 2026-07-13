import { headers } from 'next/headers';

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

export async function generateOrganizationSchema(settings: any) {
  const baseUrl = await getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.brandName || 'Climax Apparels',
    url: baseUrl,
    logo: settings.logo,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: settings.contact?.phone,
      contactType: 'customer service',
      email: settings.contact?.email,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.contact?.address,
    },
  };
}

export async function generateProductSchema(product: any) {
  const price = product.salePrice ?? product.price;
  const baseUrl = await getBaseUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'Climax Apparels',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/product/${product.slug}`,
      priceCurrency: 'BDT',
      price: price,
      availability: Number.isFinite(product.stock) && product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

export async function generateBlogSchema(blog: any) {
  const baseUrl = await getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    image: blog.thumbnail ? [blog.thumbnail] : [],
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt || blog.createdAt,
    author: {
      '@type': 'Organization',
      name: 'Climax Apparels',
    },
    description: blog.metaDescription || blog.title,
    url: `${baseUrl}/blog/${blog.slug}`,
  };
}

