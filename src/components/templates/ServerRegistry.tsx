import dynamic from 'next/dynamic';

// --- FOOTERS ---
import FooterV1 from './footers/FooterV1';
import FooterV2 from './footers/FooterV2';
import FooterV3 from './footers/FooterV3';
import FooterV4 from './footers/FooterV4';
import FooterV5 from './footers/FooterV5';

export const FooterSelector = ({ style }: { style: string }) => {
  switch (style) {
    case 'v1': return <FooterV1 />;
    case 'v2': return <FooterV2 />;
    case 'v3': return <FooterV3 />;
    case 'v4': return <FooterV4 />;
    case 'v5': return <FooterV5 />;
    default: return <FooterV1 />;
  }
};

// --- PRODUCT DETAILS ---
import ProductDetailsV1 from './product-details/ProductDetailsV1';
import ProductDetailsV2 from './product-details/ProductDetailsV2';
import ProductDetailsV3 from './product-details/ProductDetailsV3';
import ProductDetailsV4 from './product-details/ProductDetailsV4';
import ProductDetailsV5 from './product-details/ProductDetailsV5';

export const ProductDetailsSelector = ({ style, product }: { style: string, product: any }) => {
  switch (style) {
    case 'v1': return <ProductDetailsV1 product={product} />;
    case 'v2': return <ProductDetailsV2 product={product} />;
    case 'v3': return <ProductDetailsV3 product={product} />;
    case 'v4': return <ProductDetailsV4 product={product} />;
    case 'v5': return <ProductDetailsV5 product={product} />;
    default: return <ProductDetailsV1 product={product} />;
  }
};

// --- BLOG DETAILS ---
import BlogDetailsV1 from './blog-details/BlogDetailsV1';
import BlogDetailsV2 from './blog-details/BlogDetailsV2';
import BlogDetailsV3 from './blog-details/BlogDetailsV3';
import BlogDetailsV4 from './blog-details/BlogDetailsV4';
import BlogDetailsV5 from './blog-details/BlogDetailsV5';

export const BlogDetailsSelector = ({ style, blog, readingTime }: { style: string, blog: any, readingTime: number }) => {
  switch (style) {
    case 'v1': return <BlogDetailsV1 blog={blog} readingTime={readingTime} />;
    case 'v2': return <BlogDetailsV2 blog={blog} readingTime={readingTime} />;
    case 'v3': return <BlogDetailsV3 blog={blog} readingTime={readingTime} />;
    case 'v4': return <BlogDetailsV4 blog={blog} readingTime={readingTime} />;
    case 'v5': return <BlogDetailsV5 blog={blog} readingTime={readingTime} />;
    default: return <BlogDetailsV1 blog={blog} readingTime={readingTime} />;
  }
};

// --- SHOP LISTING ---
const ShopV1 = dynamic(() => import('./shop-page/ShopV1'));

export const ShopListingSelector = ({ style, productCardStyle, products, categories, searchParams }: { style: string, productCardStyle?: string, products: any[], categories: any[], searchParams: any }) => {
  const activeStyle = style || 'v1';
  switch (activeStyle) {
    case 'v1': return <ShopV1 products={products} categories={categories} searchParams={searchParams} style={activeStyle} productCardStyle={productCardStyle} />;
    default: return <ShopV1 products={products} categories={categories} searchParams={searchParams} style={activeStyle} productCardStyle={productCardStyle} />;
  }
};

// --- BLOG LISTING ---
const BlogListingV1 = dynamic(() => import('./blog-listing/BlogListingV1'));

export const BlogListingSelector = ({ 
  style, 
  variant,
  blogs, 
  totalBlogs, 
  totalPages, 
  currentPage, 
  q,
  searchTerm
}: { 
  style?: string, 
  variant?: string,
  blogs: any[], 
  totalBlogs: number, 
  totalPages: number, 
  currentPage: number, 
  q?: string,
  searchTerm?: string
}) => {
  const activeStyle = style || variant || 'v1';
  const activeQ = q || searchTerm || '';

  switch (activeStyle) {
    case 'v1': return <BlogListingV1 blogs={blogs} totalBlogs={totalBlogs} totalPages={totalPages} currentPage={currentPage} q={activeQ} style={activeStyle} />;
    default: return <BlogListingV1 blogs={blogs} totalBlogs={totalBlogs} totalPages={totalPages} currentPage={currentPage} q={activeQ} style={activeStyle} />;
  }
};

