
import { ProductCardSelector } from '@/components/templates/Registry';
import { Product } from '@/types/product';

export function ProductCard({ style = 'v1', product, isFlashSale, priority, layout }: { style?: string, product: Product, isFlashSale?: boolean, priority?: boolean, layout?: string }) {
  return <ProductCardSelector style={style} product={product} isFlashSale={isFlashSale} priority={priority} layout={layout} />;
}

