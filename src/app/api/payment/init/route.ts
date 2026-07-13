import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import { initPayment } from '@/lib/sslcommerz';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    await connectToDatabase();
    const order = await Order.findOne({ _id: orderId });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Verify order ownership (Authorization)
    if (!order.user || order.user.toString() !== (session.user as any).id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const transactionId = order.transactionId || `TRANS-${orderId}-${Date.now()}`;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const { shippingAddress } = order;
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.phone) {
      return NextResponse.json({ message: 'Incomplete shipping or contact information' }, { status: 400 });
    }

    const customerEmail = session.user.email;
    if (!customerEmail) {
      return NextResponse.json({ message: 'User email is required for payment' }, { status: 400 });
    }

    const data = {
      total_amount: order.totalAmount,
      currency: 'BDT',
      tran_id: transactionId,
      success_url: `${baseUrl}/api/payment/success?id=${orderId}`,
      fail_url: `${baseUrl}/api/payment/fail?id=${orderId}`,
      cancel_url: `${baseUrl}/api/payment/cancel?id=${orderId}`,
      ipn_url: `${baseUrl}/api/payment/ipn`,
      shipping_method: 'Courier',
      product_name: 'Climax Apparels Order',
      product_category: 'E-commerce',
      product_profile: 'general',
      cus_name: shippingAddress.fullName,
      cus_email: customerEmail,
      cus_add1: shippingAddress.street,
      cus_city: shippingAddress.city,
      cus_state: shippingAddress.state || '',
      cus_postcode: shippingAddress.zipCode || '0000',
      cus_country: shippingAddress.country || 'Bangladesh',
      cus_phone: shippingAddress.phone,
      ship_name: shippingAddress.fullName,
      ship_add1: shippingAddress.street,
      ship_city: shippingAddress.city,
      ship_state: shippingAddress.state || '',
      ship_postcode: shippingAddress.zipCode || '0000',
      ship_country: shippingAddress.country || 'Bangladesh',
    };

    // Initialize SSLCommerz Payment
    const response = await initPayment(data);

    if (response?.GatewayPageURL) {
      // Update order with transactionId if not set
      if (!order.transactionId) {
        order.transactionId = transactionId;
        await order.save();
      }
      return NextResponse.json({ url: response.GatewayPageURL });
    } else {
      console.error('SSLCommerz Initialization Failed. Session User:', session.user.id, 'Order ID:', orderId, 'Status:', response?.status);
      return NextResponse.json({
        message: 'Failed to initialize payment gateway'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Payment Init Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
