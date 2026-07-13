import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import Expense from '@/models/Expense';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Default range: Last 30 days
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const defaultTo = new Date();

    let startDate = defaultFrom;
    if (from) {
      const parsedFrom = new Date(from);
      if (!isNaN(parsedFrom.getTime())) {
        startDate = parsedFrom;
      }
    }

    let endDate = defaultTo;
    if (to) {
      const parsedTo = new Date(to);
      if (!isNaN(parsedTo.getTime())) {
        endDate = parsedTo;
      }
    }
    endDate.setHours(23, 59, 59, 999);

    await connectToDatabase();

    // 1 & 2. Total Revenue, COGS, and Sales Count (Delivered Orders)
    const revenueStats = await Order.aggregate([
      { 
        $match: { 
          status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
          createdAt: { $gte: startDate, $lte: endDate },
          deletedAt: null
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalDeliveryCharge: { $sum: '$deliveryCharge' },
          salesCount: { $sum: 1 },
          totalCOGS: { 
            $sum: { 
              $sum: {
                $map: {
                  input: '$items',
                  as: 'item',
                  in: { $multiply: ['$$item.quantity', { $ifNull: ['$$item.purchasePrice', 0] }] }
                }
              }
            }
          }
        }
      }
    ]);

    const { 
      totalRevenue = 0, 
      totalDeliveryCharge = 0,
      salesCount = 0, 
      totalCOGS = 0 
    } = revenueStats[0] || {};

    // 3. Expenses
    const expenseStats = await Expense.aggregate([
      { 
        $match: { 
          date: { $gte: startDate, $lte: endDate }
        } 
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);
    const totalExpenses = expenseStats[0]?.totalExpenses || 0;

    // 4. Calculations
    const grossProfit = totalRevenue - totalCOGS - totalDeliveryCharge;
    const netProfit = grossProfit - totalExpenses;

    // 5. Total Customers (Only users with role 'user')
    const totalUsers = await User.countDocuments({ 
      role: 'user' 
    });

    // 6. Pending Orders (Total, not date filtered)
    const pendingOrdersCount = await Order.countDocuments({ status: 'Order Placed', deletedAt: null });

    // 7. Recent Orders
    const recentOrders = await Order.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('slug totalAmount status createdAt')
      .populate('user', 'name email');

    // 8. Low Stock Products
    const lowStockProducts = await Product.find({ stock: { $lt: 5 } })
      .limit(5)
      .select('name stock price');

    // 9. Loyalty Stats
    const activeSubscribers = await User.countDocuments({ isSubscriptionActive: true });
    const totalWalletBalanceResult = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$walletBalance' } } }
    ]);
    const totalWalletTokens = totalWalletBalanceResult[0]?.total || 0;

    // 10. Top Selling Products
    const topSellingProducts = await Order.aggregate([
      { $match: { status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] }, createdAt: { $gte: startDate, $lte: endDate }, deletedAt: null } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          quantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // 11. Top Customers
    const topCustomers = await Order.aggregate([
      { $match: { status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] }, createdAt: { $gte: startDate, $lte: endDate }, deletedAt: null } },
      {
        $group: {
          _id: '$user',
          totalSpend: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: '$userData' },
      {
        $project: {
          name: '$userData.name',
          email: '$userData.email',
          totalSpend: 1,
          orderCount: 1
        }
      }
    ]);

    // 12. Ad ROI (ROAS)
    const adExpenses = await Expense.aggregate([
      { $match: { category: 'Ads', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAdSpend = adExpenses[0]?.total || 0;
    const roas = totalAdSpend > 0 ? Number((totalRevenue / totalAdSpend).toFixed(2)) : 0;

    // 13. New vs Returning (Sample simplified logic)
    const allUsersWithOrders = await Order.aggregate([
      { 
        $match: { 
          deletedAt: null,
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      { $group: { _id: '$user', count: { $sum: 1 } } }
    ]);
    const returningUsersCount = allUsersWithOrders.filter(u => u.count > 1).length;
    const newUsersCount = allUsersWithOrders.filter(u => u.count === 1).length;

    // 14. Chart Data & Simple Forecast
    const chartData = await Order.aggregate([
      {
        $match: {
          status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
          createdAt: { $gte: startDate, $lte: endDate },
          deletedAt: null
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          cogs: { 
            $sum: { 
              $sum: {
                $map: {
                  input: '$items',
                  as: 'item',
                  in: { $multiply: ['$$item.quantity', { $ifNull: ['$$item.purchasePrice', 0] }] }
                }
              }
            }
          },
          deliveryCharge: { $sum: '$deliveryCharge' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          revenue: 1,
          orders: 1,
          profit: { $subtract: [{ $subtract: ['$revenue', '$cogs'] }, '$deliveryCharge'] }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Simple Forecasting: Average Daily Revenue * 30
    const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const avgDailyRevenue = totalRevenue / daysInRange;
    const projectedMonthlyRevenue = avgDailyRevenue * 30;

    return NextResponse.json({
      stats: {
        totalRevenue,
        salesCount,
        totalUsers,
        pendingOrdersCount,
        activeSubscribers,
        totalWalletTokens,
        totalCOGS,
        totalExpenses,
        grossProfit,
        netProfit,
        roas,
        totalAdSpend,
        newUsersCount,
        returningUsersCount,
        projectedMonthlyRevenue
      },
      recentOrders,
      lowStockProducts,
      topSellingProducts,
      topCustomers,
      chartData
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
