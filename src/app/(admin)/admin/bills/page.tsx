'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Plus,
  Trash2,
  Printer,
  Download,
  DollarSign,
  Users,
  Search,
  CreditCard,
  FileText,
  Package,
  ChevronDown,
  X,
  Eye,
  MapPin,
  Phone,
  User,
  CalendarDays,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { generateBillPDF } from '@/lib/bill-invoice-generator';
import { Pagination } from '@/components/ui/pagination';

interface BillItemInput {
  name: string;
  quantity: number;
  price: number;
}

export default function ClientBillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [settings, setSettings] = useState<any>(null);
  
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 when search or status or date filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter.from, dateFilter.to]);

  // Bill detail view state
  const [selectedBill, setSelectedBill] = useState<any>(null);

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form states
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [billItems, setBillItems] = useState<BillItemInput[]>([
    { name: '', quantity: 1, price: 0 }
  ]);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [serviceFee, setServiceFee] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [prevDue, setPrevDue] = useState<number>(0);
  const [cashIn, setCashIn] = useState<number>(0);
  const [expectedReceivableDate, setExpectedReceivableDate] = useState('');

  // Product multi-select state
  const [productSearchTerm, setProductSearchTerm] = useState('');
  // Map of productId → variantId (null = base product, string = variant _id)
  const [selectedProductVariants, setSelectedProductVariants] = useState<Record<string, string | null>>({});
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  // Phone validation
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    fetchBills();
    fetchProducts();
    fetchSettings();
  }, [statusFilter]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/bills?filter=${statusFilter}&type=bill`);
      if (!res.ok) throw new Error('Failed to fetch bills');
      const data = await res.json();
      setBills(data);
    } catch (error) {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=100');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  // Calculations
  const subtotal = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = discountType === 'percentage'
    ? Math.round((subtotal * discountValue) / 100)
    : discountValue;
  const total = Math.max(0, subtotal + deliveryCharge + serviceFee - discount);
  const gTotal = total + prevDue;
  const currentBillDue = Math.max(0, gTotal - cashIn);
  const calculatedStatus = currentBillDue <= 0 ? 'Paid' : 'Due';

  const validatePhone = (phone: string) => {
    const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!bdPhoneRegex.test(phone.replace(/\s/g, ''))) {
      setPhoneError('Enter a valid BD number (e.g. 017XXXXXXXX)');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const toggleProductVariant = (productId: string, variantId: string | null) => {
    setSelectedProductVariants(prev => {
      const current = prev[productId];
      // Clicking the same selection again → deselect
      if (current === variantId) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: variantId };
    });
  };

  const selectedCount = Object.keys(selectedProductVariants).length;

  const handleAddSelectedProducts = () => {
    const newItems: BillItemInput[] = [];

    Object.entries(selectedProductVariants).forEach(([productId, variantId]) => {
      const prod = products.find(p => p._id === productId);
      if (!prod) return;

      if (variantId === null) {
        // Base product (no variant chosen)
        newItems.push({ name: prod.name, price: prod.salePrice || prod.price || 0, quantity: 1 });
      } else {
        // Specific variant
        const variant = (prod.variants || []).find((v: any) => v._id === variantId);
        if (!variant) return;
        const label = [prod.name, variant.color, variant.size].filter(Boolean).join(' — ');
        newItems.push({ name: label, price: variant.salePrice || variant.price || 0, quantity: 1 });
      }
    });

    if (newItems.length === 0) return;

    if (billItems.length === 1 && billItems[0].name === '' && billItems[0].price === 0) {
      setBillItems(newItems);
    } else {
      setBillItems(prev => [...prev, ...newItems]);
    }
    setSelectedProductVariants({});
    setProductPickerOpen(false);
    setProductSearchTerm('');
  };

  const handleAddItemRow = () => {
    setBillItems([...billItems, { name: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (billItems.length === 1) {
      setBillItems([{ name: '', quantity: 1, price: 0 }]);
    } else {
      setBillItems(billItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof BillItemInput, value: any) => {
    const updated = [...billItems];
    if (field === 'quantity') {
      updated[index].quantity = Math.max(1, parseInt(value) || 1);
    } else if (field === 'price') {
      updated[index].price = Math.max(0, parseFloat(value) || 0);
    } else {
      updated[index].name = value;
    }
    setBillItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientAddress.trim()) {
      toast.error('Client details are required');
      return;
    }
    if (!validatePhone(clientPhone)) {
      toast.error('Please enter a valid Bangladesh phone number');
      return;
    }

    const validItems = billItems.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      toast.error('At least one item with a name is required');
      return;
    }

    if (calculatedStatus === 'Due' && !expectedReceivableDate) {
      toast.error('Expected receivable date is required for due bills');
      return;
    }

    try {
      setFormLoading(true);
      const billData = {
        clientName,
        clientPhone,
        clientAddress,
        items: validItems,
        subtotal,
        deliveryCharge,
        serviceFee,
        discountType,
        discountValue,
        discount,
        total,
        prevDue,
        gTotal,
        cashIn,
        currentBillDue,
        status: calculatedStatus,
        expectedReceivableDate: calculatedStatus === 'Due' ? expectedReceivableDate : undefined,
        documentType: 'bill'
      };

      const res = await fetch('/api/admin/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create bill');
      }

      const createdBill = await res.json();
      toast.success('Bill generated successfully!');

      // Auto-trigger download
      await generateBillPDF(createdBill, settings, 'download');

      setIsCreateOpen(false);
      resetForm();
      fetchBills();
    } catch (error: any) {
      toast.error(error.message || 'Error creating bill');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    setPhoneError('');
    setClientAddress('');
    setBillItems([{ name: '', quantity: 1, price: 0 }]);
    setDeliveryCharge(0);
    setServiceFee(0);
    setDiscountType('fixed');
    setDiscountValue(0);
    setPrevDue(0);
    setCashIn(0);
    setExpectedReceivableDate('');
    setSelectedProductVariants({});
    setProductSearchTerm('');
    setProductPickerOpen(false);
  };

  const handleUpdateStatus = async (billId: string, currentDue: number) => {
    const { value: paidAmount } = await Swal.fire({
      title: 'Update Payment Cash-in',
      input: 'number',
      inputLabel: 'Amount Paid ($)',
      inputValue: currentDue,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || isNaN(Number(value)) || Number(value) < 0) {
          return 'Please enter a valid positive amount';
        }
      }
    });

    if (paidAmount !== undefined) {
      try {
        const amount = Number(paidAmount);
        const bill = bills.find(b => b._id === billId);
        if (!bill) return;

        const newCashIn = (bill.cashIn || 0) + amount;
        const newDue = Math.max(0, bill.gTotal - newCashIn);
        const newStatus = newDue <= 0 ? 'Paid' : 'Due';

        const res = await fetch(`/api/admin/bills/${billId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cashIn: newCashIn,
            currentBillDue: newDue,
            status: newStatus
          })
        });

        if (!res.ok) throw new Error('Failed to update bill');
        toast.success('Payment updated successfully');
        fetchBills();
      } catch (error) {
        toast.error('Failed to update payment');
      }
    }
  };

  const handleDeleteBill = async (billId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/admin/bills/${billId}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete bill');
        toast.success('Bill deleted successfully');
        fetchBills();
      } catch (error) {
        toast.error('Failed to delete bill');
      }
    }
  };

  const filteredBills = bills.filter((b) => {
    const term = searchTerm.toLowerCase();
    const name = b.clientName?.toLowerCase() || '';
    const phone = b.clientPhone || '';
    const invoice = b.invoiceNo || '';
    const matchesSearch = name.includes(term) || phone.includes(term) || invoice.includes(term);

    const matchesStatus = statusFilter === 'all' || b.status?.toLowerCase() === statusFilter.toLowerCase();

    let matchesDate = true;
    if (dateFilter.from) {
      matchesDate = matchesDate && new Date(b.date) >= new Date(dateFilter.from + 'T00:00:00');
    }
    if (dateFilter.to) {
      matchesDate = matchesDate && new Date(b.date) <= new Date(dateFilter.to + 'T23:59:59');
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredBills.length / ITEMS_PER_PAGE);
  const paginatedBills = filteredBills.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Metrics
  const totalBilled = bills.reduce((sum, b) => sum + (b.gTotal || 0), 0);
  const totalCollected = bills.reduce((sum, b) => sum + (b.cashIn || 0), 0);
  const accountsReceivable = bills.reduce((sum, b) => sum + (b.currentBillDue || 0), 0);

  return (
    <div className="flex-1 space-y-6 px-0 py-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Client Billing Manager</h2>
          <p className="text-muted-foreground text-sm">Create bills, offer discounts, manage collections & track receivables.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full md:w-auto font-bold bg-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Create Bill
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBilled.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Cumulative client invoicing</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected (Cash-in)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">${totalCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Payments received</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accounts Receivable</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">${accountsReceivable.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding due balances</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, phone or bill no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border text-sm">
            <Input
              type="date"
              className="h-8 w-36 border-none bg-transparent focus-visible:ring-0"
              value={dateFilter.from}
              onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
            />
            <span className="text-muted-foreground text-xs">to</span>
            <Input
              type="date"
              className="h-8 w-36 border-none bg-transparent focus-visible:ring-0"
              value={dateFilter.to}
              onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
          {(dateFilter.from || dateFilter.to || searchTerm || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFilter({ from: '', to: '' });
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Clear All
            </Button>
          )}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {['all', 'paid', 'due'].map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? 'default' : 'outline'}
              onClick={() => setStatusFilter(filter)}
              className="capitalize flex-1 md:flex-none font-bold"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Bill List Table */}
      <div className="rounded-md border bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client Details</TableHead>
              <TableHead className="text-right">Grand Total</TableHead>
              <TableHead className="text-right">Paid (Cash-in)</TableHead>
              <TableHead className="text-right">Due</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Expected Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No bills found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedBills.map((bill) => (
                <TableRow key={bill._id}>
                  <TableCell>
                    <button
                      onClick={() => setSelectedBill(bill)}
                      className="font-bold text-primary hover:underline underline-offset-2 flex items-center gap-1 group transition-colors"
                      title="View Bill Details"
                    >
                      <Hash className="h-3 w-3" />
                      {bill.invoiceNo}
                      <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </TableCell>
                  <TableCell>{format(new Date(bill.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    <div className="font-medium">{bill.clientName}</div>
                    <div className="text-xs text-muted-foreground">{bill.clientPhone}</div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">${bill.gTotal}</TableCell>
                  <TableCell className="text-right text-green-600">${bill.cashIn}</TableCell>
                  <TableCell className="text-right text-orange-600 font-semibold">${bill.currentBillDue}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={bill.status === 'Paid' ? 'default' : 'destructive'} className={bill.status === 'Paid' ? 'bg-green-600 text-white border-none' : ''}>
                      {bill.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {bill.expectedReceivableDate ? format(new Date(bill.expectedReceivableDate), 'dd MMM yyyy') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => generateBillPDF(bill, settings, 'download')}
                        title="Download PDF"
                        className="h-8 w-8 text-blue-600 hover:text-blue-800"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => generateBillPDF(bill, settings, 'print')}
                        title="Print Bill"
                        className="h-8 w-8 text-teal-600 hover:text-teal-800"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      {bill.status === 'Due' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateStatus(bill._id, bill.currentBillDue)}
                          title="Collect Cash"
                          className="h-8 w-8 text-green-600 hover:text-green-800"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteBill(bill._id)}
                        title="Delete Bill"
                        className="h-8 w-8 text-destructive hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="py-4 border-t bg-background px-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Create Bill Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Client Bill</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-sm font-semibold">Client Name *</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Rahim Khan"
                  className="h-11 text-base"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone" className="text-sm font-semibold">Client Phone *</Label>
                <Input
                  id="clientPhone"
                  value={clientPhone}
                  onChange={(e) => {
                    setClientPhone(e.target.value);
                    if (phoneError) validatePhone(e.target.value);
                  }}
                  onBlur={(e) => validatePhone(e.target.value)}
                  placeholder="e.g. 01712345678"
                  className={`h-11 text-base ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  required
                />
                {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientAddress" className="text-sm font-semibold">Client Address *</Label>
                <Input
                  id="clientAddress"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="e.g. Nawabpur, Dhaka"
                  className="h-11 text-base"
                  required
                />
              </div>
            </div>

            {/* Product Multi-Select with Variant Support */}
            <div className="bg-muted/30 p-4 rounded-lg space-y-3 border">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" /> Select Products to Add (Optional)
                </Label>
                {selectedCount > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-bold">
                    {selectedCount} selected
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setProductPickerOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 border rounded-md bg-background text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <span>{selectedCount > 0 ? `${selectedCount} item(s) selected` : 'Click to browse inventory...'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${productPickerOpen ? 'rotate-180' : ''}`} />
              </button>
              {productPickerOpen && (
                <div className="border rounded-md bg-background shadow-sm">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y">
                    {products
                      .filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
                      .map(p => {
                        const hasVariants = p.variants && p.variants.length > 0;
                        const selectedVariantId = selectedProductVariants[p._id];
                        const isSelected = p._id in selectedProductVariants;

                        return (
                          <div key={p._id}>
                            <div
                              className={`flex items-start gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer ${
                                isSelected ? 'bg-primary/5' : ''
                              }`}
                            >
                              {!hasVariants ? (
                                // No variants — simple checkbox
                                <label className="flex items-start gap-3 w-full cursor-pointer">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      toggleProductVariant(p._id, null)
                                    }
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium">{p.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      ${p.salePrice || p.price} · Stock: {p.stock ?? 0}
                                    </div>
                                  </div>
                                </label>
                              ) : (
                                // Has variants — show product name + variant chips below
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span className="text-sm font-semibold">{p.name}</span>
                                    <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                                      {p.variants.length} variants
                                    </span>
                                    {isSelected && (
                                      <span className="ml-auto text-xs text-primary font-bold">✓ Selected</span>
                                    )}
                                  </div>
                                  {/* Variant chips */}
                                  <div className="flex flex-wrap gap-1.5 pl-1">
                                    {p.variants.map((v: any) => {
                                      const vLabel = [v.color, v.size].filter(Boolean).join(' / ') || 'Variant';
                                      const vPrice = v.salePrice || v.price;
                                      const isVariantSelected = selectedVariantId === v._id;
                                      return (
                                        <button
                                          key={v._id}
                                          type="button"
                                          onClick={() => toggleProductVariant(p._id, v._id)}
                                          className={`text-xs px-2.5 py-1 rounded-full border transition-all font-medium ${
                                            isVariantSelected
                                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                              : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'
                                          }`}
                                        >
                                          {vLabel}
                                          <span className={`ml-1 ${isVariantSelected ? 'opacity-80' : 'opacity-60'}`}>
                                            ${vPrice}
                                          </span>
                                          {v.stock !== undefined && (
                                            <span className={`ml-1 text-[10px] ${isVariantSelected ? 'opacity-70' : 'opacity-40'}`}>
                                              ({v.stock} left)
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase())).length === 0 && (
                      <div className="text-center py-4 text-xs text-muted-foreground">No products found</div>
                    )}
                  </div>
                  {selectedCount > 0 && (
                    <div className="p-2 border-t flex gap-2">
                      <Button type="button" size="sm" className="flex-1 font-bold" onClick={handleAddSelectedProducts}>
                        <Plus className="h-3 w-3 mr-1" /> Add {selectedCount} Item(s) to Bill
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => { setSelectedProductVariants({}); setProductPickerOpen(false); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bill Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm">Bill Items</h4>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItemRow} className="font-bold">
                  <Plus className="h-3 w-3 mr-1" /> Add Custom Item
                </Button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {billItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Item Description"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-20"
                      min="1"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={item.price || ''}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      className="w-28"
                      min="0"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItemRow(index)}
                      className="text-destructive hover:bg-destructive/10 shrink-0 h-10 w-10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Adjustments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryCharge">Delivery Charge ($)</Label>
                    <Input
                      id="deliveryCharge"
                      type="number"
                      value={deliveryCharge || ''}
                      onChange={(e) => setDeliveryCharge(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prevDue">Previous Due ($)</Label>
                    <Input
                      id="prevDue"
                      type="number"
                      value={prevDue || ''}
                      onChange={(e) => setPrevDue(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceFee">Service Fee ($) <span className="text-muted-foreground font-normal text-xs">— Optional</span></Label>
                  <Input
                    id="serviceFee"
                    type="number"
                    value={serviceFee || ''}
                    placeholder="0"
                    onChange={(e) => setServiceFee(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 items-end">
                  <div className="space-y-2 col-span-1">
                    <Label>Discount Type</Label>
                    <Select value={discountType} onValueChange={(val: any) => { setDiscountType(val); setDiscountValue(0); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed ($)</SelectItem>
                        <SelectItem value="percentage">Percent (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Discount Value</Label>
                    <Input
                      type="number"
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder={discountType === 'percentage' ? '%' : '$'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cashIn">Cash-in (Paid) ($)</Label>
                    <Input
                      id="cashIn"
                      type="number"
                      value={cashIn || ''}
                      onChange={(e) => setCashIn(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="pt-2">
                      <Badge variant={calculatedStatus === 'Paid' ? 'default' : 'destructive'} className={calculatedStatus === 'Paid' ? 'bg-green-600 text-white border-none' : ''}>
                        {calculatedStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                {calculatedStatus === 'Due' && (
                  <div className="space-y-2">
                    <Label htmlFor="expectedReceivableDate">Expected Date of Receivable *</Label>
                    <Input
                      id="expectedReceivableDate"
                      type="date"
                      value={expectedReceivableDate}
                      onChange={(e) => setExpectedReceivableDate(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Summary calculations view */}
              <div className="bg-muted/40 p-4 rounded-lg space-y-3 border h-fit text-sm">
                <h4 className="font-bold border-b pb-2 mb-2 text-base">Bill Summary</h4>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">${subtotal.toLocaleString()}</span>
                </div>
                {deliveryCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Charge:</span>
                    <span>+ ${deliveryCharge.toLocaleString()}</span>
                  </div>
                )}
                {serviceFee > 0 && (
                  <div className="flex justify-between">
                    <span>Service Fee:</span>
                    <span>+ ${serviceFee.toLocaleString()}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount {discountType === 'percentage' && `(${discountValue}%)`}:</span>
                    <span>- ${discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold text-base">
                  <span>Total Bill:</span>
                  <span>${total.toLocaleString()}</span>
                </div>
                {prevDue > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Previous Due:</span>
                    <span>+ ${prevDue.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold text-lg text-primary">
                  <span>Grand Total:</span>
                  <span>${gTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-700 border-t pt-2">
                  <span>Cash-in:</span>
                  <span>${cashIn.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold text-base text-destructive">
                  <span>Remaining Due:</span>
                  <span>${currentBillDue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={formLoading} className="font-bold">
                {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Generate & Download PDF'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bill Detail View Dialog */}
      <Dialog open={!!selectedBill} onOpenChange={(open) => { if (!open) setSelectedBill(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedBill && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5 text-primary" />
                  Bill Invoice
                  <span className="text-primary font-black">#{selectedBill.invoiceNo}</span>
                  <Badge
                    variant={selectedBill.status === 'Paid' ? 'default' : 'destructive'}
                    className={`ml-auto text-xs ${selectedBill.status === 'Paid' ? 'bg-green-600 text-white border-none' : ''}`}
                  >
                    {selectedBill.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Client + Bill Meta */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/40 rounded-lg p-4 space-y-2.5 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client Details</p>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-semibold">{selectedBill.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <span>{selectedBill.clientPhone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{selectedBill.clientAddress}</span>
                    </div>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-4 space-y-2.5 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bill Info</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-mono font-bold">{selectedBill.invoiceNo}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                      <span>{format(new Date(selectedBill.date), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                    {selectedBill.expectedReceivableDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-4 w-4 text-orange-500 shrink-0" />
                        <span className="text-orange-600">Due by: {format(new Date(selectedBill.expectedReceivableDate), 'dd MMM yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product / Order Items Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-primary px-4 py-2.5 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary-foreground" />
                    <span className="text-sm font-bold text-primary-foreground">Order Items</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/60 border-b">
                        <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">#</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Product / Description</th>
                        <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground">Qty</th>
                        <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Rate ($)</th>
                        <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Amount ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(selectedBill.items || []).map((item: any, idx: number) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                          <td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-medium">{item.name}</td>
                          <td className="px-4 py-2.5 text-center">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right">{Math.round(item.price).toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{Math.round(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div className="bg-muted/30 border rounded-lg p-4 space-y-2 text-sm">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Financial Summary</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${Math.round(selectedBill.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {selectedBill.deliveryCharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Charge</span>
                      <span>+ ${Math.round(selectedBill.deliveryCharge).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedBill.serviceFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Fee</span>
                      <span>+ ${Math.round(selectedBill.serviceFee).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedBill.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount
                        {selectedBill.discountType === 'percentage'
                          ? ` (${selectedBill.discountValue}%)`
                          : ''}
                      </span>
                      <span>- ${Math.round(selectedBill.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Bill</span>
                    <span className="font-semibold">${Math.round(selectedBill.total || 0).toLocaleString()}</span>
                  </div>
                  {selectedBill.prevDue > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Previous Due</span>
                      <span>+ ${Math.round(selectedBill.prevDue).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold text-base">Grand Total</span>
                    <span className="font-bold text-base text-primary">${Math.round(selectedBill.gTotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>Cash Received</span>
                    <span className="font-semibold">${Math.round(selectedBill.cashIn || 0).toLocaleString()}</span>
                  </div>
                  <div className={`flex justify-between border-t pt-2 font-bold text-base ${
                    selectedBill.currentBillDue > 0 ? 'text-destructive' : 'text-green-600'
                  }`}>
                    <span>Remaining Due</span>
                    <span>${Math.round(selectedBill.currentBillDue || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1 font-bold"
                    onClick={() => generateBillPDF(selectedBill, settings, 'download')}
                  >
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 font-bold"
                    onClick={() => generateBillPDF(selectedBill, settings, 'print')}
                  >
                    <Printer className="h-4 w-4 mr-2" /> Print
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
