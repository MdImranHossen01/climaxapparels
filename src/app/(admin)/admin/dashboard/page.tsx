'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { CartesianGrid, Area, AreaChart, XAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { 
  DollarSign, 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  Clock, 
  Wallet,
  ArrowRight,
  Loader2,
  TrendingUp,
  LineChart as LineChartIcon,
  Filter,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  Star,
  UserPlus,
  Target,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { format, subDays, parseISO, isAfter, startOfToday } from 'date-fns';

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--primary)",
  },
  profit: {
    label: "Gross Profit",
    color: "var(--chart-2)",
  },
  orders: {
    label: "Total Sales",
    color: "#fb923c",
  },
} satisfies ChartConfig;

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>("revenue");
  
  // Date filter state
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  const [debouncedDateRange, setDebouncedDateRange] = useState(dateRange);

  // Debounce date range changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDateRange(dateRange);
    }, 500);
    return () => clearTimeout(timer);
  }, [dateRange]);

  const handleDateChange = (key: 'from' | 'to', value: string) => {
    const newDate = parseISO(value);
    const today = startOfToday();
    
    // Block future dates
    if (isAfter(newDate, today)) {
      setDateRange(prev => ({ ...prev, [key]: format(today, 'yyyy-MM-dd') }));
      return;
    }

    setDateRange(prev => {
      const nextRange = { ...prev, [key]: value };
      const fromDate = parseISO(nextRange.from);
      const toDate = parseISO(nextRange.to);

      // Ensure from <= to
      if (isAfter(fromDate, toDate)) {
        if (key === 'from') {
          return { ...nextRange, to: value };
        } else {
          return { ...nextRange, from: value };
        }
      }
      return nextRange;
    });
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        from: debouncedDateRange.from,
        to: debouncedDateRange.to,
      }).toString();
      
      const response = await fetch(`/api/admin/dashboard/stats?${query}`);
      if (response.ok) {
        const stats = await response.json();
        setData(stats);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || `Failed to fetch: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [debouncedDateRange]);

  const total = useMemo(() => {
    if (!data?.chartData) return { revenue: 0, profit: 0, orders: 0 };
    return {
      revenue: data.chartData.reduce((acc: number, curr: any) => acc + curr.revenue, 0),
      profit: data.chartData.reduce((acc: number, curr: any) => acc + curr.profit, 0),
      orders: data.chartData.reduce((acc: number, curr: any) => acc + curr.orders, 0),
    };
  }, [data]);

  const processedChartData = useMemo(() => {
    if (!data?.chartData) return [];
    
    const start = parseISO(dateRange.from);
    const end = parseISO(dateRange.to);
    const result = [];
    
    const dataMap = new Map(data.chartData.map((item: any) => [item.date, item]));
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      const existing = dataMap.get(dateStr);
      if (existing) {
        result.push(existing);
      } else {
        result.push({
          date: dateStr,
          revenue: 0,
          profit: 0,
          orders: 0
        });
      }
    }
    return result;
  }, [data, dateRange]);

  if (loading && !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-8 w-8" />
          <h3 className="text-xl font-bold">Dashboard Error</h3>
        </div>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => fetchStats()}>Retry</Button>
      </div>
    );
  }

  const { stats, recentOrders, lowStockProducts, topSellingProducts, topCustomers, chartData } = data || {};

  return (
    <div className="flex-1 space-y-6 px-0 py-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground text-xs md:text-sm">Advanced business intelligence and sales analytics.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border w-full sm:w-auto">
            <div className="flex items-center gap-1 px-2 shrink-0">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Range</span>
            </div>
            <div className="flex items-center gap-1 flex-1 sm:flex-initial">
              <Input 
                type="date" 
                className="h-8 w-full sm:w-32 border-none bg-transparent focus-visible:ring-0 cursor-pointer text-xs p-1" 
                value={dateRange.from}
                onChange={(e) => handleDateChange('from', e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
              <span className="text-muted-foreground text-[10px] shrink-0">to</span>
              <Input 
                type="date" 
                className="h-8 w-full sm:w-32 border-none bg-transparent focus-visible:ring-0 cursor-pointer text-xs p-1" 
                value={dateRange.to}
                onChange={(e) => handleDateChange('to', e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats} className="h-10 px-4 w-full sm:w-auto font-bold">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pending Orders Card */}
        <Link href="/admin/orders" className="block transition-transform hover:scale-[1.02] active:scale-95">
          <Card className="bg-orange-500/5 border-orange-500/20 relative overflow-hidden group h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{stats?.pendingOrdersCount || 0}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </Link>

        {/* Total Customers Card */}
        <Link href="/admin/users" className="block transition-transform hover:scale-[1.02] active:scale-95">
          <Card className="bg-blue-500/5 border-blue-500/20 relative overflow-hidden group h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Across all time</p>
            </CardContent>
          </Card>
        </Link>

        {/* ROAS Card (NEW) */}
        <Card className="bg-purple-500/5 border-purple-500/20 relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad ROI (ROAS)</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{stats?.roas ? `${stats.roas}x` : '—'}</div>
            <p className="text-xs text-muted-foreground">Revenue per ৳1 Ad Spend</p>
          </CardContent>
        </Card>

        {/* Forecast Card (NEW) */}
        <Card className="bg-orange-500/5 border-orange-500/20 relative overflow-hidden group border-dashed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Forecast</CardTitle>
            <LineChartIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">৳{Math.round(stats?.projectedMonthlyRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Projected next 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1">
        {/* Interactive Chart */}
        <Card className="col-span-full">
          <CardHeader className="flex flex-col items-stretch border-b p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-4 md:px-6 md:py-6">
              <CardTitle className="text-lg md:text-xl">Performance Trends</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Comparison between Revenue and Gross Profit
              </CardDescription>
            </div>
            <div className="flex overflow-x-auto border-t sm:border-t-0 no-scrollbar">
              {(["revenue", "profit", "orders"] as const).map((key) => (
                <button
                  key={key}
                  data-active={activeChart === key}
                  className="flex flex-1 min-w-[100px] sm:min-w-[120px] flex-col justify-center gap-1 border-r last:border-r-0 px-4 py-3 md:px-8 md:py-6 text-left data-[active=true]:bg-muted/50 sm:border-l sm:border-r-0"
                  onClick={() => setActiveChart(key)}
                >
                  <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                    {chartConfig[key].label}
                  </span>
                  <span className="text-base md:text-2xl leading-none font-bold">
                    {key === 'orders' ? total[key].toLocaleString() : `৳${total[key].toLocaleString()}`}
                  </span>
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="px-1 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] md:h-[350px] w-full"
            >
              <AreaChart data={processedChartData} margin={{ left: 12, right: 12, top: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-profit)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-profit)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-orders)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-orders)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  minTickGap={32}
                  tickFormatter={(value) => format(new Date(value), 'dd MMM')}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="w-[180px]"
                      labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy')}
                      indicator="dot"
                    />
                  }
                />
                {/* Reference Line for Average */}
                <ReferenceLine 
                  y={total[activeChart] / (processedChartData?.length || 1)} 
                  label={{ value: 'Avg', position: 'insideRight', fill: activeChart === "revenue" ? 'var(--primary)' : 'var(--chart-2)', fontSize: 10 }}
                  stroke={activeChart === "revenue" ? "var(--primary)" : "var(--chart-2)"} 
                  strokeDasharray="3 3" 
                  strokeOpacity={0.5}
                />
                <Area
                  dataKey="revenue"
                  type="natural"
                  fill="url(#fillRevenue)"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  hide={activeChart !== "revenue"}
                />
                <Area
                  dataKey="profit"
                  type="natural"
                  fill="url(#fillProfit)"
                  stroke="var(--color-profit)"
                  strokeWidth={2}
                  hide={activeChart !== "profit"}
                />
                <Area
                  dataKey="orders"
                  type="natural"
                  fill="url(#fillOrders)"
                  stroke="var(--color-orders)"
                  strokeWidth={2}
                  hide={activeChart !== "orders"}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {/* Customer Insights & New vs Returning (NEW/UPDATED) */}
        <div className="space-y-4">
          <Card className="bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Customer Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-around py-2 border-b">
                <div className="text-center">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">New</p>
                  <p className="text-xl font-black">{stats?.newUsersCount}</p>
                </div>
                <div className="h-8 w-px bg-border"></div>
                <div className="text-center">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Returning</p>
                  <p className="text-xl font-black">{stats?.returningUsersCount}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Top Spenders</p>
                {topCustomers && topCustomers.length > 0 ? (
                  topCustomers.map((customer: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate max-w-[120px]">{customer.name}</span>
                      <span className="font-bold text-primary">৳{Math.round(customer.totalSpend || 0).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-muted-foreground italic py-2 text-center">No customers yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground shadow-lg">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs opacity-70">Loyalty Members</p>
                  <p className="text-xl font-bold">{stats?.activeSubscribers}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs opacity-70">Pending Orders</p>
                  <p className="text-xl font-bold">{stats?.pendingOrdersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {lowStockProducts?.map((product: any) => (
                  <div key={product._id} className="flex items-center justify-between group">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold group-hover:text-primary transition-colors">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground">Unit Price: ৳{product.price}</p>
                    </div>
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                      {product.stock} Left
                    </Badge>
                  </div>
                ))}
                {(lowStockProducts?.length ?? 0) === 0 && (
                  <p className="text-center py-4 text-xs text-muted-foreground italic">Inventory levels are healthy!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Products (NEW) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Top Products
            </CardTitle>
            <CardDescription>Best performers by revenue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topSellingProducts?.map((product: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-xs">
                  {i + 1}
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-bold leading-none truncate max-w-[150px]">{product._id}</p>
                  <p className="text-xs text-muted-foreground">{product.quantity} units sold</p>
                </div>
                <div className="text-sm font-black">৳{Math.round(product.revenue).toLocaleString()}</div>
              </div>
            ))}
            {(!topSellingProducts || topSellingProducts.length === 0) && (
              <div className="text-center py-10 text-muted-foreground text-sm">No sales data available</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Recent Transactions</CardTitle>
                <CardDescription>Latest orders across the shop</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/orders">Manage All Orders</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
            <div className="divide-y">
              {recentOrders?.map((order: any) => (
                <div key={order._id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold leading-none">Order #{order.slug}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{order.user?.name || 'Guest Customer'}</span>
                        <span>•</span>
                        <span>{order?.createdAt ? format(parseISO(order.createdAt), 'dd MMM, p') : '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-sm font-black text-primary">৳{(order?.totalAmount || 0).toLocaleString()}</div>
                    <Badge 
                      variant={order.status === 'Delivered' ? 'default' : 'secondary'} 
                      className={`text-[10px] uppercase font-bold tracking-tighter ${order.status === 'Delivered' ? 'bg-emerald-500' : ''}`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

