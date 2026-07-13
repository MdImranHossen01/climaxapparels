import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import Review from '@/models/Review';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!session || !session.user || !productId) {
      return NextResponse.json({ eligible: false });
    }

    const userId = (session.user as any).id;
    await connectToDatabase();

    // Check if user has a delivered order for this product
    const deliveredOrder = await Order.findOne({
      user: userId,
      'items.product': productId,
      status: { $in: ['Delivered', 'Paid'] },
      deletedAt: null
    });

    // Check if user already reviewed
    const existingReview = await Review.findOne({ user: userId, product: productId });

    return NextResponse.json({ 
      eligible: !!deliveredOrder && !existingReview,
      alreadyReviewed: !!existingReview,
      hasEligibleOrder: !!deliveredOrder
    });
  } catch (error) {
    console.error('Check Review Eligibility Error:', error);
    return NextResponse.json({ eligible: false });
  }
}
