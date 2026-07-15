'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Phone, MapPin, CreditCard, Calendar, Truck, ExternalLink, FileText, Printer, Trash2, PlusCircle, Edit, X } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/lib/invoice-generator';
import { printStickerInvoice } from '@/lib/sticker-generator';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface OrderDetailsDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export default function OrderDetailsDialog({
  orderId,
  open,
  onOpenChange,
  onUpdate,
}: OrderDetailsDialogProps) {
  const [order, setOrder] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const [fraudData, setFraudData] = useState<any>(null);
  const [fraudLoading, setFraudLoading] = useState(false);

  const fetchFraudData = async (phone: string) => {
    setFraudLoading(true);
    try {
      const res = await fetch(`/api/admin/courier/fraud-check?phone=${phone}`);
      if (res.ok) {
        const json = await res.json();
        setFraudData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFraudLoading(false);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  const handleLocalPrint = async (type: 'invoice' | 'sticker') => {
    if (type === 'invoice') {
      toast.info('Generating PDF invoice...');
      await generateInvoicePDF(order, settings, 'print');
    } else {
      toast.info('Preparing sticker invoice...');
      await printStickerInvoice(order, settings);
    }
  };

  // Additional Shipping Fields
  const [cityId, setCityId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [shippingNote, setShippingNote] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      try {
        const [orderRes, settingsRes] = await Promise.all([
            fetch(`/api/orders/${orderId}`, { signal: controller.signal }),
            fetch(`/api/settings`, { signal: controller.signal })
        ]);

        if (!orderRes.ok) {
          const errData = await orderRes.json().catch(() => ({}));
          toast.error(errData.message || `Failed to load order: ${orderRes.statusText || orderRes.status}`);
          return;
        }

        if (!settingsRes.ok) {
          const errData = await settingsRes.json().catch(() => ({}));
          toast.error(errData.message || `Failed to load settings: ${settingsRes.statusText || settingsRes.status}`);
          return;
        }

        const [orderData, settingsData] = await Promise.all([
          orderRes.json(),
          settingsRes.json()
        ]);
        
        setOrder(orderData);
        if (orderData?.shippingAddress?.phone) {
          fetchFraudData(orderData.shippingAddress.phone);
        }
        setSettings(settingsData);
        setEditForm({
          shippingAddress: {
            fullName: orderData.shippingAddress?.fullName || '',
            phone: orderData.shippingAddress?.phone || '',
            street: orderData.shippingAddress?.street || '',
            city: orderData.shippingAddress?.city || '',
            state: orderData.shippingAddress?.state || '',
            division: orderData.shippingAddress?.division || '',
            zipCode: orderData.shippingAddress?.zipCode || '',
            country: orderData.shippingAddress?.country || 'Bangladesh'
          },
          paymentMethod: orderData.paymentMethod || 'COD',
          paymentStatus: orderData.paymentStatus || 'Pending',
          transactionId: orderData.transactionId || '',
          deliveryCharge: orderData.deliveryCharge || 0,
          couponDiscountAmount: orderData.couponDiscountAmount || 0,
          walletAmountUsed: orderData.walletAmountUsed || 0,
          items: orderData.items ? orderData.items.map((item: any) => ({
            product: item.product?._id || item.product,
            name: item.name || '',
            price: item.price || 0,
            quantity: item.quantity || 1,
            color: item.color || '',
            size: item.size || '',
            image: item.image || '',
            purchasePrice: item.purchasePrice || 0
          })) : [],
          status: orderData.status || 'Order Placed',
          internalNote: orderData.internalNote || ''
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error);
          toast.error('Error loading data');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (open && orderId) {
      fetchData();
    } else {
      setOrder(null);
      setSettings(null);
      setIsEditing(false);
      setEditForm(null);
      setFraudData(null);
      setFraudLoading(false);
      // Reset shipping fields when closing or switching orders
      setCityId('');
      setZoneId('');
      setAreaId('');
      setShippingNote('');
    }

    return () => controller.abort();
  }, [open, orderId]);

  const handleSaveChanges = async () => {
    if (!editForm || !editForm.shippingAddress) return;
    
    if (!editForm.shippingAddress.fullName || !editForm.shippingAddress.phone || !editForm.shippingAddress.street || !editForm.shippingAddress.city || !editForm.shippingAddress.state) {
      toast.error('All shipping address fields except division, zip code, and country are required');
      return;
    }

    if (editForm.items.length === 0) {
      toast.error('At least one item is required in the order');
      return;
    }

    for (const item of editForm.items) {
      if (!item.product) {
        toast.error('Product ID is required for all items');
        return;
      }
      if (!item.name) {
        toast.error('Item name is required');
        return;
      }
      if (item.price <= 0) {
        toast.error('Item price must be greater than 0');
        return;
      }
      if (item.quantity <= 0) {
        toast.error('Item quantity must be at least 1');
        return;
      }
    }

    const confirmRes = await Swal.fire({
      title: 'Save Order Changes?',
      text: 'Are you sure you want to save the modified order details?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Yes, save changes'
    });

    if (!confirmRes.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        toast.success('Order details updated successfully');
        setIsEditing(false);
        onUpdate();
        const updatedRes = await fetch(`/api/orders/${orderId}`);
        if (updatedRes.ok) {
          const updatedData = await updatedRes.json();
          setOrder(updatedData);
          setEditForm({
            shippingAddress: {
              fullName: updatedData.shippingAddress?.fullName || '',
              phone: updatedData.shippingAddress?.phone || '',
              street: updatedData.shippingAddress?.street || '',
              city: updatedData.shippingAddress?.city || '',
              state: updatedData.shippingAddress?.state || '',
              division: updatedData.shippingAddress?.division || '',
              zipCode: updatedData.shippingAddress?.zipCode || '',
              country: updatedData.shippingAddress?.country || 'Bangladesh'
            },
            paymentMethod: updatedData.paymentMethod || 'COD',
            paymentStatus: updatedData.paymentStatus || 'Pending',
            transactionId: updatedData.transactionId || '',
            deliveryCharge: updatedData.deliveryCharge || 0,
            couponDiscountAmount: updatedData.couponDiscountAmount || 0,
            walletAmountUsed: updatedData.walletAmountUsed || 0,
            items: updatedData.items ? updatedData.items.map((item: any) => ({
              product: item.product?._id || item.product,
              name: item.name || '',
              price: item.price || 0,
              quantity: item.quantity || 1,
              color: item.color || '',
              size: item.size || '',
              image: item.image || '',
              purchasePrice: item.purchasePrice || 0
            })) : [],
            status: updatedData.status || 'Order Placed',
            internalNote: updatedData.internalNote || ''
          });
        }
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to update order');
      }
    } catch (error) {
      toast.error('Network error occurred while saving changes');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-xl font-bold">
              {isEditing ? 'Edit Order Details' : 'Order Details'}
            </DialogTitle>
            {order && (
               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1 px-2.5 py-1"
                    title={isEditing ? "Cancel Edit" : "Edit Order"}
                  >
                    {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                    <span className="text-[10px] font-bold">{isEditing ? 'Cancel' : 'Edit'}</span>
                  </button>
                  <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                  <button 
                    onClick={() => handleLocalPrint('invoice')}
                    className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    title="Print A4 Invoice"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleLocalPrint('sticker')}
                    className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1 px-2.5 py-1"
                    title="Print Sticker Invoice"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Sticker</span>
                  </button>
               </div>
            )}
          </div>
          <DialogDescription>
            {order ? `Order ID: #${String(order._id ?? '').toUpperCase()}` : 'Loading order details...'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : order ? (
          isEditing && editForm ? (
             <div className="space-y-6 pt-4 text-xs sm:text-sm">
                {/* 1. Customer & Shipping Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground">Shipping Address</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground">Full Name</label>
                      <input 
                        type="text" 
                        value={editForm.shippingAddress.fullName} 
                        onChange={(e) => setEditForm({
                          ...editForm,
                          shippingAddress: { ...editForm.shippingAddress, fullName: e.target.value }
                        })}
                        className="w-full text-sm p-2 border rounded" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground">Phone Number</label>
                      <input 
                        type="text" 
                        value={editForm.shippingAddress.phone} 
                        onChange={(e) => setEditForm({
                          ...editForm,
                          shippingAddress: { ...editForm.shippingAddress, phone: e.target.value }
                        })}
                        className="w-full text-sm p-2 border rounded" 
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="font-bold text-muted-foreground">Street Address</label>
                      <input 
                        type="text" 
                        value={editForm.shippingAddress.street} 
                        onChange={(e) => setEditForm({
                          ...editForm,
                          shippingAddress: { ...editForm.shippingAddress, street: e.target.value }
                        })}
                        className="w-full text-sm p-2 border rounded" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground">City</label>
                      <input 
                        type="text" 
                        value={editForm.shippingAddress.city} 
                        onChange={(e) => setEditForm({
                          ...editForm,
                          shippingAddress: { ...editForm.shippingAddress, city: e.target.value }
                        })}
                        className="w-full text-sm p-2 border rounded" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground">State / District</label>
                      <input 
                        type="text" 
                        value={editForm.shippingAddress.state} 
                        onChange={(e) => setEditForm({
                          ...editForm,
                          shippingAddress: { ...editForm.shippingAddress, state: e.target.value }
                        })}
                        className="w-full text-sm p-2 border rounded" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground">Division</label>
                      <input 
                        type="text" 
                        value={editForm.shippingAddress.division || ''} 
                        onChange={(e) => setEditForm({
                          ...editForm,
                          shippingAddress: { ...editForm.shippingAddress, division: e.target.value }
                        })}
                        className="w-full text-sm p-2 border rounded" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground">Zip Code</label>
                      <input 
                        type="text" 
                        value={editForm.shippingAddress.zipCode} 
                        onChange={(e) => setEditForm({
                          ...editForm,
                          shippingAddress: { ...editForm.shippingAddress, zipCode: e.target.value }
                        })}
                        className="w-full text-sm p-2 border rounded" 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 2. Payment & Status Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground">Payment & Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground">Payment Method</label>
                      <select 
                        value={editForm.paymentMethod} 
                        onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                        className="w-full text-sm p-2 border rounded bg-white"
                      >
                        <option value="COD">Cash on Delivery (COD)</option>
                        <option value="Online">Online Payment</option>
                        <option value="Manual">Manual Verification</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground">Payment Status</label>
                      <select 
                        value={editForm.paymentStatus} 
                        onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                        className="w-full text-sm p-2 border rounded bg-white"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground">Order Status</label>
                      <select 
                        value={editForm.status} 
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full text-sm p-2 border rounded bg-white"
                      >
                        {['Order Placed', 'Confirmed', 'Paid', 'Ready for Delivery', 'Released for Delivery', 'Cancelled', 'Delivered'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground">Transaction ID</label>
                      <input 
                        type="text" 
                        value={editForm.transactionId} 
                        onChange={(e) => setEditForm({ ...editForm, transactionId: e.target.value })}
                        className="w-full text-sm p-2 border rounded" 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 3. Pricing & Charges */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground">Charges & Discounts</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground">Delivery Charge</label>
                      <input 
                        type="number" 
                        value={editForm.deliveryCharge} 
                        onChange={(e) => setEditForm({ ...editForm, deliveryCharge: Number(e.target.value) || 0 })}
                        className="w-full text-sm p-2 border rounded" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground">Coupon Discount</label>
                      <input 
                        type="number" 
                        value={editForm.couponDiscountAmount} 
                        onChange={(e) => setEditForm({ ...editForm, couponDiscountAmount: Number(e.target.value) || 0 })}
                        className="w-full text-sm p-2 border rounded" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground">Wallet Amount Used</label>
                      <input 
                        type="number" 
                        value={editForm.walletAmountUsed} 
                        onChange={(e) => setEditForm({ ...editForm, walletAmountUsed: Number(e.target.value) || 0 })}
                        className="w-full text-sm p-2 border rounded" 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 4. Items List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase text-muted-foreground">Order Items</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="text-xs font-bold flex items-center gap-1"
                      onClick={() => {
                        setEditForm({
                          ...editForm,
                          items: [
                            ...editForm.items,
                            { product: '', name: 'New Product', price: 100, quantity: 1, color: '', size: '', image: '', purchasePrice: 0 }
                          ]
                        });
                      }}
                    >
                      <PlusCircle className="h-4 w-4" /> Add Item
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[250px] overflow-y-auto border p-3 rounded bg-muted/20">
                    {editForm.items.map((item: any, index: number) => (
                      <div key={index} className="border-b pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0 space-y-2">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-12 sm:col-span-6 space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground">Product ID (MongoDB ObjectId)</label>
                            <input 
                              type="text" 
                              placeholder="6a0324e0cec01780aa969ec0"
                              value={item.product || ''} 
                              onChange={(e) => {
                                const newItems = [...editForm.items];
                                newItems[index].product = e.target.value;
                                setEditForm({ ...editForm, items: newItems });
                              }}
                              className="w-full text-xs p-1.5 border rounded"
                            />
                          </div>
                          <div className="col-span-12 sm:col-span-6 space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground">Item Name</label>
                            <input 
                              type="text" 
                              placeholder="Product Name"
                              value={item.name} 
                              onChange={(e) => {
                                const newItems = [...editForm.items];
                                newItems[index].name = e.target.value;
                                setEditForm({ ...editForm, items: newItems });
                              }}
                              className="w-full text-xs p-1.5 border rounded font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                          <div className="space-y-1 col-span-1">
                            <label className="text-[10px] font-bold text-muted-foreground">Qty</label>
                            <input 
                              type="number" 
                              min="1"
                              value={item.quantity} 
                              onChange={(e) => {
                                const newItems = [...editForm.items];
                                newItems[index].quantity = Number(e.target.value) || 1;
                                setEditForm({ ...editForm, items: newItems });
                              }}
                              className="w-full text-xs p-1.5 border rounded text-center"
                            />
                          </div>
                          <div className="space-y-1 col-span-1">
                            <label className="text-[10px] font-bold text-muted-foreground">Price</label>
                            <input 
                              type="number" 
                              value={item.price} 
                              onChange={(e) => {
                                const newItems = [...editForm.items];
                                newItems[index].price = Number(e.target.value) || 0;
                                setEditForm({ ...editForm, items: newItems });
                              }}
                              className="w-full text-xs p-1.5 border rounded text-center"
                            />
                          </div>
                          <div className="space-y-1 col-span-1">
                            <label className="text-[10px] font-bold text-muted-foreground">Color</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Red"
                              value={item.color || ''} 
                              onChange={(e) => {
                                const newItems = [...editForm.items];
                                newItems[index].color = e.target.value;
                                setEditForm({ ...editForm, items: newItems });
                              }}
                              className="w-full text-xs p-1.5 border rounded text-center"
                            />
                          </div>
                          <div className="space-y-1 col-span-1">
                            <label className="text-[10px] font-bold text-muted-foreground">Size</label>
                            <input 
                              type="text" 
                              placeholder="e.g. XL"
                              value={item.size || ''} 
                              onChange={(e) => {
                                const newItems = [...editForm.items];
                                newItems[index].size = e.target.value;
                                setEditForm({ ...editForm, items: newItems });
                              }}
                              className="w-full text-xs p-1.5 border rounded text-center"
                            />
                          </div>
                          <div className="col-span-1 flex items-end justify-center pb-0.5">
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                const newItems = editForm.items.filter((_: any, idx: number) => idx !== index);
                                setEditForm({ ...editForm, items: newItems });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Internal Note */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground">Internal Note (Admin/Manager)</h3>
                  <textarea 
                    value={editForm.internalNote || ''} 
                    onChange={(e) => setEditForm({ ...editForm, internalNote: e.target.value })}
                    className="w-full text-sm p-2 border rounded h-20 resize-y" 
                    placeholder="Enter customer specific internal notes here..."
                  />
                </div>

                <Separator />

                {/* Form Footer Actions */}
                <div className="flex gap-3 pt-4 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="px-6 rounded-xl font-bold h-11"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleSaveChanges}
                    className="px-6 rounded-xl font-bold h-11 bg-primary text-white hover:bg-primary/95"
                  >
                    Save Changes
                  </Button>
                </div>
             </div>
          ) : (
          <div className="space-y-6 pt-4">
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-muted-foreground">Customer</h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {order.user?.name?.[0] || 'G'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{order.user?.name || 'Guest User'}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {order.user?.email || 'No Email'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-muted-foreground">Order Date</h3>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {order.createdAt && isValid(new Date(order.createdAt)) 
                      ? format(new Date(order.createdAt), 'MMMM dd, yyyy p')
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Shipping & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Shipping Address
                </h4>
                <div className="text-sm leading-relaxed">
                  {(order.shippingAddress?.fullName || order.user?.name) && (
                    <p>{order.shippingAddress?.fullName || order.user?.name}</p>
                  )}
                  {order.shippingAddress?.street && <p>{order.shippingAddress?.street}</p>}
                  {(() => {
                    const city = order.shippingAddress?.city || '';
                    const state = order.shippingAddress?.state || '';
                    const zip = order.shippingAddress?.zipCode || '';
                    const country = order.shippingAddress?.country || '';

                    const isCityDefault = ['dhaka', 'outside dhaka'].includes(city.toLowerCase().trim());
                    const isStateDefault = ['dhaka', 'outside dhaka'].includes(state.toLowerCase().trim());
                    const isZipDefault = zip.trim() === '0000';
                    const isCountryDefault = ['bangladesh'].includes(country.toLowerCase().trim());

                    const cityStateParts = [];
                    if (!isCityDefault && city) cityStateParts.push(city);
                    if (!isStateDefault && state) cityStateParts.push(state);

                    return (
                      <>
                        {cityStateParts.length > 0 && (
                          <p>
                            {cityStateParts.join(', ')}
                            {!isZipDefault && zip ? ` ${zip}` : ''}
                          </p>
                        )}
                        {cityStateParts.length === 0 && !isZipDefault && zip && (
                          <p>{zip}</p>
                        )}
                        {!isCountryDefault && country && (
                          <p>{country}</p>
                        )}
                      </>
                    );
                  })()}
                  {order.shippingAddress?.phone && (
                    <div className="space-y-2 mt-1">
                      <p className="flex items-center gap-1 text-muted-foreground font-semibold">
                        <Phone className="h-3 w-3" /> {order.shippingAddress.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>Method:</span>
                    <span>{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Status:</span>
                    <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'outline'} className={order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : ''}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                  {order.transactionId && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Transaction ID:</span>
                      <code className="bg-muted px-2 py-1 rounded text-[10px] break-all">{order.transactionId}</code>
                    </div>
                  )}

                  {order.paymentMethod === 'Manual' && order.manualPaymentDetails && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
                       <p className="text-[10px] font-black uppercase text-primary tracking-widest">Manual Verification</p>
                       <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                             <span className="text-muted-foreground block">Method:</span>
                             <span className="font-bold uppercase">{order.manualPaymentDetails.methodName}</span>
                          </div>
                          <div>
                             <span className="text-muted-foreground block">Sender No:</span>
                             <span className="font-bold">{order.manualPaymentDetails.senderNumber}</span>
                          </div>
                          <div className="col-span-2">
                             <span className="text-muted-foreground block">TrxID:</span>
                             <code className="font-bold text-primary bg-white px-1.5 py-0.5 rounded border">{order.manualPaymentDetails.transactionId}</code>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BD Courier Fraud Checker UI */}
            {order.shippingAddress?.phone && (
              <div className="mt-2 p-3 bg-muted/30 border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">BD Courier Profile</span>
                  {fraudLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </div>

                {fraudData?.status === 'success' && fraudData?.data?.summary ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-[10px]">Success Rate:</span>
                        <span className={`font-black ${fraudData.data.summary.success_ratio >= 80 ? 'text-green-600' : fraudData.data.summary.success_ratio >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {fraudData.data.summary.success_ratio}%
                        </span>
                      </div>
                      <span className="text-muted-foreground/35">|</span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-[10px]">Total Parcels:</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">{fraudData.data.summary.total_parcel}</span>
                      </div>
                      <span className="text-muted-foreground/35">|</span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-[10px]">Delivered:</span>
                        <span className="font-bold text-green-600">{fraudData.data.summary.success_parcel}</span>
                      </div>
                      <span className="text-muted-foreground/35">|</span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-[10px]">Cancelled:</span>
                        <span className="font-bold text-red-600">{fraudData.data.summary.cancelled_parcel}</span>
                      </div>
                    </div>

                    {/* Reports List */}
                    {fraudData.reports && fraudData.reports.length > 0 && (
                      <div className="border-t pt-2 mt-1">
                        <span className="text-[10px] font-bold text-red-600 block mb-1">⚠️ Merchant Fraud Reports ({fraudData.reports.length})</span>
                        <div className="space-y-1.5 max-h-[80px] overflow-y-auto">
                          {fraudData.reports.map((report: any, idx: number) => (
                            <div key={idx} className="bg-red-50 dark:bg-red-950/20 p-1.5 rounded text-[10px] border border-red-100 dark:border-red-900/50">
                              <p className="font-semibold text-red-700 dark:text-red-400">{report.name || 'Anonymous'}: <span className="font-normal text-slate-700 dark:text-zinc-300">{report.details}</span></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : !fraudLoading && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground">Click to fetch courier history</span>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-6 px-2 text-[10px]" 
                      onClick={() => fetchFraudData(order.shippingAddress.phone)}
                    >
                      Verify Number
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Shipping Management (Admin Action) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center justify-between">
                <span>Shipping Management</span>
              </h3>
              
              {order.shippingDetails?.trackingId ? (
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-muted-foreground">Courier Service</p>
                      <p className="font-bold text-sm">{order.shippingDetails.courierName}</p>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {order.shippingDetails.courierStatus || 'Processing'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Tracking ID</p>
                      <code className="text-sm font-mono font-bold">{order.shippingDetails.trackingId}</code>
                    </div>
                    {order.shippingDetails.trackingUrl && (
                      <a 
                        href={order.shippingDetails.trackingUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        Track Status <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {settings?.courierConfig?.activeProvider === 'none' ? (
                    <div className="text-xs bg-yellow-50 text-yellow-700 p-3 rounded-lg border border-yellow-200">
                      <strong>Note:</strong> Courier integration is not configured. Please go to Settings &gt; Courier to enable automated booking.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase">Booking Details ({settings?.courierConfig?.activeProvider})</span>
                        </div>
                        
                        {(settings?.courierConfig?.activeProvider === 'pathao' || settings?.courierConfig?.activeProvider === 'redx') && (
                            <div className="grid grid-cols-2 gap-2">
                                {settings?.courierConfig?.activeProvider === 'pathao' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold">City ID</label>
                                            <input type="text" value={cityId} onChange={(e) => setCityId(e.target.value)} placeholder="e.g. 1" className="w-full text-xs p-2 border rounded" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold">Zone ID</label>
                                            <input type="text" value={zoneId} onChange={(e) => setZoneId(e.target.value)} placeholder="e.g. 1" className="w-full text-xs p-2 border rounded" />
                                        </div>
                                    </>
                                )}
                                <div className="space-y-1 col-span-2">
                                    <label className="text-[10px] font-bold">Area ID</label>
                                    <input type="text" value={areaId} onChange={(e) => setAreaId(e.target.value)} placeholder="e.g. 123" className="w-full text-xs p-2 border rounded" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold">Shipping Note</label>
                            <input type="text" value={shippingNote} onChange={(e) => setShippingNote(e.target.value)} placeholder="Package handle with care..." className="w-full text-xs p-2 border rounded" />
                        </div>
                      </div>

                      <button
                        disabled={bookingLoading}
                        onClick={async () => {
                          const isActiveSteadfast = settings?.courierConfig?.activeProvider === 'steadfast';
                          const endpoint = isActiveSteadfast 
                            ? '/api/admin/courier/steadfast' 
                            : `/api/admin/orders/${order._id}/book-courier`;
                          const payload = isActiveSteadfast 
                            ? { orderIds: [order._id] } 
                            : { city_id: cityId, zone_id: zoneId, area_id: areaId, note: shippingNote };

                          const result = await Swal.fire({
                            title: isActiveSteadfast ? 'Send to Steadfast?' : 'Book Courier?',
                            text: isActiveSteadfast 
                              ? `Are you sure you want to send 1 order(s) to Steadfast Courier?`
                              : `Hand over order #${order._id} to ${settings?.courierConfig?.activeProvider}?`,
                            icon: 'question',
                            showCancelButton: true,
                            confirmButtonColor: '#2563eb',
                            confirmButtonText: 'Yes, send now!'
                          });
                          
                          if (!result.isConfirmed) return;
                          
                          setBookingLoading(true);
                          try {
                            const res = await fetch(endpoint, { 
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            });
                            
                                                         const data = await res.json();
                             if (res.ok) {
                               const hasFailures = data.results && data.results.some((r: any) => !r.success);
                               if (hasFailures) {
                                 const firstFail = data.results.find((r: any) => !r.success);
                                 toast.error(`${data.message}. Reason: ${firstFail?.message || 'Unknown error'}`);
                               } else {
                                 toast.success(data.message || `${settings?.courierConfig?.activeProvider} booked successfully!`);
                               }
                               onUpdate();
                               const updateRes = await fetch(`/api/orders/${orderId}`);
                               if (updateRes.ok) setOrder(await updateRes.json());
                             } else {
                              toast.error(data.message || 'Courier booking failed');
                            }
                          } catch (e) {
                            toast.error('Network error');
                          } finally {
                            setBookingLoading(false);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />} 
                        Hand over to {settings?.courierConfig?.activeProvider ? settings.courierConfig.activeProvider.toUpperCase() : 'Courier'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Internal Note */}
            {order.internalNote && (
              <>
                <Separator />
                <div className="space-y-2 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200/50">
                  <h4 className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300">Internal Note (Admin/Manager)</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.internalNote}</p>
                </div>
              </>
            )}

            <Separator />
            
            {/* Items */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase text-muted-foreground">Order Items</h4>
              <div className="space-y-3">
                {(order.items || []).map((item: any, i: number) => (
                  <div key={item._id || item.id || i} className="flex items-center justify-between text-sm gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-12 w-12 rounded border overflow-hidden bg-muted flex-shrink-0">
                         {item.image ? (
                             <Image src={item.image} alt={item.name} width={48} height={48} className="h-full w-full object-cover" />
                         ) : (
                             <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                         )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">{item.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.color && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-muted/50">{item.color}</Badge>}
                          {item.size && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-muted/50">Size: {item.size}</Badge>}
                          <span className="text-xs text-muted-foreground ml-1">${Math.round(Number(item.price) || 0)} × {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="font-bold">
                      ${Math.round(Number(item.price || 0) * (item.quantity || 0))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t flex justify-between items-center text-lg">
                <span className="font-bold">Total Amount:</span>
                <span className="font-black text-primary">${Math.round(Number(order.totalAmount) || 0)}</span>
              </div>
            </div>

            {/* Quick Actions for Manual Payments */}
            {order.paymentMethod === 'Manual' && order.paymentStatus === 'Pending' && order.status !== 'Cancelled' && (
              <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={async () => {
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
                      try {
                        const res = await fetch(`/api/orders/${order._id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'Cancelled' }),
                        });
                        if (res.ok) {
                          toast.success('Order cancelled successfully');
                          onUpdate();
                          onOpenChange(false);
                        } else {
                          toast.error('Failed to update order');
                        }
                      } catch (e) {
                        toast.error('Error updating order');
                      }
                    }
                  }}
                  className="rounded-xl h-11 flex-1 font-bold text-destructive hover:bg-destructive/5"
                >
                  Reject & Cancel Order
                </Button>
                <Button 
                  onClick={async () => {
                    const result = await Swal.fire({
                      title: 'Approve Payment & Order?',
                      text: `Confirm manual payment and mark order #${order._id.slice(-8).toUpperCase()} as Confirmed & Paid?`,
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonColor: '#00D1B2',
                      confirmButtonText: 'Yes, Approve!'
                    });
                    if (result.isConfirmed) {
                      try {
                        const res = await fetch(`/api/orders/${order._id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'Confirmed', paymentStatus: 'Paid' }),
                        });
                        if (res.ok) {
                          toast.success('Order approved successfully');
                          onUpdate();
                          onOpenChange(false);
                        } else {
                          toast.error('Failed to approve order');
                        }
                      } catch (e) {
                        toast.error('Error approving order');
                      }
                    }
                  }}
                  className="rounded-xl h-11 flex-1 font-black uppercase tracking-wider text-xs shadow-md shadow-primary/10"
                >
                  Approve Manual Payment
                </Button>
              </div>
            )}
          </div>
          )
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            No details found for this order.
          </div>
        )}
      </DialogContent>

    </Dialog>
  );
}
