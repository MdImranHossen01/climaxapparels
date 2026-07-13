import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';

export const dynamic = 'force-dynamic';

/**
 * Public Order Tracking API
 * Supports full ObjectId OR last 8 characters of the _id
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    let { slug } = await params;
    if (!slug) {
        return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    // Clean up slug: trim and strip leading '#'
    slug = slug.trim().replace(/^#/, '');

    await connectToDatabase();
    
    let query: any = { deletedAt: null };

    // 1. Check if it's a full ObjectId
    if (mongoose.isObjectIdOrHexString(slug)) {
        query._id = slug;
    } 
    // 2. Check if it's a short ID (8 hex chars) - Supports both random shortId and last 8 chars of ObjectId
    else if (/^[0-9a-fA-F]{8}$/.test(slug)) {
        query = {
            deletedAt: null,
            $or: [
                { shortId: slug.toUpperCase() },
                {
                    $expr: {
                        $eq: [
                            { $substrCP: [{ $toString: "$_id" }, 16, 8] },
                            slug.toLowerCase()
                        ]
                    }
                }
            ]
        };
    } else {
        return NextResponse.json({ message: 'Invalid Order ID format' }, { status: 400 });
    }

    const order = await Order.findOne(query)
      .select('status items totalAmount shippingAddress shippingDetails createdAt')
      .lean();

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Security: Mask sensitive information for public tracking
    const maskedOrder = {
        _id: order._id,
        status: order.status,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        items: (Array.isArray(order.items) ? order.items : []).map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            image: item.image,
            price: item.price
        })),
        shippingDetails: {
            // Mask full name: Show only first name or masked version
            name: order.shippingAddress?.fullName 
                ? order.shippingAddress.fullName.split(' ')[0] + ' ***' 
                : 'N/A',
            // Mask phone: 017****1234
            phone: (order.shippingAddress?.phone && /^(\d{3})\d+(\d{4})$/.test(order.shippingAddress.phone)) ? 
                order.shippingAddress.phone.replace(/(\d{3})\d+(\d{4})/, '$1****$2') : 
                'N/A',
            address: order.shippingAddress 
                ? `${order.shippingAddress.city || 'N/A'}, ${order.shippingAddress.state || 'N/A'}`
                : 'N/A',
            courierName: order.shippingDetails?.courierName,
            trackingUrl: order.shippingDetails?.trackingUrl,
            courierStatus: order.shippingDetails?.courierStatus,
        }
    };

    return NextResponse.json(maskedOrder);
  } catch (error) {
    console.error('Public Tracking Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
