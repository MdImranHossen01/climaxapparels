'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import OrderDetailsDialog from '@/components/admin/OrderDetailsDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Eye,
  Package,
  Truck,
  CheckCircle,
  Trash2,
  XCircle,
  Download,
  MoreHorizontal,
  ChevronDown,
  Printer,
  FileText,
  Filter as FilterIcon,
  Copy,
  Search
} from 'lucide-react';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    width="1em"
    height="1em"
    {...props}
  >
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.054L2 22l5.132-1.347a9.937 9.937 0 004.877 1.28h.005c5.505 0 9.989-4.478 9.99-9.985A9.992 9.992 0 0012.012 2zm5.836 14.199c-.32.899-1.576 1.706-2.185 1.761-.559.05-1.286.074-2.074-.176a9.839 9.839 0 01-4.705-3.023 9.388 9.388 0 01-1.926-3.412 5.097 5.097 0 01-.137-2.138c.112-.601.442-1.01.691-1.272.249-.262.502-.328.67-.328.167 0 .335.006.475.014.148.009.347-.058.544.417.202.489.691 1.684.75 1.805.059.12.098.262.019.41-.079.158-.12.262-.24.399-.118.136-.251.306-.358.411-.118.114-.242.238-.104.475.138.238.614 1.01.32.957.382.341.703.56.963.666.26.106.41.088.56-.079.15-.167.643-.75.814-.999.171-.249.34-.208.573-.122.233.086 1.48.697 1.737.825.257.128.428.192.488.295.06.103.06.596-.26 1.495z"/>
  </svg>
);
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { generateInvoicePDF } from '@/lib/invoice-generator';
import { printStickerInvoice } from '@/lib/sticker-generator';


const fraudCache: { [phone: string]: { success_ratio: number; total_parcel: number } | null } = {};
const fraudPendingRequests: { [phone: string]: Promise<any> | null } = {};

