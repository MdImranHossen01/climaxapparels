async function getBaseUrl() {
  const rawSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000');
  const baseUrl = rawSiteUrl.startsWith('http') ? rawSiteUrl : `https://${rawSiteUrl}`;
  return baseUrl;
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

