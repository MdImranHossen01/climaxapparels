'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Package, 
    Truck, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Star,
    MessageSquare,
    Loader2,
    MapPin,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/lib/invoice-generator';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [orderRes, settingsRes] = await Promise.all([
                    fetch(`/api/orders/${id}`),
                    fetch('/api/settings')
                ]);

                if (orderRes.ok) {
                    setOrder(await orderRes.json());
                } else {
                    toast.error('Failed to load order details');
                }

                if (settingsRes.ok) {
                    setSettings(await settingsRes.json());
                }
            } catch (error) {
                toast.error('An error occurred while loading data');
            } finally {
                setLoading(false);
            }
        }
        if (session?.user) {
            fetchData();
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [id, session, status]);

    const getStatusStep = (status: string) => {
        const statuses = ['Order Placed', 'Confirmed', 'Processing', 'Ready for Delivery', 'Released for Delivery', 'Delivered'];
        const idx = statuses.indexOf(status);
        return idx === -1 ? 0 : idx;
    };

    if (loading) {
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center p-20 space-y-4">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto opacity-20" />
                <h2 className="text-2xl font-bold">Order Not Found</h2>
                <Button onClick={() => router.push('/dashboard')}>Back to Orders</Button>
            </div>
        );
    }

    const currentStep = getStatusStep(order.status);
    const isReviewable = ['Delivered', 'Paid'].includes(order.status);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.push('/dashboard')}
                        className="rounded-full h-12 w-12"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter">Order Details</h1>
                        <p className="text-sm text-muted-foreground">Order ID: #{order._id.slice(-8).toUpperCase()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {settings && (
                        <Button 
                            variant="outline" 
                            className="rounded-full font-bold h-11 gap-2"
                            onClick={async () => {
                                try {
                                    await generateInvoicePDF(order, settings);
                                } catch (error) {
                                    console.error('Invoice Generation Error:', error);
                                    toast.error('Failed to generate invoice PDF. Please try again.');
                                }
                            }}
                        >
                            <FileText className="h-4 w-4" /> Invoice
                        </Button>
                    )}
                    <Badge className="text-lg px-6 py-2 rounded-full font-black">
                        {order.status}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Order Info & Items */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Status Tracker */}
                    <Card className="border-none shadow-xl shadow-primary/5 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b p-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Truck className="h-5 w-5 text-primary" /> Tracking Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10">
                            <div className="relative flex justify-between items-start">
                                {/* Lines */}
                                <div className="absolute top-6 left-6 right-6 h-1 bg-muted -z-10" />
                                <div 
                                    className="absolute top-6 left-6 h-1 bg-primary -z-10 transition-all duration-1000" 
                                    style={{ width: `${(currentStep / 5) * 100}%` }}
                                />

                                {[
                                    { label: 'Placed', icon: Clock },
                                    { label: 'Confirmed', icon: CheckCircle2 },
                                    { label: 'Processing', icon: Package },
                                    { label: 'Ready', icon: Truck },
                                    { label: 'Delivery', icon: MapPin },
                                    { label: 'Delivered', icon: CheckCircle2 },
                                ].map((step, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-2">
                                        <div className={`
                                            h-12 w-12 rounded-full flex items-center justify-center border-4 transition-all duration-500
                                            ${idx <= currentStep ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' : 'bg-background border-muted text-muted-foreground'}
                                        `}>
                                            <step.icon className="h-5 w-5" />
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-tighter ${idx <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Items */}
                    <Card className="border-none shadow-xl shadow-primary/5 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b p-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" /> Order Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {(Array.isArray(order?.items) ? order.items : []).map((item: any, idx: number) => (
                                    <div key={idx} className="p-6 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                                        <div className="h-20 w-20 rounded-2xl bg-muted overflow-hidden flex-shrink-0 border">
                                            <Image 
                                                src={item.image || '/placeholder.png'} 
                                                alt={item.name} 
                                                width={80}
                                                height={80}
                                                className="h-full w-full object-cover" 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-lg truncate">{item.name}</h4>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                <span>Qty: {item.quantity}</span>
                                                {item.size && <span>Size: {item.size}</span>}
                                                {item.color && <span>Color: {item.color}</span>}
                                            </div>
                                            <p className="font-black text-primary mt-1">৳{item.price}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {isReviewable ? (
                                                <Button 
                                                    size="sm" 
                                                    className="rounded-full font-bold gap-1 px-4"
                                                    onClick={() => {
                                                        const slug = item.product?.slug || item.product?._id || item.product;
                                                        router.push(`/product/${slug}?review=true`);
                                                    }}
                                                >
                                                    <Star className="h-3 w-3 fill-current" /> Review
                                                </Button>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold opacity-50">
                                                    Review later
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Summaries & Shipping */}
                <div className="space-y-8">
                    {/* Summary */}
                    <Card className="border-none shadow-xl shadow-primary/5 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b p-6">
                            <CardTitle className="text-lg font-bold">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-bold">৳{order.totalAmount - order.deliveryCharge + (order.couponDiscountAmount || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Delivery Charge</span>
                                    <span className="font-bold">৳{order.deliveryCharge}</span>
                                </div>
                                {order.couponDiscountAmount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount ({order.couponCode})</span>
                                        <span className="font-bold">-৳{order.couponDiscountAmount}</span>
                                    </div>
                                )}
                                <Separator className="my-2" />
                                <div className="flex justify-between text-lg">
                                    <span className="font-black tracking-tight">Total</span>
                                    <span className="font-black text-primary">৳{order.totalAmount}</span>
                                </div>
                            </div>
                            <Badge variant="secondary" className="w-full justify-center h-10 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                                Paid via {order.paymentMethod}
                            </Badge>
                        </CardContent>
                    </Card>

                    {/* Shipping */}
                    <Card className="border-none shadow-xl shadow-primary/5 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b p-6">
                            <CardTitle className="text-lg font-bold">Shipping Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Recipient</p>
                                <p className="font-bold text-lg">{order.shippingAddress.fullName}</p>
                                <p className="text-sm font-medium">{order.shippingAddress.phone}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Address</p>
                                <p className="text-sm leading-relaxed">
                                    {order.shippingAddress.street}, {order.shippingAddress.city}<br />
                                    {order.shippingAddress.state}, {order.shippingAddress.zipCode}
                                </p>
                            </div>
                            {order.shippingDetails?.courierName && (
                                <div className="pt-4 border-t space-y-2">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Courier Service</p>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-primary">{order.shippingDetails.courierName}</span>
                                        {order.shippingDetails.trackingUrl && (
                                            <a 
                                                href={order.shippingDetails.trackingUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold underline text-primary"
                                            >
                                                Track External
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

