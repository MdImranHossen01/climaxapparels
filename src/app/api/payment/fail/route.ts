import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import GlobalSettings from '@/models/GlobalSettings';

// FAIL ROUTE
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-signature');
    await connectToDatabase();
    const settings = await GlobalSettings.findOne().sort({ updatedAt: -1 }).lean() as any;
    const secret = settings?.paymentConfig?.sslcommerz?.storePassword;
    const rawBody = await req.text();

    if (!signature || !secret) {
      console.error('Payment fail route: Missing signature or secret');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (signature !== hmac) {
      console.error('Payment fail route: Signature mismatch');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const orderId = searchParams.get('id');
    
    if (orderId) {
      await connectToDatabase();
      const order = await Order.findOne({ _id: orderId });
      if (order) {
        console.info(`Marking order ${orderId} as Failed. Previous status: ${order.paymentStatus}, User: ${order.user}`);
        try {
          order.paymentStatus = 'Failed';
          await order.save();
        } catch (dbError: any) {
          console.error(`Error saving order ${orderId} status:`, dbError.message);
        }
      }
    }

    const origin = req.nextUrl.origin;
    const redirectUrl = orderId 
      ? `${origin}/checkout?order=failed&id=${orderId}`
      : `${origin}/checkout?order=failed`;
      
    return NextResponse.redirect(redirectUrl, 303);
  } catch (error: any) {
    console.error('payment fail route error:', error.message, error.stack);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
