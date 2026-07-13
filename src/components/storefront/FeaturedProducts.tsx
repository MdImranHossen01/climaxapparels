import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FeaturedProductsProps {
  products: any[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
          <div className="space-y-4 text-left max-w-[600px]">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl" data-aos="fade-up">
              Featured Collections
            </h2>
            <p className="text-muted-foreground md:text-lg" data-aos="fade-up" data-aos-delay="100">
              Explore our best-selling and most popular products hand-picked just for you.
            </p>
          </div>
          <Button 
            variant="ghost" 
            className="group" 
            data-aos="fade-left" 
            data-aos-delay="200"
            render={<Link href="/shop" />}
            nativeButton={false}
          >
            View All Products
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div key={product._id} data-aos="fade-up" data-aos-delay={index * 100}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


