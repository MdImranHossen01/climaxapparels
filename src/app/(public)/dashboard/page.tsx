'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
    Clock, 
    CheckCircle2, 
    Truck, 
    Package,
    ChevronRight,
    Loader2,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/lib/invoice-generator';

export default function OrdersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, settingsRes, profileRes] = await Promise.all([
            fetch('/api/orders'),
            fetch('/api/settings'),
            fetch('/api/user/profile')
        ]);

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(Array.isArray(data) ? data : []);
        } else {
          toast.error(`Failed to load orders: ${ordersRes.statusText || ordersRes.status}`);
        }

        if (settingsRes.ok) {
          setSettings(await settingsRes.json());
        } else {
          toast.error(`Failed to load settings: ${settingsRes.statusText || settingsRes.status}`);
        }
        
        if (profileRes.ok) {
          setProfile(await profileRes.json());
        } else {
          toast.error(`Failed to load profile details: ${profileRes.statusText || profileRes.status}`);
        }
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Order Placed': return 'secondary';
      case 'Confirmed': return 'default';
      case 'Paid': return 'default';
      case 'Ready for Delivery': return 'default';
      case 'Released for Delivery': return 'default';
      case 'Delivered': return 'default';
      case 'Cancelled': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Order History</h1>
        <p className="text-sm text-muted-foreground">{orders.length} total orders found</p>
      </div>

      <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Order ID</TableHead>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Items</TableHead>
              <TableHead className="font-bold">Total</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold w-[120px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2">
                         <Package className="h-8 w-8 text-muted-foreground opacity-20" />
                         <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                    </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs">#{order?._id?.slice(-8).toUpperCase() || 'N/A'}</TableCell>
                  <TableCell className="text-xs">{order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-xs">{Array.isArray(order?.items) ? order.items.length : 0} items</TableCell>
                  <TableCell className="font-bold">৳{typeof order?.totalAmount === 'number' ? Math.round(order.totalAmount) : '0'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={getStatusColor(order.status) as any}>
                        {order.status}
                      </Badge>
                      {order.shippingDetails?.trackingUrl && (
                        <a 
                          href={order.shippingDetails.trackingUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 mt-1"
                        >
                          <Truck className="h-3 w-3" /> Track Parcel
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            title={settings ? "Download Invoice" : "Loading settings..."}
                            disabled={!settings}
                            onClick={() => settings && generateInvoicePDF(order, settings)}
                        >
                            <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 group"
                            onClick={() => router.push(`/dashboard/orders/${order._id}`)}
                        >
                            Details
                            <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-10">
          <Card className="bg-primary/5 border-none shadow-none">
              <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  <div className="text-2xl font-black">৳{profile?.walletBalance || 0}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    Available Tokens
                  </div>
                  {profile?.isSubscriptionActive ? (
                    <Badge variant="default" className="text-[8px] h-4">Active Subscriber</Badge>
                  ) : (
                    <div className="text-[8px] text-muted-foreground">Inactive</div>
                  )}
              </CardContent>
          </Card>
          <Card className="bg-primary/5 border-none shadow-none">
              <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  <div className="text-2xl font-black">{orders.filter(o => o.status === 'Pending').length}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Pending Orders</div>
              </CardContent>
          </Card>
          <Card className="bg-primary/5 border-none shadow-none">
              <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
                  <Truck className="h-6 w-6 text-primary" />
                  <div className="text-2xl font-black">{orders.filter(o => o.status === 'Shipped').length}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Shipped Orders</div>
              </CardContent>
          </Card>
          <Card className="bg-primary/5 border-none shadow-none">
              <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <div className="text-2xl font-black">{orders.filter(o => o.status === 'Delivered').length}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Delivered Orders</div>
              </CardContent>
          </Card>
      </div>
    </>
  );
}

