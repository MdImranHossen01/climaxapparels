'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Trash, Search, User, Phone, MapPin, Calendar, Download, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

function AbandonedCartsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentPage, setCurrentPage] = useState(Math.max(1, parseInt(searchParams.get('page') || '1')));
  const [carts, setCarts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: '',
  });

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    if (currentPage > 1) {
      setCurrentPage(1);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      router.push(`/admin/abandoned-carts?${params.toString()}`);
    }
  }, [debouncedSearch, dateFilter.from, dateFilter.to]); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchronize URL page param with state
  useEffect(() => {
    const pageFromParams = Math.max(1, parseInt(searchParams.get('page') || '1'));
    if (pageFromParams !== currentPage) {
      setCurrentPage(pageFromParams);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCarts = async (pageVal = currentPage) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pageVal.toString(),
        limit: '20',
        search: debouncedSearch,
        from: dateFilter.from,
        to: dateFilter.to
      });

      const res = await fetch(`/api/cart/abandoned?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch abandoned carts');
      const data = await res.json();
      
      setCarts(data.carts || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load abandoned carts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts(currentPage);
  }, [currentPage, debouncedSearch, dateFilter.from, dateFilter.to]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    router.push(`/admin/abandoned-carts?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Remove Abandoned Cart?',
      text: 'Are you sure you want to delete this abandoned cart session?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/cart/abandoned?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Abandoned cart removed');
        fetchCarts(currentPage);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to delete abandoned cart');
      }
    } catch (error) {
      toast.error('Failed to delete abandoned cart');
    }
  };

  const exportToCSV = async () => {
    try {
      toast.info('Preparing data for export...');
      const queryParams = new URLSearchParams({
        limit: 'all',
        search: debouncedSearch,
        from: dateFilter.from,
        to: dateFilter.to
      });

      const res = await fetch(`/api/cart/abandoned?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch data for export');
      const data = await res.json();
      const allCarts = data.carts || [];

      if (allCarts.length === 0) {
        toast.error('No abandoned carts to export');
        return;
      }

      const headers = [
        'Cart ID',
        'Date',
        'Customer Name',
        'Phone',
        'Email',
        'Address',
        'Area',
        'Items List',
        'Total Amount'
      ];

      const rows = allCarts.map((c: any) => {
        const itemsText = c.items.map((i: any) => {
          const variantDesc = [i.color, i.size].filter(Boolean).join('/');
          return `• ${i.quantity} x ${i.name}${variantDesc ? ` [${variantDesc}]` : ''} (@৳${i.price})`;
        }).join('\n');

        return [
          c._id.toUpperCase(),
          format(new Date(c.createdAt), 'yyyy-MM-dd HH:mm'),
          c.fullName,
          c.phone,
          c.email || 'N/A',
          c.street || 'N/A',
          c.deliveryArea === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka',
          itemsText,
          c.totalAmount
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => row.map((cell: any) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `abandoned_carts_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Excel/CSV export completed');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export data');
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Abandoned Carts</h1>
          <p className="text-muted-foreground text-sm">
            Track visitors who filled checkout info but left without completing order.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchCarts(currentPage)} className="h-9">
            <RefreshCw className="mr-2 h-4 w-4" /> Reload
          </Button>
          <Button variant="default" size="sm" onClick={exportToCSV} className="h-9 bg-primary text-primary-foreground hover:bg-primary/95">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Date Filters & Search */}
      <Card className="bg-card/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">From Date</label>
              <Input
                type="date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">To Date</label>
              <Input
                type="date"
                value={dateFilter.to}
                onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                className="h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cart Sessions</CardTitle>
          <CardDescription>
            Showing {carts.length} of {totalCount} active abandoned cart sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center items-center text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading abandoned carts...
            </div>
          ) : carts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No abandoned carts found.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Details</TableHead>
                      <TableHead>Cart Items</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carts.map((cart) => (
                      <TableRow key={cart._id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="max-w-[250px] align-top">
                          <div className="space-y-1">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              {cart.fullName}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <a href={`tel:${cart.phone}`} className="hover:underline text-primary font-medium">
                                {cart.phone}
                              </a>
                            </div>
                            {cart.email && (
                              <div className="text-xs text-muted-foreground truncate ml-5">
                                {cart.email}
                              </div>
                            )}
                            {cart.street && (
                              <div className="text-xs text-muted-foreground flex items-start gap-1 mt-1 max-w-[220px] whitespace-normal">
                                <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                                <span>
                                  {cart.street} {cart.deliveryArea && `(${cart.deliveryArea === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'})`}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px] align-top">
                          <div className="space-y-2">
                            {cart.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-8 w-8 object-cover rounded bg-muted shrink-0"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-foreground truncate">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.color && `Color: ${item.color} `}
                                    {item.size && `Size: ${item.size} `}
                                    Qty: {item.quantity} × ৳{item.price}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-primary align-top">
                          ৳{Math.round(cart.totalAmount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground align-top">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{format(new Date(cart.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-top">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cart._id)}
                            className="hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Component */}
              <div className="flex items-center justify-end">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  baseUrl="/admin/abandoned-carts"
                  query={{
                    search: debouncedSearch,
                    from: dateFilter.from,
                    to: dateFilter.to
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AbandonedCartsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <AbandonedCartsContent />
    </Suspense>
  );
}
