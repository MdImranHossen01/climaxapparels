/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order, { IOrderItem } from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import GlobalSettings from '@/models/GlobalSettings';
import WalletTransaction from '@/models/WalletTransaction';
import Coupon from '@/models/Coupon';
import { auth } from '@/auth';

import { z } from 'zod';
import mongoose from 'mongoose';
import crypto from 'crypto';

import { CACHE_TAGS } from '@/lib/data-fetching';

class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StockError';
  }
}


const orderItemSchema = z.object({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  name: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  price: z.number().positive(), // We will re-validate this on the server
  image: z.string().nullish().or(z.literal('')),
  color: z.string().optional(),
  size: z.string().optional(),
});

const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shippingAddress: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    phone: z.string().min(10, 'Invalid phone number'),
    email: z.string().email('Invalid email address'),
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    division: z.string().min(1, 'Division is required'),
    zipCode: z.string().optional().default('0000'),
    country: z.string().optional().default('Bangladesh'),
  }),
  paymentMethod: z.preprocess((val) => {
    if (typeof val === 'string') {
      const normalized = val.trim().toLowerCase();
      if (normalized === 'cash on delivery' || normalized === 'cod') {
        return 'COD';
      }
    }
    return val;
  }, z.enum(['COD', 'Online', 'Manual'])),
  deliveryCharge: z.number().min(0).nullish(),
  useWallet: z.boolean().nullish().default(false),
  couponCode: z.string().nullish(),
  manualPaymentDetails: z.object({
    methodName: z.string().optional(),
    senderNumber: z.string().optional(),
    transactionId: z.string().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  let session: mongoose.ClientSession | null = null;
  const successfulDeductions: { productId: string, quantity: number, variantId?: string }[] = [];
  try {
    const sessionUser = await auth();
    const body = await req.json();

    // 1. Validate Input Schema
    const validation = orderSchema.safeParse(body);
    if (!validation.success) {
      console.error('Order Validation Error:', validation.error.flatten().fieldErrors);
      return NextResponse.json({
        message: 'Validation failed',
        errors: validation.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { items, shippingAddress, paymentMethod, useWallet, couponCode, manualPaymentDetails } = validation.data;
    const clientProvidedDeliveryCharge = validation.data.deliveryCharge;

    await connectToDatabase();

    // Check for pending/unconfirmed orders ('Order Placed')
    const queryConditions: any[] = [];
    if (sessionUser?.user?.id) {
      queryConditions.push({ user: sessionUser.user.id });
    }
    if (shippingAddress.phone) {
      queryConditions.push({ 'shippingAddress.phone': shippingAddress.phone });
    }

    if (queryConditions.length > 0) {
      const existingPendingOrder = await Order.findOne({
        $or: queryConditions,
        status: 'Order Placed',
        deletedAt: null
      });

      if (existingPendingOrder) {
        return NextResponse.json({
          message: 'You already have a pending order. Please wait for it to be confirmed before placing another order.'
        }, { status: 400 });
      }
    }

    const conn = await connectToDatabase();

    // Fetch Settings
    const settings = await GlobalSettings.findOne();
    const subConfig = {
      activationThreshold: settings?.subscriptionConfig?.activationThreshold ?? 5000,
      rewardPercentage: settings?.subscriptionConfig?.rewardPercentage ?? 5
    };

    session = await conn.startSession();
    if (!session) {
      throw new Error('Failed to start database session');
    }
    session.startTransaction();

    let user = null;
    if (sessionUser?.user?.id) {
      user = await User.findOne({ _id: sessionUser.user.id }).session(session);
    } else {
      // Guest Checkout: Find or Create User by Email
      user = await User.findOne({ email: shippingAddress.email.toLowerCase() }).session(session);

      if (user) {
        // If user exists but lacks phone or address, update it
        let needsUpdate = false;
        if (!user.phone && shippingAddress.phone) {
          user.phone = shippingAddress.phone;
          needsUpdate = true;
        }
        if ((!user.addresses || user.addresses.length === 0) && shippingAddress.street) {
          user.addresses = [{
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            division: shippingAddress.division,
            country: shippingAddress.country,
            isDefault: true
          }];
          needsUpdate = true;
        }
        if (needsUpdate) {
          await user.save({ session });
        }
      } else {
        // Create a new user for this guest
        const [newUser] = await User.create([{
          name: shippingAddress.fullName,
          email: shippingAddress.email.toLowerCase(),
          phone: shippingAddress.phone,
          role: 'user',
          addresses: [{
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            division: shippingAddress.division,
            country: shippingAddress.country,
            isDefault: true
          }]
        }], { session });
        user = newUser;
      }
    }

    let serverComputedTotal = 0;
    const validatedItems: IOrderItem[] = [];

    try {
      // 2a. Group items by product/variant to avoid duplicate checks failing during deduction
      const groupedItems: Record<string, any> = {};
      for (const item of items) {
        const key = `${item.product}-${String(item.color || '').trim()}-${String(item.size || '').trim()}`;
        if (groupedItems[key]) {
          groupedItems[key].quantity += item.quantity;
        } else {
          groupedItems[key] = { ...item };
        }
      }

      const uniqueItems = Object.values(groupedItems);

      // 2b. Pre-check loop (ensure all items exist and have combined stock before any deductions)
      for (const item of uniqueItems) {
        const product = await Product.findOne({ _id: item.product, isPublished: true }).session(session);
        if (!product) {
          throw new StockError(`Product not found: ${item.name}`);
        }

        if (item.color || item.size) {
          const variant = product.variants?.find((v: any) =>
            String(v.color || '').trim() === String(item.color || '').trim() &&
            String(v.size || '').trim() === String(item.size || '').trim()
          );
          if (!variant || (variant.stock || 0) < item.quantity) {
            const variantDesc = [item.color, item.size].filter(Boolean).join(' / ');
            throw new StockError(`Insufficient stock for ${product.name}${variantDesc ? ` (${variantDesc})` : ''}. Available: ${variant?.stock || 0}`);
          }
        } else {
          if ((product.stock || 0) < item.quantity) {
            throw new StockError(`Insufficient stock for ${product.name}. Available: ${product.stock || 0}`);
          }
        }
      }

      // 2c. Atomic Stock Deduction and Price Verification
      // We process the ORIGINAL items list for order record, but use uniqueItems for stock logic
      // Actually, it's safer to deduct from uniqueItems to ensure atomicity for the group
      for (const item of uniqueItems) {
        let product;
        const hasVariant = !!(item.color || item.size);

        if (hasVariant) {
          const variantQuery: any = {
            _id: item.product,
            isPublished: true,
            variants: {
              $elemMatch: {
                ...(item.color && { color: item.color }),
                ...(item.size && { size: item.size }),
                stock: { $gte: item.quantity }
              }
            }
          };

          product = await Product.findOneAndUpdate(
            variantQuery,
            { $inc: { "variants.$.stock": -item.quantity } },
            { session, new: true }
          );

          if (product) {
            const variant = product.variants?.find((v: any) =>
              String(v.color || '').trim() === String(item.color || '').trim() &&
              String(v.size || '').trim() === String(item.size || '').trim()
            );
            successfulDeductions.push({
              productId: product._id.toString(),
              quantity: item.quantity,
              variantId: (variant as any)?._id?.toString()
            });
          }
        } else {
          product = await Product.findOneAndUpdate(
            {
              _id: item.product,
              stock: { $gte: item.quantity },
              isPublished: true
            },
            { $inc: { stock: -item.quantity } },
            { session, new: true }
          );

          if (product) {
            successfulDeductions.push({
              productId: product._id.toString(),
              quantity: item.quantity
            });
          }
        }

        if (!product) {
          throw new StockError(`Stock deduction failed unexpectedly for ${item.name}. Please try again.`);
        }
      }

      // 2d. Price Verification and Validated Items List (using ORIGINAL items for order structure)
      for (const item of items) {
        const product = await Product.findOne({ _id: item.product }).session(session);
        if (!product) throw new Error('Product not found during price verification');

        const hasVariant = !!(item.color || item.size);
        let itemPrice = product.salePrice ?? product.price;
        let itemPurchasePrice = product.purchasePrice ?? 0;

        if (hasVariant) {
          const variant = product.variants?.find((v: any) =>
            String(v.color || '').trim() === String(item.color || '').trim() &&
            String(v.size || '').trim() === String(item.size || '').trim()
          );
          if (variant) {
            itemPrice = (variant.salePrice ?? variant.price) ?? (product.salePrice ?? product.price);
            itemPurchasePrice = variant.purchasePrice ?? product.purchasePrice ?? 0;
          }
        }

        serverComputedTotal += itemPrice * item.quantity;

        validatedItems.push({
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          price: itemPrice,
          purchasePrice: itemPurchasePrice,
          image: item.image || product.images?.[0] || '',
          color: item.color,
          size: item.size,
        });
      }
    } catch (err: any) {
      throw err;
    }

    // 3. Calculate Delivery Charge
    const city = shippingAddress.city.toLowerCase();
    const state = shippingAddress.state.toLowerCase();
    const division = shippingAddress.division.toLowerCase();

    const isDhaka =
      (city.includes('dhaka') || state.includes('dhaka') || division.includes('dhaka')) &&
      !city.includes('outside'); // Explicitly exclude "Outside Dhaka"

    const freeDeliveryThreshold = settings?.freeDeliveryThreshold || 0;
    const isFreeDelivery = freeDeliveryThreshold > 0 && serverComputedTotal >= freeDeliveryThreshold;

    const chargeInsideDhaka = settings?.deliveryChargeInsideDhaka ?? 60;
    const chargeOutsideDhaka = settings?.deliveryChargeOutsideDhaka ?? 120;

    const serverComputedDeliveryCharge = isFreeDelivery ? 0 : (isDhaka ? chargeInsideDhaka : chargeOutsideDhaka);

    // 4. Verify Delivery Charge (if provided by client)
    if (clientProvidedDeliveryCharge !== undefined && clientProvidedDeliveryCharge !== null && clientProvidedDeliveryCharge !== serverComputedDeliveryCharge) {
      console.warn('Delivery Charge Mismatch:', {
        client: clientProvidedDeliveryCharge,
        server: serverComputedDeliveryCharge,
        city: shippingAddress.city,
        state: shippingAddress.state
      });
      if (session) await session.abortTransaction();
      return NextResponse.json({
        message: 'Delivery charge mismatch. Please refresh your cart.',
        serverCharge: serverComputedDeliveryCharge
      }, { status: 400 });
    }

    // 5. Discount & Loyalty Logic
    let couponDiscountAmount = 0;
    let walletAmountUsed = 0;
    let earnedRewardAmount = 0;
    let walletTxId: string | null = null;

    const baseTotal = serverComputedTotal + serverComputedDeliveryCharge;

    // --- A. Coupon Logic ---
    if (couponCode) {
      const coupon = await Coupon.findOneAndUpdate(
        {
          code: couponCode.toUpperCase(),
          isActive: true,
          expiryDate: { $gt: new Date() },
          minPurchase: { $lte: baseTotal },
          $or: [
            { usageLimit: { $exists: false } },
            { usageLimit: { $gt: 0 }, $expr: { $lt: ["$usedCount", "$usageLimit"] } }
          ]
        },
        { $inc: { usedCount: 1 } },
        { session, returnDocument: 'after' }
      );

      if (!coupon) {
        console.warn('Invalid or Expired Coupon:', { couponCode, baseTotal });
        if (session) await session.abortTransaction();
        return NextResponse.json({
          message: 'Invalid, expired, or minimum purchase not met for this coupon code.'
        }, { status: 400 });
      }

      if (coupon.discountType === 'fixed') {
        couponDiscountAmount = coupon.discountValue;
      } else {
        couponDiscountAmount = Math.floor(serverComputedTotal * (coupon.discountValue / 100));
      }
      // Ensure discount doesn't exceed total
      couponDiscountAmount = Math.min(couponDiscountAmount, serverComputedTotal);
    }

    const totalAfterCoupon = baseTotal - couponDiscountAmount;

    // --- B. Wallet & Loyalty Logic ---
    if (user) {
      // Wallet Deduction (Apply on amount after coupon)
      if (useWallet && user.walletBalance > 0) {
        walletAmountUsed = Math.min(user.walletBalance, totalAfterCoupon);
        user.walletBalance -= walletAmountUsed;
        await user.save({ session });

        // Log Wallet Transaction (Spent)
        const [walletTx] = await WalletTransaction.create([{
          userId: user._id,
          amount: walletAmountUsed,
          type: 'spent',
          status: 'completed',
          description: `Used tokens for order payment`,
        }], { session });

        walletTxId = walletTx._id.toString();
      }

      // Calculate potential rewards (only if already active or this order hits threshold)
      const isAlreadyActive = user.isSubscriptionActive;
      const willBeActive = isAlreadyActive || (totalAfterCoupon >= subConfig.activationThreshold);

      if (willBeActive) {
        // If not already active, activate it now (atomic update)
        if (!isAlreadyActive) {
          user.isSubscriptionActive = true;
          await user.save({ session });
        }

        // Calculate reward on the remaining amount paid
        const payableAmount = totalAfterCoupon - walletAmountUsed;
        earnedRewardAmount = Math.floor(payableAmount * (subConfig.rewardPercentage / 100));
      }
    }

    // 6. Create the order
    const [newOrder] = (await Order.create(
      [
        {
          user: user?._id,
          items: validatedItems,
          deliveryCharge: serverComputedDeliveryCharge,
          totalAmount: baseTotal,
          walletAmountUsed,
          couponCode: couponDiscountAmount > 0 ? couponCode?.toUpperCase() : undefined,
          couponDiscountAmount,
          earnedRewardAmount,
          shippingAddress,
          paymentMethod,
          paymentStatus: 'Pending',
          status: 'Order Placed',
          transactionId: paymentMethod === 'Online' ? `ORDER-${crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 16)}` : undefined,
          shortId: crypto.randomBytes(4).toString('hex').toUpperCase(),
          manualPaymentDetails,
        },
      ],
      { session }
    )) as any;

    // Link transaction to order ID if we had one
    if (walletTxId) {
      await WalletTransaction.findOneAndUpdate(
        { _id: walletTxId },
        { orderId: newOrder._id },
        { session }
      );
    }

    await session.commitTransaction();

    // Delete matching abandoned cart on successful purchase
    try {
      const cleanPhone = shippingAddress.phone.replace(/\s+/g, '').trim();
      const AbandonedCart = (await import('@/models/AbandonedCart')).default;
      await AbandonedCart.findOneAndDelete({ phone: cleanPhone });
    } catch (e) {
      console.error('Failed to delete matching abandoned cart:', e);
    }

    // Revalidate products cache to reflect new stock levels across the site
    try {
      const { revalidateTag } = await import('next/cache');
      revalidateTag(CACHE_TAGS.products, 'max');
    } catch (e) {
      console.error('Failed to revalidate products cache:', e);
    }

    return NextResponse.json(newOrder, { status: 201 });

  } catch (error: any) {
    if (session) {
      await session.abortTransaction();
    }

    // Manual Rollback Fallback (Crucial for non-replica set MongoDB)
    if (successfulDeductions.length > 0) {
      console.log('Attempting manual stock restoration for failed order...');
      for (const ded of successfulDeductions) {
        try {
          if (ded.variantId) {
            await Product.updateOne(
              { _id: ded.productId, "variants._id": ded.variantId },
              { $inc: { "variants.$.stock": ded.quantity } }
            );
          } else {
            await Product.updateOne(
              { _id: ded.productId },
              { $inc: { stock: ded.quantity } }
            );
          }
        } catch (rollbackErr) {
          console.error('Critical: Manual rollback failed for product:', ded.productId, rollbackErr);
        }
      }
    }

    console.error('Error creating order (Combo Discount):', error);
    const isClientError = error instanceof StockError;
    return NextResponse.json({
      message: isClientError ? error.message : 'Internal Server Error'
    }, { status: isClientError ? 400 : 500 });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

// GET orders
// If current user is Admin and ?all=true, returns ALL orders
// Otherwise returns only orders for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fetchAll = searchParams.get('all') === 'true';
    const isAdmin = ['admin', 'super_admin'].includes((session.user as any)?.role);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20'));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const fromDate = searchParams.get('from') || '';
    const toDate = searchParams.get('to') || '';

    await connectToDatabase();

    let query: any = { deletedAt: null };
    if (fetchAll && isAdmin) {
      if (status && status !== 'All') {
        query.status = status;
      }
      if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = new Date(fromDate);
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }
      if (search) {
        const userIds = await User.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        
        const searchConditions: any[] = [
          { "shippingAddress.fullName": { $regex: search, $options: 'i' } },
          { "shippingAddress.phone": { $regex: search, $options: 'i' } }
        ];

        if (mongoose.Types.ObjectId.isValid(search)) {
          searchConditions.push({ _id: search });
        } else if (search.length >= 8) {
          searchConditions.push({ shortId: { $regex: search, $options: 'i' } });
        }

        if (userIds.length > 0) {
          searchConditions.push({ user: { $in: userIds.map(u => u._id) } });
        }

        query.$and = query.$and || [];
        query.$and.push({ $or: searchConditions });
      }
    } else {
      const userId = (session.user as any).id;
      if (!userId) {
        return NextResponse.json({ message: 'User ID missing from session' }, { status: 400 });
      }
      query = { user: userId, deletedAt: null };
    }

    const totalCount = await Order.countDocuments(query);
    
    // Get counts for each status to display in tabs
    let counts = {
      all: 0,
      placed: 0,
      confirmed: 0,
      paid: 0,
      ready: 0,
      released: 0,
      delivered: 0,
      cancelled: 0
    };

    if (fetchAll && isAdmin) {
      const countQuery = { ...query };
      delete countQuery.status; // Remove status filter to count all

      const statusCounts = await Order.aggregate([
        { $match: countQuery },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      const totalAll = await Order.countDocuments(countQuery);
      counts.all = totalAll;

      statusCounts.forEach((sc: any) => {
        if (sc._id === 'Order Placed') counts.placed = sc.count;
        else if (sc._id === 'Confirmed') counts.confirmed = sc.count;
        else if (sc._id === 'Paid') counts.paid = sc.count;
        else if (sc._id === 'Ready for Delivery') counts.ready = sc.count;
        else if (sc._id === 'Released for Delivery') counts.released = sc.count;
        else if (sc._id === 'Delivered') counts.delivered = sc.count;
        else if (sc._id === 'Cancelled') counts.cancelled = sc.count;
      });
    }
    
    let ordersQuery = Order.find(query).sort({ createdAt: -1 });

    if (fetchAll && isAdmin) {
      ordersQuery = ordersQuery.skip((page - 1) * limit).limit(limit);
    }

    const orders = await ordersQuery.populate('user', 'name email');

    let processedOrders = orders;
    if (fetchAll && isAdmin) {
      processedOrders = await Promise.all(orders.map(async (order: any) => {
        const phone = order.shippingAddress?.phone;
        if (!phone) return { ...order.toObject(), isRepeat: false, isDuplicate: false };

        const otherOrders = await Order.find({
          "shippingAddress.phone": phone,
          _id: { $ne: order._id },
          deletedAt: null
        }).select('items');

        if (otherOrders.length === 0) {
          return { ...order.toObject(), isRepeat: false, isDuplicate: false };
        }

        const isDuplicate = otherOrders.some(other => {
          if (other.items.length !== order.items.length) return false;
          return order.items.every((item: any) => {
            return other.items.some((otherItem: any) => {
              return String(otherItem.product) === String(item.product) &&
                     String(otherItem.color || '') === String(item.color || '') &&
                     String(otherItem.size || '') === String(item.size || '') &&
                     otherItem.quantity === item.quantity;
            });
          });
        });

        return {
          ...order.toObject(),
          isRepeat: true,
          isDuplicate
        };
      })) as any[];
    }

    if (fetchAll && isAdmin) {
      return NextResponse.json({
        orders: processedOrders,
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
        counts
      });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

