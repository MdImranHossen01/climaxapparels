'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash, Loader2, Search, DatabaseZap, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { Pagination } from '@/components/ui/pagination';

interface AdminProduct {
  _id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  isPublished: boolean;
  images?: string[];
  slug: string;
  views?: number;
  totalSales?: number;
  description?: string;
  categories?: any[];
  variants?: any[];
}

function ProductsContent() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const limit = 10;

  const fetchProducts = async (signal?: AbortSignal, page = currentPage) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?page=${page}&limit=${limit}`, { signal });
      if (!response.ok) {
        toast.error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        return;
      }
      const data = await response.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, []);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This product will be permanently deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00D1B2',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'rounded-lg px-4 py-2 font-bold',
        cancelButton: 'rounded-lg px-4 py-2 font-bold'
      }
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Product deleted successfully');
          setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
          fetchProducts();
        } else {
          toast.error('Failed to delete product');
        }
      } catch {
        toast.error('Error deleting product');
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const searchLower = (search ?? '').toLowerCase();
    const nameLower = (p.name ?? '').toLowerCase();
    const skuLower = (p.sku ?? '').toLowerCase();
    return nameLower.includes(searchLower) || skuLower.includes(searchLower);
  });

  const toggleSelectAll = () => {
    const visibleIds = filteredProducts.map(p => p._id);
    const areAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));

    if (areAllSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => [...prev, ...visibleIds.filter(id => !prev.includes(id))]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const cleanDescription = (htmlStr?: string) => {
    if (!htmlStr) return 'Product description';
    return htmlStr.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, ' ').trim() || 'Product description';
  };

  const getAbsoluteUrl = (urlPath?: string) => {
    if (!urlPath) return '';
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
      return urlPath;
    }
    return `${window.location.origin}${urlPath.startsWith('/') ? '' : '/'}${urlPath}`;
  };

  const exportToCSV = async () => {
    let productsToExport: AdminProduct[] = [];
    setExportLoading(true);

    try {
      toast.info('Fetching products for export...');
      const response = await fetch(`/api/products?page=1&limit=1000`);
      if (response.ok) {
        const data = await response.json();
        const allProducts: AdminProduct[] = Array.isArray(data.products) ? data.products : [];
        if (selectedIds.length > 0) {
          productsToExport = allProducts.filter(p => selectedIds.includes(p._id));
        } else {
          productsToExport = allProducts;
        }
      } else {
        productsToExport = selectedIds.length > 0 
          ? products.filter(p => selectedIds.includes(p._id))
          : products;
      }

      if (productsToExport.length === 0) {
        toast.error('No products to export');
        return;
      }

      const headers = [
        'id',
        'title',
        'item_group_id',
        'description',
        'availability',
        'condition',
        'sku',
        'price',
        'sale_price',
        'link',
        'image_link',
        'brand',
        'fb_product_category',
        'colour',
        'additional_image_link',
        'colour'
      ];

      const rows: any[][] = [];

      productsToExport.forEach(p => {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v: any, index: number) => {
            const varPrice = v.price || p.price || 0;
            const varSalePrice = v.salePrice || p.salePrice || undefined;
            const varPriceVal = `${Math.round(varPrice)} BDT`;
            const varSalePriceVal = varSalePrice && varSalePrice < varPrice ? `${Math.round(varSalePrice)} BDT` : '';
            const varStock = v.stock !== undefined ? v.stock : (p.stock || 0);

            const primaryImage = v.image || (p.images && p.images[0]) || '';
            const additionalImages = (p.images || [])
              .filter(img => img !== primaryImage)
              .map(img => getAbsoluteUrl(img))
              .join(',');

            rows.push([
              v._id || `${p._id}-${index}`,
              p.name,
              p._id,
              cleanDescription(p.description),
              varStock > 0 ? 'in stock' : 'out of stock',
              'new',
              v.sku || p.sku || '',
              varPriceVal,
              varSalePriceVal,
              `${window.location.origin}/product/${p.slug}`,
              getAbsoluteUrl(primaryImage),
              'unknown',
              p.categories?.[0]?.name || '',
              v.color || '',
              additionalImages,
              v.color || ''
            ]);
          });
        } else {
          const priceVal = `${Math.round(p.price || 0)} BDT`;
          const salePriceVal = p.salePrice && p.salePrice < p.price ? `${Math.round(p.salePrice)} BDT` : '';
          const stockVal = p.stock || 0;

          const primaryImage = (p.images && p.images[0]) || '';
          const additionalImages = (p.images || [])
            .slice(1)
            .map(img => getAbsoluteUrl(img))
            .join(',');

          rows.push([
            p._id,
            p.name,
            p._id,
            cleanDescription(p.description),
            stockVal > 0 ? 'in stock' : 'out of stock',
            'new',
            p.sku || '',
            priceVal,
            salePriceVal,
            `${window.location.origin}/product/${p.slug}`,
            getAbsoluteUrl(primaryImage),
            'unknown',
            p.categories?.[0]?.name || '',
            '',
            additionalImages,
            ''
          ]);
        }
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.setAttribute('download', `fb_catalog_export_${dateStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Facebook Catalog export started');
    } catch (error) {
      toast.error('Error exporting products');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={exportLoading}>
            {exportLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {selectedIds.length > 0 ? `Export (${selectedIds.length})` : 'Export All'}
          </Button>
          <Link href="/admin/products/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-background overflow-hidden relative">
        {selectedIds.length > 0 && (
          <div className="sticky top-0 z-20 w-full bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-4 text-sm font-medium">
              <span>{selectedIds.length} products selected</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-white/10"
                onClick={() => setSelectedIds([])}
              >
                Deselect All
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white text-primary hover:bg-white/90"
                onClick={exportToCSV}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Download className="mr-2 h-3 w-3" />
                )}
                Export Selected
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.includes(p._id))}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product._id} className={selectedIds.includes(product._id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(product._id)}
                      onCheckedChange={() => toggleSelect(product._id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                      {product.images && product.images.length > 0 ? (
                        <Image 
                          src={product.images[0]} 
                          alt={product.name} 
                          width={48}
                          height={48}
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">
                    <Link 
                      href={`/product/${product.slug}`} 
                      target="_blank"
                      className="hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={product.salePrice ? 'text-xs line-through text-muted-foreground' : ''}>
                        ৳{product.price ? Math.round(product.price) : '0'}
                      </span>
                      {product.salePrice && (
                        <span className="font-semibold text-primary">
                          ৳{Math.round(product.salePrice)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={(product.stock ?? 0) <= 5 ? 'text-destructive font-semibold' : ''}>
                      {product.stock ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-muted-foreground">{product.views ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-primary">{product.totalSales ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.isPublished ? 'default' : 'secondary'}>
                      {product.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.push(`/admin/products/${product._id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive" 
                        onClick={() => handleDelete(product._id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {!loading && pagination.totalPages > 1 && (
        <div className="py-4">
          <Pagination 
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              fetchProducts(undefined, page);
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', page.toString());
              router.push(`?${params.toString()}`);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-4 pt-6">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
