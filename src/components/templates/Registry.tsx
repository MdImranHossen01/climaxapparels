import NavbarV1 from './navbars/NavbarV1';
import NavbarV2 from './navbars/NavbarV2';
import NavbarV3 from './navbars/NavbarV3';
import NavbarV4 from './navbars/NavbarV4';
import NavbarV5 from './navbars/NavbarV5';

export const NavbarSelector = ({ style }: { style: string }) => {
  switch (style) {
    case 'v1': return <NavbarV1 />;
    case 'v2': return <NavbarV2 />;
    case 'v3': return <NavbarV3 />;
    case 'v4': return <NavbarV4 />;
    case 'v5': return <NavbarV5 />;
    default: return <NavbarV1 />;
  }
};

// --- HEROS ---
import HeroV1 from './heros/HeroV1';
import HeroV2 from './heros/HeroV2';
import HeroV3 from './heros/HeroV3';
import HeroV4 from './heros/HeroV4';
import HeroV5 from './heros/HeroV5';

export const HeroSelector = ({ style, banners, layout }: { style: string, banners: any[], layout?: string }) => {
  switch (style) {
    case 'v1': return <HeroV1 banners={banners} layout={layout} />;
    case 'v2': return <HeroV2 banners={banners} />;
    case 'v3': return <HeroV3 banners={banners} />;
    case 'v4': return <HeroV4 banners={banners} />;
    case 'v5': return <HeroV5 banners={banners} />;
    default: return <HeroV1 banners={banners} layout={layout} />;
  }
};

// --- PRODUCT CARDS ---
import ProductCardV1 from './product-cards/ProductCardV1';
import ProductCardV2 from './product-cards/ProductCardV2';
import ProductCardV3 from './product-cards/ProductCardV3';
import ProductCardV4 from './product-cards/ProductCardV4';
import ProductCardV5 from './product-cards/ProductCardV5';
import ProductCardV6 from './product-cards/ProductCardV6';

export const ProductCardSelector = ({ style, product, isFlashSale, priority, layout }: { style: string, product: any, isFlashSale?: boolean, priority?: boolean, layout?: string }) => {
  switch (style) {
    case 'v1': return <ProductCardV1 product={product} isFlashSale={isFlashSale} />;
    case 'v2': return <ProductCardV2 product={product} isFlashSale={isFlashSale} />;
    case 'v3': return <ProductCardV3 product={product} isFlashSale={isFlashSale} />;
    case 'v4': return <ProductCardV4 product={product} isFlashSale={isFlashSale} />;
    case 'v5': return <ProductCardV5 product={product} isFlashSale={isFlashSale} />;
    case 'v6': return <ProductCardV6 product={product} isFlashSale={isFlashSale} priority={priority} layout={layout} />;
    default: return <ProductCardV1 product={product} isFlashSale={isFlashSale} />;
  }
};

// --- CATEGORIES ---
import CategoryV1 from './categories/CategoryV1';
import CategoryV2 from './categories/CategoryV2';
import CategoryV3 from './categories/CategoryV3';
import CategoryV4 from './categories/CategoryV4';
import CategoryV5 from './categories/CategoryV5';

export const CategorySelector = ({ style, categories }: { style: string, categories: any[] }) => {
  switch (style) {
    case 'v1': return <CategoryV1 categories={categories} />;
    case 'v2': return <CategoryV2 categories={categories} />;
    case 'v3': return <CategoryV3 categories={categories} />;
    case 'v4': return <CategoryV4 categories={categories} />;
    case 'v5': return <CategoryV5 categories={categories} />;
    default: return <CategoryV1 categories={categories} />;
  }
};

