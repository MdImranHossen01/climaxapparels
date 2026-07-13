import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Coupon from '@/models/Coupon';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = ['code', 'discountType', 'discountValue', 'minPurchase', 'expiryDate', 'usageLimit', 'isActive'];
    const updatePayload: any = {};
    
    allowedFields.forEach(field => {
        if (body[field] !== undefined) {
            updatePayload[field] = body[field];
        }
    });

    await connectToDatabase();
    
    const coupon = await Coupon.findOneAndUpdate(
      { _id: id },
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return NextResponse.json({ message: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    
    const coupon = await Coupon.findOneAndDelete({ _id: id });

    if (!coupon) {
      return NextResponse.json({ message: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
