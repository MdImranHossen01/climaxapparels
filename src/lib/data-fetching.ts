import { unstable_cache } from 'next/cache';
import connectToDatabase from './db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Banner from '@/models/Banner';
import Blog from '@/models/Blog';
import FAQ from '@/models/FAQ';
import GlobalSettings from '@/models/GlobalSettings';
import Coupon from '@/models/Coupon';
import Order from '@/models/Order';

// Helper to serialize MongoDB data
const serialize = (data: any) => JSON.parse(JSON.stringify(data));

/**
 * CACHE_TAGS constants for consistency
 */
export const CACHE_TAGS = {
  products: 'products',
  categories: 'categories',
  banners: 'banners',
  blogs: 'blogs',
  faqs: 'faqs',
  settings: 'settings',
  coupons: 'coupons',
};

// --- PRODUCTS ---

export const getCachedProducts = (query = {}, limit = 10, sort: any = { createdAt: -1 }) => {
  return unstable_cache(
    async () => {
      await connectToDatabase();
      const products = await Product.find({ isPublished: true, ...query })
        .populate('categories')
        .sort(sort as any)
        .limit(limit)
        .lean();
      return serialize(products);
    },
    ['products-list', JSON.stringify(query), limit.toString(), JSON.stringify(sort)],
    { revalidate: 31536000, tags: [CACHE_TAGS.products] }
  )();
};

export const getCachedProductBySlug = (slug: string) => {
  return unstable_cache(
    async () => {
      await connectToDatabase();
      const product = await Product.findOne({ slug, isPublished: true })
        .populate('categories')
        .lean();
      return serialize(product);
    },
    ['product-detail', slug],
    { revalidate: 31536000, tags: [CACHE_TAGS.products] }
  )();
};

export const getTrendingProducts = (limit = 10) => {
  return unstable_cache(
    async () => {
      await connectToDatabase();

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 1. Get Top Selling products in last 30 days
      const topSellingItems = await Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'Cancelled' } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSales: { $sum: '$items.quantity' } } },
        { $sort: { totalSales: -1 } },
        { $limit: limit }
      ]);

      const topSellingIds = topSellingItems.map(item => item._id);

      let trendingProducts = await Product.find({
        _id: { $in: topSellingIds },
        isPublished: true,
      }).populate('categories').lean();

      // Ensure they are in the order of totalSales
      trendingProducts.sort((a: any, b: any) => {
        const aSales = topSellingItems.find(item => item._id.toString() === a._id.toString())?.totalSales || 0;
        const bSales = topSellingItems.find(item => item._id.toString() === b._id.toString())?.totalSales || 0;
        return bSales - aSales;
      });

      // 2. If not enough, fill with high ratings
      if (trendingProducts.length < limit) {
        const remaining = limit - trendingProducts.length;
        const topRated = await Product.find({
          _id: { $nin: trendingProducts.map(p => p._id) },
          isPublished: true,
          ratings: { $gt: 0 }
        })
          .populate('categories')
          .sort({ ratings: -1, numReviews: -1 } as any)
          .limit(remaining)
          .lean();
        trendingProducts = [...trendingProducts, ...topRated] as any;
      }

      // 3. If still not enough, fill with high views
      if (trendingProducts.length < limit) {
        const remaining = limit - trendingProducts.length;
        const topViewed = await Product.find({
          _id: { $nin: trendingProducts.map(p => p._id) },
          isPublished: true,
          views: { $gt: 0 }
        })
          .populate('categories')
          .sort({ views: -1 } as any)
          .limit(remaining)
          .lean();
        trendingProducts = [...trendingProducts, ...topViewed] as any;
      }

      // 4. Finally, fill with latest added
      if (trendingProducts.length < limit) {
        const remaining = limit - trendingProducts.length;
        const latest = await Product.find({
          _id: { $nin: trendingProducts.map(p => p._id) },
          isPublished: true,
        })
          .populate('categories')
          .sort({ createdAt: -1 } as any)
          .limit(remaining)
          .lean();
        trendingProducts = [...trendingProducts, ...latest] as any;
      }

      return serialize(trendingProducts);
    },
    ['trending-products', limit.toString()],
    { revalidate: 3600, tags: [CACHE_TAGS.products] }
  )();
};

// --- CATEGORIES ---

export const getCachedCategories = () => {
  return unstable_cache(
    async () => {
      await connectToDatabase();
      const categories = await Category.find({ isActive: true })
        .populate('parentCategory', 'name')
        .sort({ createdAt: -1 })
        .lean();
      return serialize(categories);
    },
    ['categories-list'],
    { revalidate: 31536000, tags: [CACHE_TAGS.categories] }
  )();
};

// --- BANNERS ---

export const getCachedBanners = () => {
  return unstable_cache(
    async () => {
      await connectToDatabase();
      const banners = await Banner.find({ isActive: true })
        .sort({ order: 1 })
        .lean();
      return serialize(banners);
    },
    ['banners-list'],
    { revalidate: 60, tags: [CACHE_TAGS.banners] }
  )();
};

// --- BLOGS ---

export const getCachedBlogs = (limit = 10) => {
  return unstable_cache(
    async () => {
      await connectToDatabase();
      const blogs = await Blog.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return serialize(blogs);
    },
    ['blogs-list', limit.toString()],
    { revalidate: 31536000, tags: [CACHE_TAGS.blogs] }
  )();
};

export const getCachedBlogBySlug = (slug: string) => {
  return unstable_cache(
    async () => {
      await connectToDatabase();
      const blog = await Blog.findOne({ slug, isPublished: true }).lean();
      return serialize(blog);
    },
    ['blog-detail', slug],
    { revalidate: 31536000, tags: [CACHE_TAGS.blogs] }
  )();
};

// --- FAQs ---

export const getCachedFAQs = () => {
  return unstable_cache(
    async () => {
      await connectToDatabase();
      const faqs = await FAQ.find({ isActive: true }).sort({ order: 1 }).lean();
      return serialize(faqs);
    },
    ['faqs-list'],
    { revalidate: 31536000, tags: [CACHE_TAGS.faqs] }
  )();
};

// --- SETTINGS ---

/**
 * Fetches global settings for the storefront.
 */
export const getCachedSettings = () => {
  return unstable_cache(
    async () => {
      await connectToDatabase();

      // Find the first available settings record
      const settings = await GlobalSettings.findOne().lean();

      return serialize(settings);
    },
    ['global-settings'],
    { tags: [CACHE_TAGS.settings], revalidate: 3600 }
  )();
};

// --- COUPONS ---

export const getCachedActiveCoupon = () => {
  return unstable_cache(
    async () => {
      await connectToDatabase();
      const coupon = await Coupon.findOne({
        isActive: true,
        expiryDate: { $gt: new Date() }
      }).sort({ createdAt: -1 }).lean();
      return serialize(coupon);
    },
    ['active-coupon'],
    { revalidate: 3600, tags: [CACHE_TAGS.coupons] }
  )();
};

