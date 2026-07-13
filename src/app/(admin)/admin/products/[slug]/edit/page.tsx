'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        setProduct(data);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching product:', error);
          toast.error('Failed to load product');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Product not found.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <ProductForm initialData={product} />
    </div>
  );
}

