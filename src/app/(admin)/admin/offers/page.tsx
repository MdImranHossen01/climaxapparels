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
  Search,
  FileText,
  Eye,
  MapPin,
  Phone,
  CalendarDays,
  Hash,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { generateBillPDF } from '@/lib/bill-invoice-generator';

interface BillItemInput {
  name: string;
  quantity: number;
  price: number;
}

export default function ClientOffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<any>(null);

  // Offer detail view state
  const [selectedOffer, setSelectedOffer] = useState<any>(null);

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

  // Product multi-select state
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductVariants, setSelectedProductVariants] = useState<Record<string, string | null>>({});
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  // Phone validation
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    fetchOffers();
    fetchProducts();
    fetchSettings();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/bills?type=offer');
      if (!res.ok) throw new Error('Failed to fetch offers');
      const data = await res.json();
      setOffers(data);
    } catch (error) {
      toast.error('Failed to load offers');
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
        newItems.push({ name: prod.name, price: prod.salePrice || prod.price || 0, quantity: 1 });
      } else {
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

    try {
      setFormLoading(true);
      const offerData = {
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
        prevDue: 0,
        gTotal: total,
        cashIn: 0,
        currentBillDue: total,
        status: 'Due',
        documentType: 'offer'
      };

      const res = await fetch('/api/admin/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create quotation');
      }

      const createdOffer = await res.json();
      toast.success('Quotation generated successfully!');

      // Auto-trigger download
      await generateBillPDF(createdOffer, settings, 'download');

      setIsCreateOpen(false);
      resetForm();
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message || 'Error creating quotation');
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
    setDiscountType('fixed');
    setDiscountValue(0);
    setSelectedProductVariants({});
    setProductSearchTerm('');
    setProductPickerOpen(false);
  };

  const handleConvertToChalan = async (offer: any) => {
    const result = await Swal.fire({
      title: 'Convert to Delivery Challan?',
      text: `Do you want to create a Delivery Challan from Quotation ${offer.invoiceNo}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Convert',
      cancelButtonText: 'No'
    });

    if (result.isConfirmed) {
      try {
        const challanData = {
          clientName: offer.clientName,
          clientPhone: offer.clientPhone,
          clientAddress: offer.clientAddress,
          items: offer.items,
          subtotal: offer.subtotal,
          deliveryCharge: offer.deliveryCharge,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          discount: offer.discount,
          total: offer.total,
          prevDue: 0,
          gTotal: offer.total,
          cashIn: 0,
          currentBillDue: offer.total,
          status: 'Due',
          documentType: 'chalan',
          convertedFrom: offer._id
        };

        const res = await fetch('/api/admin/bills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(challanData)
        });

        if (!res.ok) throw new Error('Conversion failed');
        const createdChallan = await res.json();

        await Swal.fire({
          title: 'Success!',
          text: `Delivery Challan ${createdChallan.invoiceNo} has been generated.`,
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: 'Print Challan Now',
          cancelButtonText: 'Close'
        }).then((printRes) => {
          if (printRes.isConfirmed) {
            generateBillPDF(createdChallan, settings, 'print');
          }
        });
      } catch (error) {
        toast.error('Failed to convert to challan');
      }
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
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
        const res = await fetch(`/api/admin/bills/${offerId}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete quotation');
        toast.success('Quotation deleted successfully');
        fetchOffers();
      } catch (error) {
        toast.error('Failed to delete quotation');
      }
    }
  };

  const filteredOffers = offers.filter(b =>
    b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.clientPhone.includes(searchTerm) ||
    b.invoiceNo.includes(searchTerm)
  );

  return (
    <div className="flex-1 space-y-6 px-0 py-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Client Quotations / Offers</h2>
          <p className="text-muted-foreground text-sm">Create, manage, and print price offers for clients, and convert them to Delivery Challans.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full md:w-auto bg-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Create Offer / Quote
        </Button>
      </div>

      {/* Offers Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Quotations List</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client or invoice..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-10 w-10 mb-2 stroke-1" />
              <p>No quotations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation No</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total Offer (৳)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOffers.map((offer) => (
                    <TableRow key={offer._id}>
                      <TableCell className="font-semibold">{offer.invoiceNo}</TableCell>
                      <TableCell>{offer.clientName}</TableCell>
                      <TableCell>{offer.clientPhone}</TableCell>
                      <TableCell>{format(new Date(offer.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right font-medium">৳{Math.round(offer.total)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          title="View Details"
                          onClick={() => setSelectedOffer(offer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Download PDF"
                          onClick={() => generateBillPDF(offer, settings, 'download')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Print PDF"
                          onClick={() => generateBillPDF(offer, settings, 'print')}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          className="bg-primary text-primary-foreground"
                          size="sm"
                          title="Convert to Challan"
                          onClick={() => handleConvertToChalan(offer)}
                        >
                          <ArrowRight className="mr-1 h-3 w-3" /> Challan
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          title="Delete Quotation"
                          onClick={() => handleDeleteOffer(offer._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if(!open) resetForm(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Quotation / Offer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cName">Client Name *</Label>
                <Input
                  id="cName"
                  placeholder="e.g. Rahim & Bros"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cPhone">Client Phone *</Label>
                <Input
                  id="cPhone"
                  placeholder="e.g. 017XXXXXXXX"
                  value={clientPhone}
                  onChange={(e) => {
                    setClientPhone(e.target.value);
                    if (e.target.value) validatePhone(e.target.value);
                  }}
                  required
                />
                {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cAddr">Client Address *</Label>
                <Input
                  id="cAddr"
                  placeholder="e.g. Banani, Dhaka"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Product Picker */}
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Items List</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setProductPickerOpen(true)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Select Products
              </Button>
            </div>

            {/* Manual item entries */}
            <div className="space-y-3">
              {billItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Item name / Description"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      placeholder="Price"
                      min="0"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItemRow(index)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={handleAddItemRow}>
                <Plus className="mr-1 h-3 w-3" /> Add Custom Item
              </Button>
            </div>

            <hr />

            {/* Calculations & Discounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="discType">Discount Type</Label>
                    <Select
                      value={discountType}
                      onValueChange={(val: any) => { setDiscountType(val); setDiscountValue(0); }}
                    >
                      <SelectTrigger id="discType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="discVal">Discount Value</Label>
                    <Input
                      id="discVal"
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delCharge">Delivery Charge (৳)</Label>
                  <Input
                    id="delCharge"
                    type="number"
                    min="0"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceFeeOffer">Service Fee (৳) <span className="text-muted-foreground font-normal text-xs">— Optional</span></Label>
                  <Input
                    id="serviceFeeOffer"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={serviceFee || ''}
                    onChange={(e) => setServiceFee(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">৳{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                     <span>Discount:</span>
                     <span>- ৳{discount}</span>
                  </div>
                )}
                {deliveryCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Charge:</span>
                    <span>৳{deliveryCharge}</span>
                  </div>
                )}
                {serviceFee > 0 && (
                  <div className="flex justify-between">
                    <span>Service Fee:</span>
                    <span>৳{serviceFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total Offer Value:</span>
                  <span>৳{total}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading} className="bg-primary text-primary-foreground">
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Offer & Download PDF
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Selection Dialog */}
      <Dialog open={productPickerOpen} onOpenChange={setProductPickerOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
            </div>
            <div className="border rounded-md overflow-hidden max-h-[50vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Options / Variants</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
                    .map((prod) => {
                      const hasVariants = prod.variants && prod.variants.length > 0;
                      return (
                        <TableRow key={prod._id}>
                          <TableCell>
                            {!hasVariants && (
                              <Checkbox
                                checked={selectedProductVariants[prod._id] === null}
                                onCheckedChange={() => toggleProductVariant(prod._id, null)}
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{prod.name}</TableCell>
                          <TableCell>
                            {hasVariants ? (
                              <div className="flex flex-wrap gap-2 py-1">
                                {prod.variants.map((v: any) => {
                                  const label = [v.color, v.size].filter(Boolean).join(' / ');
                                  const isSelected = selectedProductVariants[prod._id] === v._id;
                                  return (
                                    <Button
                                      key={v._id}
                                      type="button"
                                      variant={isSelected ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => toggleProductVariant(prod._id, v._id)}
                                      className="text-xs py-0.5 px-2 h-7"
                                    >
                                      {label} (৳{v.salePrice || v.price})
                                    </Button>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Standard Item</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!hasVariants && `৳${prod.salePrice || prod.price}`}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">{selectedCount} items selected</span>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => setProductPickerOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddSelectedProducts} className="bg-primary text-primary-foreground">Add Selected</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Offer Detail View Dialog */}
      <Dialog open={!!selectedOffer} onOpenChange={(open) => { if (!open) setSelectedOffer(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quotation Details — {selectedOffer?.invoiceNo}</DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-muted-foreground mb-1 uppercase tracking-wider text-xs">Quotation To</h4>
                  <p className="font-medium text-base">{selectedOffer.clientName}</p>
                  <p className="flex items-center gap-1.5 mt-1 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {selectedOffer.clientPhone}</p>
                  <p className="flex items-center gap-1.5 mt-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {selectedOffer.clientAddress}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-muted-foreground mb-1 uppercase tracking-wider text-xs">Document Info</h4>
                  <p className="flex items-center gap-1.5 font-medium"><Hash className="h-3.5 w-3.5 text-primary" /> {selectedOffer.invoiceNo}</p>
                  <p className="flex items-center gap-1.5 mt-1 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {format(new Date(selectedOffer.date), 'dd MMM yyyy')}</p>
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center w-16">Qty</TableHead>
                      <TableHead className="text-right w-24">Rate</TableHead>
                      <TableHead className="text-right w-28">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOffer.items.map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">৳{Math.round(item.price)}</TableCell>
                        <TableCell className="text-right font-medium">৳{Math.round(item.price * item.quantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">৳{Math.round(selectedOffer.subtotal)}</span>
                  </div>
                  {selectedOffer.discount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount ({selectedOffer.discountType === 'percentage' ? `${selectedOffer.discountValue}%` : 'Fixed'}):</span>
                      <span>- ৳{Math.round(selectedOffer.discount)}</span>
                    </div>
                  )}
                  {selectedOffer.deliveryCharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Charge:</span>
                      <span>৳{Math.round(selectedOffer.deliveryCharge)}</span>
                    </div>
                  )}
                  {selectedOffer.serviceFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Fee:</span>
                      <span>৳{Math.round(selectedOffer.serviceFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t pt-2">
                    <span>Total Offer:</span>
                    <span className="text-primary">৳{Math.round(selectedOffer.total)}</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => generateBillPDF(selectedOffer, settings, 'print')}
                >
                  <Printer className="mr-2 h-4 w-4" /> Print Quotation
                </Button>
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={() => {
                    const off = selectedOffer;
                    setSelectedOffer(null);
                    handleConvertToChalan(off);
                  }}
                >
                  <ArrowRight className="mr-2 h-4 w-4" /> Convert to Challan
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
