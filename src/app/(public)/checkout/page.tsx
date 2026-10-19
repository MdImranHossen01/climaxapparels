'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, removeFromCart, clearCart, syncItems } from '@/store/slices/cartSlice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Truck, ShoppingBag, CheckCircle2, Plus, Minus, X, Globe, ArrowRight, PartyPopper, XCircle, Landmark, FileText, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fbEvent } from '@/lib/fpixel';
import { ttEvent } from '@/lib/tiktok';



import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  street: z.string().min(5, 'Full shipping address is required'),
  deliveryArea: z.enum(['inside', 'outside'], {
    message: 'Please select a shipping method',
  }),
  paymentMethod: z.enum(['TT', 'LC', 'Bank Transfer', 'Online'], {
    message: 'Please select a payment method'
  }),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

function CheckoutContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, totalAmount, isHydrated } = useAppSelector((state) => state.cart);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [useWallet, setUseWallet] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [bankReference, setBankReference] = useState('');
  const [bankSenderInfo, setBankSenderInfo] = useState('');
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      phone: '',
      street: '',
      deliveryArea: 'inside',
      paymentMethod: 'TT',
    },
  });

  // Handle SSLCommerz redirect back — show modal based on ?order= param
  useEffect(() => {
    const orderStatus = searchParams.get('order');
    const orderId = searchParams.get('id');
    if (orderStatus === 'success') {
      setSuccessOrderId(orderId);
      setShowSuccessModal(true);
      // Clean URL without reload
      window.history.replaceState({}, '', '/checkout');
    } else if (orderStatus === 'failed') {
      setShowFailModal(true);
      window.history.replaceState({}, '', '/checkout');
    }
  }, [searchParams]);



  useEffect(() => {
    async function fetchLoyaltyAndSyncCart() {
      if (!isHydrated) return; // Wait for hydration before doing anything

      try {
        const [profileRes, settingsRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/settings')
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
          if (profileData) {
            form.reset({
              fullName: profileData.name || '',
              phone: profileData.phone || '',
              street: profileData.address || '',
              deliveryArea: (profileData.division?.toLowerCase().includes('dhaka') || profileData.district?.toLowerCase().includes('dhaka')) ? 'inside' : 'outside',
              paymentMethod: 'TT',
            });
          }
        }
        if (settingsRes.ok) setSettings(await settingsRes.json());

        // --- CART SYNC LOGIC ---
        // Verify all items in cart still exist, have correct variants, and have sufficient stock
        if (items.length > 0) {
          // Group items by product/variant for accurate stock check
          const groupedForSync: Record<string, any> = {};
          items.forEach(item => {
            const key = `${item.productId}-${String(item.color || '').trim()}-${String(item.size || '').trim()}`;
            if (groupedForSync[key]) {
              groupedForSync[key].quantity += item.quantity;
            } else {
              groupedForSync[key] = {
                productId: item.productId,
                color: item.color,
                size: item.size,
                quantity: item.quantity
              };
            }
          });

          const syncRes = await fetch('/api/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: Object.values(groupedForSync) })
          });

          if (syncRes.ok) {
            const { validItems, removedCount, hasInsufficientStock } = await syncRes.json();

            // If items were removed (product/variant no longer exists)
            if (removedCount > 0) {
              dispatch(syncItems(validItems));
              toast.info(`${removedCount} items are no longer available and were removed`);
            }

            // If stock is insufficient, we'll store this state locally to show warnings
            setSyncData({ validItems, hasInsufficientStock });

            if (hasInsufficientStock) {
              toast.error('Some items in your cart have insufficient stock. Please adjust quantities.');
            }
          } else {
            console.error('Cart sync failed:', await syncRes.text());
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial data or sync cart:', error);
      }
    }
    fetchLoyaltyAndSyncCart();
  }, [form, isHydrated, items.length, dispatch]);

  // Re-sync cart stock when items change (including quantity)
  useEffect(() => {
    if (!isHydrated || items.length === 0) return;

    const syncCartStock = async () => {
      try {
        const groupedForSync: Record<string, any> = {};
        items.forEach(item => {
          const key = `${item.productId}-${String(item.color || '').trim()}-${String(item.size || '').trim()}`;
          if (groupedForSync[key]) {
            groupedForSync[key].quantity += item.quantity;
          } else {
            groupedForSync[key] = {
              productId: item.productId,
              color: item.color,
              size: item.size,
              quantity: item.quantity
            };
          }
        });

        const syncRes = await fetch('/api/cart/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: Object.values(groupedForSync) })
        });

        if (syncRes.ok) {
          const data = await syncRes.json();
          setSyncData({ validItems: data.validItems, hasInsufficientStock: data.hasInsufficientStock });
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    };

    const timer = setTimeout(syncCartStock, 500); // Debounce sync
    return () => clearTimeout(timer);
  }, [items, isHydrated]);

  const [syncData, setSyncData] = useState<any>(null);
  const [isPendingOrderBlocked, setIsPendingOrderBlocked] = useState(false);

  const hasTrackedInitiate = useRef(false);
  // Track InitiateCheckout
  useEffect(() => {
    if (!isHydrated || items.length === 0 || hasTrackedInitiate.current) return;

    const validItems = items.filter(i => i.productId);
    if (validItems.length === 0) return;

    hasTrackedInitiate.current = true;

    const checkoutPayload = {
      content_ids: validItems.map(i => i.productId),
      content_type: 'product',
      value: totalAmount,
      currency: 'BDT',
      num_items: validItems.length,
      contents: validItems.map(i => ({
        id: i.productId,
        quantity: i.quantity,
        item_price: i.price
      }))
    };

    const initiateUserData = { em: profile?.email, country: 'bd' };

    // Wait for fbq to initialize before firing browser pixel
    // CAPI still fires immediately regardless
    const waitForFbq = (maxWaitMs = 5000, intervalMs = 200) =>
      new Promise<void>((resolve) => {
        if (typeof window !== 'undefined' && window.fbq) { resolve(); return; }
        let elapsed = 0;
        const timer = setInterval(() => {
          elapsed += intervalMs;
          if ((typeof window !== 'undefined' && window.fbq) || elapsed >= maxWaitMs) {
            clearInterval(timer);
            resolve();
          }
        }, intervalMs);
      });

    waitForFbq().then(() => {
      fbEvent('InitiateCheckout', checkoutPayload, initiateUserData);
      ttEvent('InitiateCheckout', checkoutPayload, initiateUserData);
    });
  }, [isHydrated, items, totalAmount, profile?.email]);

  // Check for pending order proactively when phone number is typed or on load
  const watchedPhoneVal = form.watch('phone');
  useEffect(() => {
    const checkPendingOrder = async () => {
      const query = new URLSearchParams();
      if (watchedPhoneVal && watchedPhoneVal.trim().length >= 11) {
        query.append('phone', watchedPhoneVal.trim());
      }
      try {
        const res = await fetch(`/api/orders/check-pending?${query.toString()}`);
        if (res.ok) {
          const { hasPending } = await res.json();
          if (hasPending) {
            setIsPendingOrderBlocked(true);
            toast.error("You already have a pending order. Please wait for it to be confirmed before placing another order.");
          } else {
            setIsPendingOrderBlocked(false);
          }
        }
      } catch (err) {
        console.error("Error checking pending order:", err);
      }
    };

    checkPendingOrder();
  }, [watchedPhoneVal]);

  // Debounced sync of checkout info for abandoned carts tracking
  const watchedFullName = form.watch('fullName');
  const watchedPhone = form.watch('phone');
  const watchedStreet = form.watch('street');
  const watchedDeliveryArea = form.watch('deliveryArea');

  useEffect(() => {
    if (!isHydrated || items.length === 0 || submissionSucceededRef.current) return;
    if (!watchedPhone || watchedPhone.trim().length < 11 || !watchedFullName || watchedFullName.trim().length < 2) return;

    const syncAbandonedCart = async () => {
      try {
        await fetch('/api/cart/abandoned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: watchedFullName,
            phone: watchedPhone,
            email: profile?.email || '',
            street: watchedStreet,
            deliveryArea: watchedDeliveryArea,
            items: items.map(item => ({
              product: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.image,
              color: item.color,
              size: item.size
            })),
            totalAmount
          })
        });
      } catch (error) {
        console.error('Failed to sync abandoned cart:', error);
      }
    };

    const timer = setTimeout(syncAbandonedCart, 2000); // 2 seconds debounce
    return () => clearTimeout(timer);
  }, [watchedFullName, watchedPhone, watchedStreet, watchedDeliveryArea, items, totalAmount, isHydrated, profile?.email]);

  const submissionSucceededRef = useRef(false);

  const onSubmit = async (values: CheckoutValues) => {
    setLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({
          product: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          color: item.color,
          size: item.size
        })),
        shippingAddress: {
          fullName: values.fullName,
          phone: values.phone,
          email: profile?.email || `${values.phone}@store.com`,
          street: values.street,
          city: profile?.city || (values.deliveryArea === 'inside' ? 'Standard Shipping Area' : 'Express Shipping Area'),
          state: profile?.state || (values.deliveryArea === 'inside' ? 'Standard Shipping' : 'Express Shipping'),
          division: profile?.division || 'International',
          district: profile?.district || 'International',
          thana: profile?.thana || 'International',
          zipCode: profile?.zipCode || '00000',
          country: profile?.country || 'International'
        },
        paymentMethod: values.paymentMethod,
        deliveryCharge: deliveryCharge,
        useWallet: useWallet,
        couponCode: appliedCoupon || undefined,
        manualPaymentDetails: (values.paymentMethod === 'TT' || values.paymentMethod === 'LC' || values.paymentMethod === 'Bank Transfer') ? {
          methodName: values.paymentMethod === 'TT'
            ? 'Telegraphic Transfer (T/T)'
            : values.paymentMethod === 'LC'
            ? 'Letter of Credit (L/C at Sight)'
            : 'Direct Bank Wire',
          senderNumber: bankSenderInfo.trim() || undefined,
          transactionId: bankReference.trim() || undefined
        } : undefined
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        submissionSucceededRef.current = true;

        // Track Purchase event immediately on API success
        try {
          const safeItems = Array.isArray(order.items) ? order.items : items;
          const fullName = values.fullName || '';
          const nameParts = fullName.trim().split(/\s+/);

          const purchaseEventData = {
            value: order.totalAmount ?? totalAmount,
            currency: 'BDT',
            content_ids: safeItems.map((i: any) => i.product?._id || i.product || i.productId),
            content_type: 'product',
            num_items: safeItems.length,
            contents: safeItems.map((i: any) => ({
              id: i.product?._id || i.product || i.productId,
              quantity: i.quantity,
              item_price: i.price,
            })),
          };

          const purchaseUserData: any = {
            em: profile?.email || '',
            ph: values.phone,
            fn: nameParts[0] || '',
            ln: nameParts.slice(1).join(' ') || '',
            country: 'bd',
          };

          if (values.deliveryArea === 'inside') {
            purchaseUserData.ct = 'Dhaka';
            purchaseUserData.st = 'Dhaka';
          }

          fbEvent('Purchase', purchaseEventData, purchaseUserData, order._id);
          ttEvent('Purchase', purchaseEventData, purchaseUserData, order._id);
        } catch (trackingError) {
          console.error('Tracking error:', trackingError);
        }

        if (values.paymentMethod === 'Online') {
          // Initialize SSLCommerz Payment
          const initRes = await fetch('/api/payment/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order._id }),
          });

          if (initRes.ok) {
            const { url } = await initRes.json();
            // Clear cart ONLY after successful payment initialization
            dispatch(clearCart());
            // Redirect to SSLCommerz Gateway
            window.location.href = url;
            return; // Stop further execution
          } else {
            const initError = await initRes.json();
            toast.error(initError.message || 'Failed to initialize payment gateway. Please try paying from your dashboard.');
            // Still clear cart if the order was created successfully
            dispatch(clearCart());
            setSuccessOrderId(order._id);
            setShowSuccessModal(true);
          }
        } else {
          // COD / Manual Success — clear cart and show success modal
          dispatch(clearCart());
          setSuccessOrderId(order._id);
          setShowSuccessModal(true);
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to place order');
      }
    } catch (error) {
      toast.error('An error occurred while placing your order');
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (codeToUse?: string) => {
    const code = codeToUse || couponCode;
    if (!code.trim()) return;

    setApplyingCoupon(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code, totalAmount })
      });
      const data = await res.json();
      if (res.ok) {
        setCouponDiscount(data.discountAmount);
        setAppliedCoupon(data.code);
        if (!codeToUse) toast.success(`Coupon "${data.code}" applied!`);
      } else {
        // If re-validating an already applied coupon, remove it
        if (codeToUse) {
          removeCoupon();
          toast.info(data.message || 'Coupon removed due to cart changes');
        } else {
          toast.error(data.message || 'Invalid coupon');
        }
      }
    } catch (error) {
      if (!codeToUse) toast.error('Failed to validate coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Re-validate coupon when cart total changes
  useEffect(() => {
    if (appliedCoupon && totalAmount > 0) {
      applyCoupon(appliedCoupon);
    }
  }, [totalAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeCoupon = () => {
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };



  const freeDeliveryThreshold = settings?.freeDeliveryThreshold || 0;
  const isFreeDelivery = freeDeliveryThreshold > 0 && totalAmount >= freeDeliveryThreshold;

  const chargeInsideDhaka = settings?.deliveryChargeInsideDhaka ?? 60;
  const chargeOutsideDhaka = settings?.deliveryChargeOutsideDhaka ?? 120;

  const totalProductDiscount = items.reduce((sum, item) => {
    const itemBasePrice = item.basePrice || item.price;
    return sum + Math.max(0, itemBasePrice - item.price) * item.quantity;
  }, 0);

  const deliveryArea = form.watch('deliveryArea');
  const isDhaka = deliveryArea === 'inside';
  const deliveryCharge = items.length > 0 ? (
    isFreeDelivery ? 0 : (isDhaka ? chargeInsideDhaka : chargeOutsideDhaka)
  ) : 0;

  const totalAfterCoupon = Math.max(0, totalAmount + deliveryCharge - couponDiscount);

  const walletAmountToUse = useWallet && profile?.walletBalance
    ? Math.min(profile.walletBalance, totalAfterCoupon)
    : 0;

  const finalTotal = totalAfterCoupon - walletAmountToUse;

  // Validation check for mandatory fields to show/hide the order button
  const watchedFields = form.watch();
  const isPhoneValid = (watchedFields.phone || '').trim().replace(/[^0-9]/g, '').length >= 7;
  const isAddressValid = (watchedFields.street || '').trim().length >= 5;
  const isNameValid = (watchedFields.fullName || '').trim().length >= 2;
  const isFormValid = !!(
    isNameValid &&
    isPhoneValid &&
    isAddressValid &&
    watchedFields.deliveryArea &&
    watchedFields.paymentMethod
  );

  const potentialReward = (profile?.isSubscriptionActive && settings?.subscriptionConfig)
    ? Math.floor(finalTotal * (settings.subscriptionConfig.rewardPercentage / 100))
    : 0;

  const handleUpdateQuantity = (item: any, delta: number) => {
    if (item.quantity + delta === 0) {
      dispatch(removeFromCart({ productId: item.productId, color: item.color, size: item.size }));
      toast.info(`${item.name} removed from cart`);
    } else {
      dispatch(addToCart({ ...item, quantity: delta }));
    }
  };

  // Show loading state while hydrating to prevent flash of "empty cart" redirect
  if (!isHydrated) return (
    <div className="container min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  // Show empty cart UI instead of redirecting
  if (items.length === 0 && !showSuccessModal && !showFailModal) return (
    <div className="container min-h-[70vh] flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
        <ShoppingBag className="w-12 h-12 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight">Your Cart is Empty!</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Please add items to your cart before proceeding to checkout.
        </p>
      </div>
      <Button
        onClick={() => router.push('/shop')}
        className="rounded-full px-8 h-11 font-bold"
      >
        Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="container px-4 md:px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left Side: Order Summary */}
        <div className="hidden lg:block sticky top-24 self-start space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Items</CardTitle>
              <CardDescription>Items you are about to purchase.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2 -mr-2">
                {items.map((item, index) => (
                  <div key={`${item.productId}-${item.color || 'no-color'}-${item.size || 'no-size'}-${index}`} className="flex gap-4 items-start relative group">
                    <div className="h-16 w-16 rounded-md border bg-muted flex-shrink-0 relative overflow-hidden">
                      {item.image && (
                        <Image 
                          src={item.image} 
                          alt={item.name || 'Product'} 
                          width={64} 
                          height={64} 
                          priority={index === 0}
                          loading={index === 0 ? "eager" : "lazy"}
                          className="h-full w-full object-cover" 
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2 w-full min-w-0">
                        <div className="flex flex-col pr-4 min-w-0 flex-1">
                          <p className="text-sm font-bold truncate" title={item.name}>{item.name}</p>
                          {(item.color || item.size) && (
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {[item.color, item.size].filter(Boolean).join(' / ')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            dispatch(removeFromCart({ productId: item.productId, color: item.color, size: item.size }));
                            toast.info(`${item.name} removed from cart`);
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 -mt-1 -mr-1"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border rounded-full bg-muted/50 scale-90 -ml-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item, -1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item, 1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">${Math.round(item.price * item.quantity)}</p>
                          {syncData?.validItems?.find((v: any) =>
                            v.productId === item.productId &&
                            v.color === item.color &&
                            v.size === item.size
                          )?.isInsufficient && (
                              <p className="text-[9px] text-destructive font-black animate-pulse mt-1">
                                INSUFFICIENT STOCK (Available: {
                                  syncData.validItems.find((v: any) =>
                                    v.productId === item.productId &&
                                    v.color === item.color &&
                                    v.size === item.size
                                  ).availableStock
                                })
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-bold">Items Total</span>
                <span className="text-xl font-black text-primary">${Math.round(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Delivery & Payment */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
            <p className="text-muted-foreground mt-2">Complete your order by filling in the details below.</p>
          </div>

          <Form {...form}>
            <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Truck className="h-6 w-6 text-primary" />
                    Shipping & Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} className="h-11 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. +1 555 123 4567" {...field} className="h-11 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryArea"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="font-bold">Shipping Method</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-row space-x-6 pt-1"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0 cursor-pointer">
                              <FormControl>
                                <RadioGroupItem value="inside" />
                              </FormControl>
                              <FormLabel className="font-medium cursor-pointer text-sm">
                                Standard Shipping (${settings?.deliveryChargeInsideDhaka ?? 60})
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0 cursor-pointer">
                              <FormControl>
                                <RadioGroupItem value="outside" />
                              </FormControl>
                              <FormLabel className="font-medium cursor-pointer text-sm">
                                Express Shipping (${settings?.deliveryChargeOutsideDhaka ?? 120})
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address, apartment, city, state, zip code" {...field} className="h-11 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Detailed Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Coupon Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Coupon Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={!!appliedCoupon || applyingCoupon}
                        className="h-10 text-xs"
                      />
                      {appliedCoupon ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeCoupon}
                          className="h-10 px-3"
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => applyCoupon()}
                          disabled={applyingCoupon || !couponCode}
                          className="h-10 px-4"
                        >
                          {applyingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                        </Button>
                      )}
                    </div>
                    {appliedCoupon && (
                      <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Coupon "{appliedCoupon}" active!
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${Math.round(totalAmount + totalProductDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Product Discount</span>
                      <span>- ${Math.round(totalProductDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Coupon Discount</span>
                      <span className={couponDiscount > 0 ? "text-green-600 font-bold" : ""}>
                        - ${Math.round(couponDiscount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className={isFreeDelivery ? "text-green-600 font-black" : "text-primary font-bold"}>
                        {isFreeDelivery ? 'FREE' : `$${deliveryCharge}`}
                      </span>
                    </div>
                    {isFreeDelivery && (
                      <p className="text-[10px] text-green-600 font-bold text-right -mt-1">
                        Free shipping applied (Order ≥ ${freeDeliveryThreshold})
                      </p>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Loyalty Discount</span>
                      <span className={walletAmountToUse > 0 ? "text-primary font-bold" : ""}>
                        - ${Math.round(walletAmountToUse)}
                      </span>
                    </div>
                    <Separator className="mt-4" />
                    <div className="flex justify-between text-lg font-black pt-2">
                      <span>Final Total</span>
                      <span className="text-primary">${Math.round(finalTotal)}</span>
                    </div>
                    {potentialReward > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Loyalty Perk</p>
                        <p className="text-xs font-bold">You will earn <span className="text-primary">${potentialReward}</span> tokens from this order!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-3"
                          >
                            {/* 1. Telegraphic Transfer (T/T) */}
                            <FormItem className={`flex items-start space-x-3 space-y-0 border rounded-xl p-4 cursor-pointer transition-all ${field.value === 'TT' ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'hover:bg-muted/50'}`}>
                              <FormControl className="mt-1">
                                <RadioGroupItem value="TT" />
                              </FormControl>
                              <FormLabel className="font-bold flex-1 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-black flex items-center gap-2">
                                    <Landmark className="h-4 w-4 text-primary" /> Telegraphic Transfer (T/T)
                                  </span>
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary text-primary">Standard B2B Wire</Badge>
                                </div>
                                <p className="text-xs font-normal text-muted-foreground mt-1">
                                  International Bank Wire Transfer (SWIFT / BIC). Proforma Invoice with complete bank coordinates will be issued.
                                </p>
                              </FormLabel>
                            </FormItem>

                            {/* 2. Letter of Credit (L/C) */}
                            <FormItem className={`flex items-start space-x-3 space-y-0 border rounded-xl p-4 cursor-pointer transition-all ${field.value === 'LC' ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'hover:bg-muted/50'}`}>
                              <FormControl className="mt-1">
                                <RadioGroupItem value="LC" />
                              </FormControl>
                              <FormLabel className="font-bold flex-1 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-black flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" /> Letter of Credit (L/C at Sight)
                                  </span>
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold">Documentary Credit</Badge>
                                </div>
                                <p className="text-xs font-normal text-muted-foreground mt-1">
                                  Irrevocable Commercial L/C at Sight. Formal Proforma Invoice with advising bank details will be provided for your bank.
                                </p>
                              </FormLabel>
                            </FormItem>

                            {/* 3. Direct Bank Transfer */}
                            <FormItem className={`flex items-start space-x-3 space-y-0 border rounded-xl p-4 cursor-pointer transition-all ${field.value === 'Bank Transfer' ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'hover:bg-muted/50'}`}>
                              <FormControl className="mt-1">
                                <RadioGroupItem value="Bank Transfer" />
                              </FormControl>
                              <FormLabel className="font-bold flex-1 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-black flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" /> Direct Bank Wire Transfer
                                  </span>
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold">ACH / Fedwire / SEPA</Badge>
                                </div>
                                <p className="text-xs font-normal text-muted-foreground mt-1">
                                  Direct domestic/international bank transfer into our corporate trading account.
                                </p>
                              </FormLabel>
                            </FormItem>

                            {/* 4. Secure Online Payment (Card) - if enabled */}
                            {settings?.paymentConfig?.activeMethod === 'sslcommerz' && (
                              <FormItem className={`flex items-start space-x-3 space-y-0 border rounded-xl p-4 cursor-pointer transition-all ${field.value === 'Online' ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'hover:bg-muted/50'}`}>
                                <FormControl className="mt-1">
                                  <RadioGroupItem value="Online" />
                                </FormControl>
                                <FormLabel className="font-bold flex-1 cursor-pointer">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-black flex items-center gap-2">
                                      <CreditCard className="h-4 w-4 text-primary" /> Credit / Debit Card
                                    </span>
                                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">Instant Online</Badge>
                                  </div>
                                  <p className="text-xs font-normal text-muted-foreground mt-1">
                                    Pay securely with Visa, MasterCard, or American Express.
                                  </p>
                                </FormLabel>
                              </FormItem>
                            )}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Details / Instructions Card based on selection */}
                  {form.watch('paymentMethod') === 'TT' && (
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <Landmark className="h-4 w-4" /> Telegraphic Transfer (T/T) Instructions:
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 bg-background/80 p-3 rounded-lg border">
                        <p><strong className="text-foreground">Beneficiary Name:</strong> {settings?.brandName || 'Climax Apparels Ltd.'}</p>
                        <p><strong className="text-foreground">Settlement Currency:</strong> USD / EUR / GBP</p>
                        <p><strong className="text-foreground">SWIFT / BIC & IBAN:</strong> Provided on official Proforma Invoice (PI)</p>
                        <p><strong className="text-foreground">Payment Term:</strong> Standard Trade Terms (Advance / Wire)</p>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <Label className="text-xs font-bold">Buyer Bank / PO Reference <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                        <Input
                          placeholder="e.g. JPMorgan Chase / PO-2026-US-001"
                          value={bankReference}
                          onChange={(e) => setBankReference(e.target.value)}
                          className="h-10 text-xs bg-background"
                        />
                      </div>
                    </div>
                  )}

                  {form.watch('paymentMethod') === 'LC' && (
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <FileText className="h-4 w-4" /> Letter of Credit (L/C at Sight) Settlement:
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 bg-background/80 p-3 rounded-lg border">
                        <p><strong className="text-foreground">Documentary Credit:</strong> 100% Irrevocable Letter of Credit at Sight</p>
                        <p><strong className="text-foreground">Advising / Nominated Bank:</strong> HSBC / Standard Chartered Bank</p>
                        <p><strong className="text-foreground">Next Step:</strong> Formal Proforma Invoice (PI) with banking coordinates will be generated for your bank.</p>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <Label className="text-xs font-bold">Buyer's Issuing Bank & Country <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                        <Input
                          placeholder="e.g. Deutsche Bank AG, Frankfurt, Germany"
                          value={bankReference}
                          onChange={(e) => setBankReference(e.target.value)}
                          className="h-10 text-xs bg-background"
                        />
                      </div>
                    </div>
                  )}

                  {form.watch('paymentMethod') === 'Bank Transfer' && (
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <Building2 className="h-4 w-4" /> Direct Bank Wire Details:
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 bg-background/80 p-3 rounded-lg border">
                        <p><strong className="text-foreground">Account Holder:</strong> {settings?.brandName || 'Climax Apparels Ltd.'}</p>
                        <p><strong className="text-foreground">Payment Routing:</strong> Fedwire (US) / SEPA (Europe) / International SWIFT</p>
                        <p className="text-[11px] text-muted-foreground">Order will be confirmed and processed upon wire verification.</p>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <Label className="text-xs font-bold">Transaction / Wire Note <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                        <Input
                          placeholder="e.g. Wire Transfer Reference ID"
                          value={bankReference}
                          onChange={(e) => setBankReference(e.target.value)}
                          className="h-10 text-xs bg-background"
                        />
                      </div>
                    </div>
                  )}

                  {profile && profile.walletBalance > 0 && (
                    <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="use-wallet"
                            checked={useWallet}
                            onChange={(e) => setUseWallet(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="use-wallet" className="font-bold cursor-pointer">
                            Use Token Balance
                            <p className="text-xs font-normal text-muted-foreground">Available: ${profile.walletBalance}</p>
                          </label>
                        </div>
                        {useWallet && <span className="text-sm font-black text-primary">-${walletAmountToUse}</span>}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 border-t flex flex-col gap-3">
                  <Button
                    type="submit"
                    className={`w-full h-14 rounded-full font-black uppercase tracking-widest text-sm transition-all ${isFormValid && !syncData?.hasInsufficientStock && !isPendingOrderBlocked
                        ? 'bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95'
                        : 'bg-muted text-muted-foreground cursor-not-allowed opacity-70'
                      }`}
                    disabled={loading || !isFormValid || syncData?.hasInsufficientStock || isPendingOrderBlocked}
                  >
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                    {isPendingOrderBlocked ? 'Pending Order in Progress' : syncData?.hasInsufficientStock ? 'Insufficient Stock' : 'Place Order'}
                  </Button>
                  {!isFormValid && (
                    <p className="text-[10px] font-bold text-muted-foreground text-center w-full uppercase tracking-widest">
                      Please complete shipping & payment details to place order
                    </p>
                  )}
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
      </div>

      {/* Order Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl">
          <div className="flex flex-col items-center text-center p-8 gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center border-4 border-green-500/20 shadow-xl shadow-green-500/20 animate-in zoom-in-50 duration-500">
                <PartyPopper className="w-12 h-12 text-green-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Order Placed Successfully!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Thank you for your order. We have received your order details and our export & trade desk will contact you with your formal Proforma Invoice (PI) and settlement coordinates.
              </p>
              {successOrderId && (
                <p className="text-xs font-mono bg-muted px-3 py-1.5 rounded-full inline-block text-muted-foreground">
                  Order ID: <span className="font-bold text-foreground">#{successOrderId.slice(-8).toUpperCase()}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 w-full pt-2">
              <Button
                onClick={() => { setShowSuccessModal(false); router.push('/shop'); }}
                className="w-full h-11 rounded-full font-bold shadow-lg shadow-primary/20"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowSuccessModal(false); router.push('/dashboard'); }}
                className="w-full h-11 rounded-full font-bold"
              >
                View My Orders
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Failed Modal */}
      <Dialog open={showFailModal} onOpenChange={setShowFailModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl">
          <div className="flex flex-col items-center text-center p-8 gap-6">
            <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center border-4 border-destructive/20 shadow-xl shadow-destructive/20 animate-in zoom-in-50 duration-500">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-destructive">Payment Failed</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your payment could not be processed. Please try again or select an alternative settlement method.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full pt-2">
              <Button
                onClick={() => setShowFailModal(false)}
                className="w-full h-11 rounded-full font-bold"
              >
                Try Again
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowFailModal(false); router.push('/shop'); }}
                className="w-full h-11 rounded-full font-bold"
              >
                Back to Shop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container py-24 flex justify-center items-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

