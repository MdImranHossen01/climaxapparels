'use client';

import { useState } from 'react';
import { Truck, Search, Package, MapPin, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<any>(null);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId) {
            toast.error('Please enter a valid Order ID');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/track-order/${encodeURIComponent(orderId)}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
                toast.success('Order found!');
            } else {
                setOrder(null);
                const errorData = await res.json();
                toast.error(errorData.message || 'Order not found. Please check the ID.');
            }
        } catch (error) {
            toast.error('Failed to track order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStep = (status: string) => {
        const statuses = ['Order Placed', 'Confirmed', 'Processing', 'Released for Delivery', 'Delivered'];
        return statuses.indexOf(status);
    };

    const steps = [
        { label: 'Order Placed', icon: Clock },
        { label: 'Confirmed', icon: CheckCircle2 },
        { label: 'Processing', icon: Package },
        { label: 'Released for Delivery', icon: Truck },
        { label: 'Delivered', icon: MapPin },
    ];

    const currentStep = order ? getStatusStep(order.status) : -1;

    return (
        <div className="min-h-screen bg-muted/30 py-20 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                        <Truck className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">Track Your Order</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Enter your Order ID to see the real-time status of your shipment.
                    </p>
                </div>

                {/* Search Card */}
                <Card className="border-2 shadow-xl shadow-primary/5 rounded-3xl overflow-hidden">
                    <CardContent className="p-8">
                        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder="Enter Order ID (e.g. #ORD12345)" 
                                    className="h-14 pl-12 rounded-2xl border-2 focus-visible:ring-primary bg-background"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                />
                            </div>
                            <Button 
                                type="submit" 
                                size="lg" 
                                disabled={loading}
                                className="h-14 px-10 rounded-2xl font-bold gap-2 text-lg"
                            >
                                {loading ? 'Searching...' : 'Track Now'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Tracking Result */}
                {order && (
                    <Card className="border-none shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader className="bg-primary text-primary-foreground p-8">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="text-primary-foreground/70 text-sm font-bold uppercase tracking-widest">Order ID</p>
                                    <CardTitle className="text-3xl font-black">#{order._id.slice(-8).toUpperCase()}</CardTitle>
                                </div>
                                <Badge variant="secondary" className="text-lg px-6 py-2 rounded-full font-black">
                                    {order.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-12">
                            {/* Progress Tracker */}
                            <div className="relative">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 hidden md:block" />
                                <div 
                                    className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 transition-all duration-1000 hidden md:block" 
                                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                                />
                                
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
                                    {steps.map((step, index) => {
                                        const Icon = step.icon;
                                        const isCompleted = index <= currentStep;
                                        const isCurrent = index === currentStep;

                                        return (
                                            <div key={step.label} className="flex flex-col items-center gap-4 text-center group">
                                                <div className={`
                                                    h-14 w-14 rounded-full flex items-center justify-center transition-all duration-500 z-10 border-4
                                                    ${isCompleted ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : 'bg-background text-muted-foreground border-muted'}
                                                    ${isCurrent ? 'scale-125 ring-8 ring-primary/10' : ''}
                                                `}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className={`font-bold text-sm ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {step.label}
                                                    </p>
                                                    {isCurrent && (
                                                        <p className="text-[10px] text-primary font-black uppercase tracking-tighter animate-pulse">
                                                            Currently Here
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <Package className="h-5 w-5 text-primary" /> Delivery Details
                                    </h3>
                                    <div className="space-y-3 bg-muted/50 p-6 rounded-2xl">
                                        <div>
                                            <p className="text-xs text-muted-foreground font-bold uppercase">Recipient Name</p>
                                            <p className="font-bold">{order.shippingDetails?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-bold uppercase">Shipping Address</p>
                                            <p className="font-medium text-sm leading-relaxed">{order.shippingDetails?.address || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-bold uppercase">Phone Number</p>
                                            <p className="font-bold">{order.shippingDetails?.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-primary" /> Order Timeline
                                    </h3>
                                    <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                                <CheckCircle2 className="h-3 w-3 text-white" />
                                            </div>
                                            <p className="text-sm font-bold">Order Received</p>
                                            <p className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div className="relative pl-8">
                                            <div className={`absolute left-0 top-1.5 h-6 w-6 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`}>
                                                {currentStep >= 1 ? <CheckCircle2 className="h-3 w-3 text-white" /> : <div className="h-2 w-2 rounded-full bg-background" />}
                                            </div>
                                            <p className={`text-sm font-bold ${currentStep >= 1 ? 'opacity-100' : 'opacity-40'}`}>Verification & Confirmation</p>
                                        </div>
                                        <div className="relative pl-8">
                                            <div className={`absolute left-0 top-1.5 h-6 w-6 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`}>
                                                {currentStep >= 3 ? <CheckCircle2 className="h-3 w-3 text-white" /> : <div className="h-2 w-2 rounded-full bg-background" />}
                                            </div>
                                            <p className={`text-sm font-bold ${currentStep >= 3 ? 'opacity-100' : 'opacity-40'}`}>Shipped & On the Way</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!order && !loading && orderId && (
                    <div className="bg-red-500/10 border-2 border-red-500/20 p-8 rounded-3xl text-center space-y-3">
                        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                        <h3 className="text-xl font-bold text-red-500">Order ID Not Found</h3>
                        <p className="text-sm text-red-600/70">
                            We couldn't find any order with the ID you provided. Please double-check your receipt or email confirmation.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

