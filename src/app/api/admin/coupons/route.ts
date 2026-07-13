import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Coupon from '@/models/Coupon';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code, discountType, discountValue, minPurchase, expiryDate, usageLimit, isActive } = body;

    // 1. Presence validation
    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // 2. Business Rule Validation
    if (!['fixed', 'percentage'].includes(discountType)) {
        return NextResponse.json({ message: 'Invalid discount type. Must be "fixed" or "percentage"' }, { status: 400 });
    }

    if (discountValue <= 0) {
        return NextResponse.json({ message: 'Discount value must be greater than 0' }, { status: 400 });
    }

    if (discountType === 'percentage' && discountValue > 100) {
        return NextResponse.json({ message: 'Percentage discount cannot exceed 100%' }, { status: 400 });
    }

    const parsedExpiryDate = new Date(expiryDate);
    if (isNaN(parsedExpiryDate.getTime())) {
        return NextResponse.json({ message: 'Invalid expiry date format' }, { status: 400 });
    }

    if (parsedExpiryDate <= new Date()) {
        return NextResponse.json({ message: 'Expiry date must be in the future' }, { status: 400 });
    }

    await connectToDatabase();

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minPurchase,
      expiryDate: parsedExpiryDate,
      usageLimit,
      isActive: isActive !== undefined ? isActive : true
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    
    // Handle MongoDB Duplicate Key (E11000)
    if (error.code === 11000) {
        return NextResponse.json({ message: 'Coupon code already exists' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
