import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const sessionUser = await auth();

    await connectToDatabase();

    const queryConditions: any[] = [];
    if (sessionUser?.user?.id) {
      queryConditions.push({ user: sessionUser.user.id });
    }
    if (phone && phone.trim().length >= 11) {
      queryConditions.push({ 'shippingAddress.phone': phone.trim() });
    }

    if (queryConditions.length === 0) {
      return NextResponse.json({ hasPending: false });
    }

    const existingPendingOrder = await Order.findOne({
      $or: queryConditions,
      status: 'Order Placed',
      deletedAt: null
    });

    return NextResponse.json({ hasPending: !!existingPendingOrder });
  } catch (error) {
    return NextResponse.json({ hasPending: false }, { status: 500 });
  }
}
