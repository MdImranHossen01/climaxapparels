import dynamic from 'next/dynamic';

// --- FOOTERS ---
const FooterV1 = dynamic(() => import('./footers/FooterV1'));
const FooterV2 = dynamic(() => import('./footers/FooterV2'));
const FooterV3 = dynamic(() => import('./footers/FooterV3'));
const FooterV4 = dynamic(() => import('./footers/FooterV4'));
const FooterV5 = dynamic(() => import('./footers/FooterV5'));

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
const ProductDetailsV1 = dynamic(() => import('./product-details/ProductDetailsV1'));
const ProductDetailsV2 = dynamic(() => import('./product-details/ProductDetailsV2'));
const ProductDetailsV3 = dynamic(() => import('./product-details/ProductDetailsV3'));
const ProductDetailsV4 = dynamic(() => import('./product-details/ProductDetailsV4'));
const ProductDetailsV5 = dynamic(() => import('./product-details/ProductDetailsV5'));

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
const BlogDetailsV1 = dynamic(() => import('./blog-details/BlogDetailsV1'));
const BlogDetailsV2 = dynamic(() => import('./blog-details/BlogDetailsV2'));
const BlogDetailsV3 = dynamic(() => import('./blog-details/BlogDetailsV3'));
const BlogDetailsV4 = dynamic(() => import('./blog-details/BlogDetailsV4'));
const BlogDetailsV5 = dynamic(() => import('./blog-details/BlogDetailsV5'));

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

