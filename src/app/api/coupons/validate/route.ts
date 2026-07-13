import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Coupon from '@/models/Coupon';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { code, totalAmount } = await req.json();

    const validatedTotal = Number(totalAmount);
    if (!code) {
      return NextResponse.json({ message: 'Coupon code is required' }, { status: 400 });
    }

    if (!totalAmount || isNaN(validatedTotal) || !Number.isFinite(validatedTotal) || validatedTotal < 0) {
      return NextResponse.json({ message: 'A valid total amount is required' }, { status: 400 });
    }

    await connectToDatabase();

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(), 
      isActive: true,
      expiryDate: { $gt: new Date() }
    });

    if (!coupon) {
      return NextResponse.json({ message: 'Invalid or expired coupon code' }, { status: 404 });
    }

    if (validatedTotal < coupon.minPurchase) {
      return NextResponse.json({ 
        message: `Minimum purchase of ৳${coupon.minPurchase} required for this coupon` 
      }, { status: 400 });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ message: 'Coupon usage limit reached' }, { status: 400 });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    } else {
      discountAmount = Math.floor(totalAmount * (coupon.discountValue / 100));
    }

    // Ensure discount doesn't exceed total
    discountAmount = Math.min(discountAmount, totalAmount);

    return NextResponse.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

