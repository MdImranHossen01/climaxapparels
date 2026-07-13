'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Filter,
  Search,
  X,
  LayoutGrid,
  LayoutList,
  SlidersHorizontal
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';

interface ShopCategory {
  _id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

interface ShopProduct {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  createdAt: string;
  isPublished: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  ratings?: number;
  numReviews?: number;
  images: string[];
  stock: number;
  categories?: any[];
}

interface ShopClientProps {
  initialProducts: ShopProduct[];
  initialCategories: ShopCategory[];
}

export default function ShopClient({ initialProducts, initialCategories }: ShopClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialCategory = searchParams.get('category');
  const initialSearch = searchParams.get('q');
  const initialFilter = searchParams.get('filter');

  const [products] = useState<ShopProduct[]>(initialProducts);
  const [categories] = useState<ShopCategory[]>(initialCategories);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [showOnlyNew, setShowOnlyNew] = useState(initialFilter === 'new');
  const [showOnlySale, setShowOnlySale] = useState(initialFilter === 'sale');
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(initialFilter === 'featured');
  const [showOnlyTrending, setShowOnlyTrending] = useState(initialFilter === 'trending');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const itemsPerPage = 20;
  // Sync page from URL parameter
  useEffect(() => {
    const urlPage = Number(searchParams.get('page')) || 1;
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage);
    }
  }, [searchParams, currentPage]);

  const skipClampRef = useRef(false);
  const isMounted = useRef(false);

  // Sync state to URL without full reload
  const setPageAndUrl = useCallback((page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Reset page to 1 when filters change
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    skipClampRef.current = true;
    setCurrentPage(1);
    
    const params = new URLSearchParams(window.location.search);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [selectedCategories, minPrice, maxPrice, sortBy, searchTerm, showOnlyNew, showOnlySale, showOnlyFeatured, showOnlyTrending, pathname, router]);

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 ||
        (p.categories ?? []).some((c) => selectedCategories.includes(c.slug || '') || selectedCategories.includes(c._id || ''));
      const price = p.salePrice || p.price;
      const min = minPrice !== '' ? Number(minPrice) : 0;
      const max = maxPrice !== '' ? Number(maxPrice) : Infinity;
      const matchesPrice = price >= min && price <= max;
      const matchesNewArrival = !showOnlyNew || p.isNewArrival === true;
      const matchesSale = !showOnlySale || (p.salePrice !== undefined && p.salePrice !== null && p.salePrice < p.price);
      const matchesFeatured = !showOnlyFeatured || p.isFeatured === true;
      const matchesTrending = !showOnlyTrending || ((p.ratings || 0) >= 4 || (p.numReviews || 0) > 0);

      return matchesSearch && matchesCategory && matchesPrice && matchesNewArrival && matchesSale && matchesFeatured && matchesTrending;
    })
    .sort((a, b) => {
      const priceA = a.salePrice || a.price;
      const priceB = b.salePrice || b.price;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (showOnlyTrending) {
        return ((b.ratings || 0) * (b.numReviews || 0)) - ((a.ratings || 0) * (a.numReviews || 0));
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (skipClampRef.current) {
      skipClampRef.current = false;
      return;
    }
    if (products.length > 0) {
      const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
      if (safePage !== currentPage) {
        setPageAndUrl(safePage);
      }
    }
  }, [currentPage, totalPages, products.length, setPageAndUrl]);

  const toggleCategory = (slug: string) => {
    setSelectedCategories(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setSearchTerm('');
    setShowOnlyNew(false);
    setShowOnlySale(false);
    setShowOnlyFeatured(false);
    setShowOnlyTrending(false);
  };

  const renderSidebar = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Categories</h3>
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat._id} className="flex items-center space-x-2">
              <Checkbox
                id={cat._id}
                checked={selectedCategories.includes(cat.slug)}
                onCheckedChange={() => toggleCategory(cat.slug)}
              />
              <Label
                htmlFor={cat._id}
                className="text-sm font-medium leading-none cursor-pointer hover:text-primary transition-colors"
              >
                {cat.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Price Range</h3>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">৳</span>
            <Input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="pl-6 text-sm"
            />
          </div>
          <span className="text-muted-foreground text-xs font-medium">to</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">৳</span>
            <Input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="pl-6 text-sm"
            />
          </div>
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={clearFilters}>
        Reset All Filters
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 md:px-0 py-10">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 md:block sticky top-20 self-start h-fit max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
          {renderSidebar()}
        </aside>

        <div className="flex-1 space-y-6">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden flex items-center gap-1">
                    <Filter className="h-4 w-4" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-6 overflow-y-auto">
                  <SheetHeader className="mb-6 p-0">
                    <SheetTitle>Filter Products</SheetTitle>
                  </SheetHeader>
                  {renderSidebar()}
                </SheetContent>
              </Sheet>

              <Select value={sortBy} onValueChange={(val) => {
                if (val) setSortBy(val);
              }}>
                <SelectTrigger className="w-full sm:w-[180px]" aria-label="Sort products">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest Arrivals</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden items-center border rounded-md p-1 sm:flex">
                <Button
                  variant={view === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView('list')}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length === 0 ? '0 products found' : `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredProducts.length)} of ${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}`}
            </p>
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Live Cache Active
            </Badge>
          </div>

          {/* Active Filters Bar */}
          {(selectedCategories.length > 0 || searchTerm || minPrice !== '' || maxPrice !== '' || showOnlyNew) && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold uppercase text-muted-foreground mr-2">Filtered By:</span>
              {selectedCategories.map(cat => (
                <Badge key={cat} variant="secondary" className="gap-1 rounded-full px-3 py-1">
                  {categories.find(c => c.slug === cat)?.name || cat} <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCategory(cat)} />
                </Badge>
              ))}
              {searchTerm && (
                <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                  Search: {searchTerm} <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                </Badge>
              )}
              {(minPrice !== '' || maxPrice !== '') && (
                <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                  Price: ৳{minPrice || '0'} - ৳{maxPrice || '∞'} <X className="h-3 w-3 cursor-pointer" onClick={() => { setMinPrice(''); setMaxPrice(''); }} />
                </Badge>
              )}
              {showOnlyNew && (
                <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                  New Arrivals <X className="h-3 w-3 cursor-pointer" onClick={() => setShowOnlyNew(false)} />
                </Badge>
              )}
              {showOnlySale && (
                <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                  Sale Items <X className="h-3 w-3 cursor-pointer" onClick={() => setShowOnlySale(false)} />
                </Badge>
              )}
              {showOnlyFeatured && (
                <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                  Featured <X className="h-3 w-3 cursor-pointer" onClick={() => setShowOnlyFeatured(false)} />
                </Badge>
              )}
              {showOnlyTrending && (
                <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                  Trending <X className="h-3 w-3 cursor-pointer" onClick={() => setShowOnlyTrending(false)} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="rounded-full bg-muted p-6">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold">No products found</h2>
              <p className="text-muted-foreground max-w-xs">
                Try adjusting your filters or search terms to find what you&apos;re looking for.
              </p>
              <Button variant="outline" onClick={clearFilters}>Reset All Filters</Button>
            </div>
          ) : (
            <div className={`grid gap-6 ${view === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {paginatedProducts.map((product, index) => (
                <ProductCard key={product._id} product={product} priority={index < 4} />
              ))}
            </div>
          )}

          {filteredProducts.length > 0 && totalPages > 1 && (
            <div className="mt-8 border-t pt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setPageAndUrl(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