function FraudCheckBadge({ phone }: { phone?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!phone) return;

    if (fraudCache[phone] !== undefined) {
      setData(fraudCache[phone]);
      return;
    }

    const fetchFraud = async () => {
      setLoading(true);
      try {
        let promise = fraudPendingRequests[phone];
        if (!promise) {
          promise = fetch(`/api/admin/courier/fraud-check?phone=${phone}`).then(res => {
            if (res.ok) return res.json();
            throw new Error('Failed');
          });
          fraudPendingRequests[phone] = promise;
        }
        
        const json = await promise;
        if (json?.status === 'success' && json?.data?.summary) {
          const summary = json.data.summary;
          fraudCache[phone] = {
            success_ratio: summary.success_ratio,
            total_parcel: summary.total_parcel
          };
        } else {
          fraudCache[phone] = null;
        }
      } catch (e) {
        fraudCache[phone] = null;
      } finally {
        setData(fraudCache[phone]);
        setLoading(false);
        delete fraudPendingRequests[phone];
      }
    };

    fetchFraud();
  }, [phone]);

  if (loading) {
    return <span className="text-[10px] text-muted-foreground ml-1.5 animate-pulse">Checking...</span>;
  }

  if (!data) return null;

  const ratio = data.success_ratio;
  const colorClass = ratio >= 80 ? 'text-green-600 font-extrabold' : ratio >= 60 ? 'text-yellow-600 font-extrabold' : 'text-red-600 font-extrabold';

  return (
    <span className={`text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 ${colorClass}`} title={`${data.total_parcel} total parcels`}>
      {ratio}% Success
    </span>
  );
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(Math.max(1, parseInt(searchParams.get('page') || '1')));

  const [orders, setOrders] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<any>({
    all: 0,
    placed: 0,
    confirmed: 0,
    paid: 0,
    ready: 0,
    released: 0,
    delivered: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: '',
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    if (currentPage > 1) {
      setCurrentPage(1);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      router.push(`/admin/orders?${params.toString()}`);
    }
  }, [debouncedSearchTerm, statusFilter, dateFilter.from, dateFilter.to]);

  const handleDownloadInvoice = async (order: any) => {
    try {
      toast.info('Generating PDF invoice...');
      await generateInvoicePDF(order, settings);
    } catch (error) {
      toast.error('Failed to generate PDF invoice');
    }
  };

  const handlePrint = async (ids: string[]) => {
    const toPrint = orders.filter(o => ids.includes(o._id));
    if (toPrint.length === 0) {
      toast.error('No orders found to print');
      return;
    }
    toast.info(`Generating ${toPrint.length > 1 ? toPrint.length + ' invoices' : 'invoice'}...`);
    await generateInvoicePDF(toPrint, settings, 'print');
  };

  const handlePrintStickers = async (ids: string[]) => {
    const toPrint = orders.filter(o => ids.includes(o._id));
    if (toPrint.length === 0) {
      toast.error('No orders found to print');
      return;
    }
    toast.info('Preparing sticker invoice...');
    await printStickerInvoice(toPrint, settings);
  };

  const fetchOrders = async (pageVal = currentPage) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        all: 'true',
        page: pageVal.toString(),
        limit: '20',
        search: debouncedSearchTerm,
        status: statusFilter,
        from: dateFilter.from,
        to: dateFilter.to
      });
      const res = await fetch(`/api/orders?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load orders: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
      if (data.counts) {
        setStatusCounts(data.counts);
      }

      // Also fetch settings for the invoice generator
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        setSettings(await settingsRes.json());
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, debouncedSearchTerm, statusFilter, dateFilter.from, dateFilter.to]);

  useEffect(() => {
    const pageFromParams = Math.max(1, parseInt(searchParams.get('page') || '1'));
    if (pageFromParams !== currentPage) {
      setCurrentPage(pageFromParams);
    }
  }, [searchParams]);

  const filteredOrders = orders;

  const toggleSelectAll = () => {
    const filteredIds = filteredOrders.map(o => o._id);
    const areAllSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));

    if (areAllSelected) {
      // Unselect only the filtered ones
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Add missing filtered ones to selection
      setSelectedIds(prev => [...prev, ...filteredIds.filter(id => !prev.includes(id))]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const updateStatus = async (id: string, status: string, extraData: any = {}) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extraData }),
      });

      if (res.ok) {
        toast.success(`Order updated successfully`);
        fetchOrders();
      } else {
        toast.error('Failed to update order');
      }
    } catch (error) {
      toast.error('Error updating order');
    }
  };

  const handleBulkUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
      title: 'Bulk Update?',
      text: `Are you sure you want to update ${selectedIds.length} orders to "${status}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00D1B2',
      confirmButtonText: 'Yes, update them!'
    });

    if (!result.isConfirmed) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, status }),
      });

      if (res.ok) {
        toast.success(`Bulk update completed successfully`);
        setSelectedIds([]);
        fetchOrders();
      } else {
        toast.error('Bulk update failed');
      }
    } catch (error) {
      toast.error('Error in bulk update');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
      title: 'Bulk Delete?',
      text: `Are you sure you want to permanently delete ${selectedIds.length} orders? This cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete all!'
    });

    if (!result.isConfirmed) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (res.ok) {
        toast.success(`Orders deleted successfully`);
        setSelectedIds([]);
        fetchOrders();
      } else {
        toast.error('Bulk delete failed');
      }
    } catch (error) {
      toast.error('Error in bulk delete');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const exportToCSV = () => {
    const ordersToExport = selectedIds.length > 0
      ? orders.filter(o => selectedIds.includes(o._id))
      : filteredOrders;

    if (ordersToExport.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const headers = [
      'Order ID',
      'Date',
      'Customer',
      'Email',
      'Phone',
      'Address',
      'Division/State',
      'Items',
      'Shipping Charge',
      'Discount',
      'Total Amount',
      'Purchase Cost',
      'Profit',
      'Payment Status',
      'Order Status'
    ];

    const rows = ordersToExport.map(o => {
      const shipping = o.shippingAddress || {};
      const fullAddress = `${shipping.street || ''}, ${shipping.city || ''}`;
      const itemsList = o.items.map((i: any) => {
        const variantDesc = [i.color, i.size].filter(Boolean).join('/');
        return `• ${i.quantity} x ${i.name}${variantDesc ? ` [${variantDesc}]` : ''} (@৳${i.price})`;
      }).join('\n');

      // Profit Calculation: Total - COGS - DeliveryCharge
      const totalPurchaseCost = o.items.reduce((acc: number, i: any) => acc + ((i.purchasePrice || 0) * i.quantity), 0);
      const profit = o.totalAmount - totalPurchaseCost - (o.deliveryCharge || 0);

      return [
        o._id.toUpperCase(),
        format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm'),
        shipping.fullName || o.user?.name || 'Guest',
        o.user?.email || 'Guest',
        shipping.phone || 'N/A',
        fullAddress,
        shipping.division || shipping.state || 'N/A',
        itemsList,
        o.deliveryCharge || 0,
        o.couponDiscountAmount || 0,
        o.totalAmount,
        totalPurchaseCost,
        Math.round(profit),
        o.paymentStatus,
        o.status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Excel/CSV export started');
  };

  const deleteOrder = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This order will be permanently deleted from the database!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00D1B2',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/orders/${id}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          toast.success('Order deleted successfully');
          fetchOrders();
        } else {
          toast.error('Failed to delete order');
        }
      } catch (error) {
        toast.error('Error deleting order');
      }
    }
  };

  const handleSendToSteadfast = async (ids: string[]) => {
    if (ids.length === 0) return;

    const result = await Swal.fire({
      title: 'Send to Steadfast?',
      text: `Are you sure you want to send ${ids.length} order(s) to Steadfast Courier?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Yes, send now!'
    });

    if (!result.isConfirmed) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/admin/courier/steadfast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: ids }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        if (ids.length > 1) setSelectedIds([]);
        fetchOrders();
      } else {
        toast.error(data.message || 'Submission failed');
      }
    } catch (error) {
      toast.error('Error sending to Steadfast');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const result = await Swal.fire({
      title: 'Cancel Order?',
      text: "Are you sure you want to cancel this order?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Yes, cancel it!',
    });

    if (result.isConfirmed) {
      await updateStatus(orderId, 'Cancelled');
    }
  };

  const openDetails = (id: string) => {
    setSelectedOrderId(id);
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Order Placed': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-none">Placed</Badge>;
      case 'Confirmed': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none">Confirmed</Badge>;
      case 'Paid': return <Badge variant="secondary" className="bg-green-100 text-green-800 border-none text-[10px]">Paid</Badge>;
      case 'Ready for Delivery': return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-none text-[10px]">Ready</Badge>;
      case 'Released for Delivery': return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-none text-[10px]">Released</Badge>;
      case 'Delivered': return <Badge variant="default" className="bg-green-600 text-white border-none">Delivered</Badge>;
      case 'Cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight whitespace-nowrap">Order Management</h2>
          <p className="text-muted-foreground text-xs md:text-sm hidden sm:block">Review, fulfillment and track shop orders.</p>
        </div>
        <Button onClick={exportToCSV} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shrink-0">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      {/* Search and Date Range Row (1 Row) */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full">
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full h-10"
          />
        </div>

        <div className="block md:hidden w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 w-full">
                <FilterIcon className="mr-2 h-4 w-4" />
                {statusFilter === 'All' ? 'All Status' : statusFilter}
                <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { label: 'All', value: 'All', count: statusCounts.all },
                  { label: 'Placed', value: 'Order Placed', count: statusCounts.placed },
                  { label: 'Confirmed', value: 'Confirmed', count: statusCounts.confirmed },
                  { label: 'Paid', value: 'Paid', count: statusCounts.paid },
                  { label: 'Ready', value: 'Ready for Delivery', count: statusCounts.ready },
                  { label: 'Released', value: 'Released for Delivery', count: statusCounts.released },
                  { label: 'Delivered', value: 'Delivered', count: statusCounts.delivered },
                  { label: 'Cancelled', value: 'Cancelled', count: statusCounts.cancelled }
                ].map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={statusFilter === status.value ? "bg-accent font-bold" : ""}
                  >
                    <div className="flex items-center justify-between w-full text-xs">
                      <span>{status.label}</span>
                      <Badge variant="secondary" className="ml-2 text-[9px] px-1.5 py-0">
                        {status.count ?? 0}
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border w-full md:w-auto h-10">
          <Input
            type="date"
            className="h-8 w-full md:w-36 border-none bg-transparent focus-visible:ring-0"
            value={dateFilter.from}
            onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="date"
            className="h-8 w-full md:w-36 border-none bg-transparent focus-visible:ring-0"
            value={dateFilter.to}
            onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
          />
        </div>

        {(statusFilter !== 'All' || dateFilter.from || dateFilter.to || searchTerm) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('All');
              setDateFilter({ from: '', to: '' });
              setSearchTerm('');
            }}
            className="text-xs text-muted-foreground hover:text-primary shrink-0"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Status Tabs Row (Desktop only - Full Width Grid) */}
      <div className="hidden md:grid md:grid-cols-8 gap-2 pb-2 border-b">
        {[
          { label: 'All', value: 'All', count: statusCounts.all },
          { label: 'Placed', value: 'Order Placed', count: statusCounts.placed },
          { label: 'Confirmed', value: 'Confirmed', count: statusCounts.confirmed },
          { label: 'Paid', value: 'Paid', count: statusCounts.paid },
          { label: 'Ready', value: 'Ready for Delivery', count: statusCounts.ready },
          { label: 'Released', value: 'Released for Delivery', count: statusCounts.released },
          { label: 'Delivered', value: 'Delivered', count: statusCounts.delivered },
          { label: 'Cancelled', value: 'Cancelled', count: statusCounts.cancelled }
        ].map((status) => {
          const isActive = statusFilter === status.value;
          return (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`w-full py-2 text-xs font-semibold rounded-md transition-all duration-200 text-center truncate flex items-center justify-center gap-1.5 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background hover:bg-muted text-muted-foreground border border-input'
              }`}
              title={`${status.label} (${status.count ?? 0})`}
            >
              <span>{status.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-muted text-muted-foreground border'
              }`}>
                {status.count ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-md border bg-background overflow-hidden relative">
        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="sticky top-0 z-20 w-full bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-4 text-sm font-medium">
              <span>{selectedIds.length} orders selected</span>
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
                onClick={() => handlePrint(selectedIds)}
              >
                <Printer className="mr-2 h-3 w-3" /> Print Invoices
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => handlePrintStickers(selectedIds)}
              >
                <Printer className="mr-2 h-3 w-3" /> Print Stickers
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="bg-orange-500 text-white hover:bg-orange-600 border-none"
                onClick={() => handleSendToSteadfast(selectedIds)}
              >
                <Truck className="mr-2 h-3 w-3" /> Send to Steadfast
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white text-primary hover:bg-white/90">
                    Update Status <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Change Status to:</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkUpdate('Confirmed')}>Confirmed</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdate('Paid')}>Paid</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdate('Ready for Delivery')}>Ready for Delivery</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdate('Released for Delivery')}>Released for Delivery</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdate('Delivered')}>Delivered</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Order Info</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order._id} className={selectedIds.includes(order._id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(order._id)}
                      onCheckedChange={() => toggleSelect(order._id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => openDetails(order._id)}
                        >
                          <span className={`font-bold hover:underline ${order.isDuplicate ? 'text-red-500 font-extrabold' : order.isRepeat ? 'text-yellow-600 font-extrabold' : 'text-primary'}`}>
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                        </button>
                        {order.isDuplicate ? (
                          <Badge className="bg-red-500 text-white hover:bg-red-600 border-none text-[9px] px-1 py-0 h-4">Duplicate</Badge>
                        ) : order.isRepeat ? (
                          <Badge className="bg-yellow-500 text-black hover:bg-yellow-600 border-none text-[9px] px-1 py-0 h-4">Repeat</Badge>
                        ) : null}
                      </div>
                      
                      <div className="flex flex-col text-[11px] text-slate-700 dark:text-zinc-300 mt-1 space-y-0.5">
                        <span className="font-semibold text-slate-900 dark:text-white">{order.shippingAddress?.fullName || order.user?.name || 'Guest User'}</span>
                        <div className="flex items-center gap-1.5">
                          <span 
                            onClick={() => order.shippingAddress?.phone && setSearchTerm(order.shippingAddress.phone)}
                            className="text-muted-foreground hover:text-primary cursor-pointer hover:underline font-medium"
                          >
                            {order.shippingAddress?.phone || 'No Phone'}
                          </span>
                          {order.shippingAddress?.phone && (
                            <>
                              <a 
                                href={`https://wa.me/${order.shippingAddress.phone.replace(/[^0-9]/g, '').startsWith('88') ? order.shippingAddress.phone.replace(/[^0-9]/g, '') : '88' + (order.shippingAddress.phone.replace(/[^0-9]/g, '').startsWith('0') ? order.shippingAddress.phone.replace(/[^0-9]/g, '').slice(1) : order.shippingAddress.phone.replace(/[^0-9]/g, ''))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-700 transition-colors p-0.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded"
                                title="Chat on WhatsApp"
                              >
                                <WhatsAppIcon className="h-3.5 w-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(order.shippingAddress.phone);
                                  toast.success('Phone number copied!');
                                }}
                                className="text-muted-foreground hover:text-primary transition-colors p-0.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded animate-in fade-in duration-200"
                                title="Copy Phone Number"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                        {order.shippingAddress?.phone && (
                          <div className="mt-0.5">
                            <FraudCheckBadge phone={order.shippingAddress.phone} />
                          </div>
                        )}
                        <span className="text-muted-foreground truncate max-w-[150px]">{order.user?.email || 'No Email'}</span>
                        <span className="text-[10px] text-muted-foreground uppercase mt-0.5">
                          {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, p') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {order.items?.map((item: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-[9px] px-1 py-0 font-normal truncate max-w-[180px]">
                            {item.quantity}× {item.name}
                            {(item.color || item.size) && (
                              <span className="text-muted-foreground ml-1">
                                ({[item.color, item.size].filter(Boolean).join('/')})
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>
                      {order.internalNote && (
                        <div className="mt-1 text-[10px] bg-yellow-50 dark:bg-yellow-950/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-yellow-200/50 font-medium whitespace-pre-line max-w-[200px]" title={order.internalNote}>
                          Note: {order.internalNote}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">৳{Math.round(order.totalAmount ?? 0)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="outline"
                        className={order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700 border-none font-bold' : 'bg-yellow-100 text-yellow-700 border-none font-bold'}
                      >
                        {order.paymentStatus}
                      </Badge>
                      {order.paymentMethod === 'Manual' && order.manualPaymentDetails && (
                        <div className="flex flex-col text-[10px] text-muted-foreground bg-slate-50 dark:bg-zinc-900 p-1.5 rounded border border-slate-100 dark:border-zinc-800 font-mono">
                          <span className="font-bold text-primary uppercase text-[9px]">{order.manualPaymentDetails.methodName}</span>
                          {order.manualPaymentDetails.senderNumber && (
                            <span>No: {order.manualPaymentDetails.senderNumber}</span>
                          )}
                          {order.manualPaymentDetails.transactionId && (
                            <span className="truncate max-w-[120px] font-bold text-slate-800 dark:text-zinc-200" title={order.manualPaymentDetails.transactionId}>
                              TrxID: {order.manualPaymentDetails.transactionId}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {order.paymentMethod === 'Manual' && order.paymentStatus === 'Pending' && order.status !== 'Cancelled' && (
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" 
                            title="Approve Manual Payment"
                            onClick={() => {
                              Swal.fire({
                                title: 'Approve Payment?',
                                text: `Are you sure you want to approve manual payment for order #${order._id.slice(-8).toUpperCase()}? This will mark the order as Confirmed & Paid.`,
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonColor: '#00D1B2',
                                confirmButtonText: 'Yes, Approve!'
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  updateStatus(order._id, 'Confirmed', { paymentStatus: 'Paid' });
                                }
                              });
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" 
                            title="Cancel Order"
                            onClick={() => handleCancelOrder(order._id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openDetails(order._id)}>
                        <Eye className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleDownloadInvoice(order)}>
                              <FileText className="mr-2 h-4 w-4 text-primary" /> Download Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrint([order._id])}>
                              <Printer className="mr-2 h-4 w-4 text-primary" /> Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintStickers([order._id])}>
                              <Printer className="mr-2 h-4 w-4 text-primary" /> Print Sticker Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendToSteadfast([order._id])} disabled={!!order.shippingDetails?.consignmentId}>
                              <Truck className="mr-2 h-4 w-4 text-orange-500" /> Send to Steadfast
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => updateStatus(order._id, 'Confirmed')}>Confirm</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(order._id, 'Paid', { paymentStatus: 'Paid' })}>Mark Paid</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(order._id, 'Ready for Delivery')}>Ready for Delivery</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(order._id, 'Released for Delivery')}>Release for Delivery</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(order._id, 'Delivered')}>Mark Delivered</DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleCancelOrder(order._id)}>Cancel Order</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive font-bold" onClick={() => deleteOrder(order._id)}>Delete Order</DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="py-6 border-t bg-white px-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                fetchOrders(page);
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', page.toString());
                router.push(`?${params.toString()}`);
              }}
            />
          </div>
        )}
      </div>

      <OrderDetailsDialog
        orderId={selectedOrderId}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onUpdate={fetchOrders}
      />


      {bulkActionLoading && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-bold">Processing bulk action...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
