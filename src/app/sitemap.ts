import { MetadataRoute } from "next";
import { headers } from "next/headers";
import connectToDatabase from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Blog from "@/models/Blog";

export const dynamic = "force-dynamic";

const getDynamicRoutes = async (baseUrl: string): Promise<MetadataRoute.Sitemap> => {
  try {
    await connectToDatabase();

    const [products, categories, blogs] = await Promise.all([
      Product.find({ isPublished: true }, "slug updatedAt")
        .sort({ updatedAt: -1 })
        .limit(40000)
        .lean()
        .exec(),
      Category.find({ isActive: true }, "slug updatedAt")
        .sort({ updatedAt: -1 })
        .limit(5000)
        .lean()
        .exec(),
      Blog.find({ isPublished: true }, "slug updatedAt")
        .sort({ updatedAt: -1 })
        .limit(4000)
        .lean()
        .exec(),
    ]);

    const productRoutes: MetadataRoute.Sitemap = products.map((item: any) => ({
      url: `${baseUrl}/product/${item.slug}`,
      lastModified: item.updatedAt || new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((item: any) => ({
      url: `${baseUrl}/shop?category=${encodeURIComponent(item.slug)}`,
      lastModified: item.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const blogRoutes: MetadataRoute.Sitemap = blogs.map((item: any) => ({
      url: `${baseUrl}/blog/${item.slug}`,
      lastModified: item.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [
      ...productRoutes,
      ...categoryRoutes,
      ...blogRoutes,
    ];
  } catch (error) {
    console.error("Error generating dynamic sitemap routes:", error);
    return [];
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost';

  // Detect protocol safely
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol = forwardedProto || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = `${protocol}://${host}`;

  const dynamicRoutes = await getDynamicRoutes(baseUrl);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return [...staticRoutes, ...dynamicRoutes];
}

