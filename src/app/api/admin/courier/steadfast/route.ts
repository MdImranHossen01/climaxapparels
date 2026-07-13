import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import GlobalSettings from '@/models/GlobalSettings';
import { createSteadfastOrder } from '@/lib/steadfast';

/**
 * Admin API to send orders to Steadfast Courier
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Authorization Check
    if (!session || !session.user || !(['admin', 'super_admin'].includes((session.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ message: 'Valid Order IDs are required' }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch Global Settings for Courier Config
    const settingsDoc = await GlobalSettings.findOne();
    if (!settingsDoc) {
      return NextResponse.json({ message: 'Global settings not found.' }, { status: 404 });
    }
    const settings = settingsDoc.toObject({ getters: true });

        const apiKey = settings.courierConfig?.steadfast?.apiKey;
    const secretKey = settings.courierConfig?.steadfast?.secretKey;

    if (!apiKey || !secretKey) {
      return NextResponse.json({
        message: 'Steadfast API credentials are not configured in your settings.'
      }, { status: 400 });
    }

    const courierConfig = {
      apiKey,
      secretKey
    };

    const results = [];

    // Process each order
    for (const orderId of orderIds) {
      try {
        const order = await Order.findOne({ _id: orderId });

        if (!order) {
          results.push({ id: orderId, success: false, message: 'Order record not found' });
          continue;
        }

        if (order.shippingDetails?.consignmentId) {
          results.push({ id: orderId, success: false, message: 'This order has already been sent to Steadfast.' });
          continue;
        }

        const itemsNote = order.items.map((i: any) => {
          const variantDesc = [i.color, i.size].filter(Boolean).join('/');
          return `${i.name}${variantDesc ? `(${variantDesc})` : ''}`;
        }).join(', ');

        // Map order data to Steadfast payload
        const payload = {
          invoice: order.shortId || order._id.toString().slice(-8).toUpperCase(),
          recipient_name: order.shippingAddress.fullName,
          recipient_phone: order.shippingAddress.phone,
          recipient_address: `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}`,
          cod_amount: order.paymentStatus === 'Paid' ? 0 : order.totalAmount,
          note: `Order #${order.shortId || order._id.toString().slice(-8).toUpperCase()} - ${itemsNote.slice(0, 100)}${itemsNote.length > 100 ? '...' : ''}`
        };

        // Call Steadfast API
        const response = await createSteadfastOrder(payload, courierConfig);

        // Update Order document with courier info
        order.shippingDetails = {
          courierName: 'Steadfast',
          consignmentId: response.consignment_id?.toString(),
          trackingId: response.tracking_code?.toString(),
          trackingUrl: response.tracking_code ? `https://steadfast.com.bd/t/${response.tracking_code}` : undefined,
          courierStatus: response.status
        };

        // Progress status if it was just 'Confirmed' or 'Paid'
        if (order.status === 'Confirmed' || order.status === 'Paid' || order.status === 'Order Placed') {
          order.status = 'Ready for Delivery';
        }

        await order.save();

        results.push({
          id: orderId,
          success: true,
          consignment_id: response.consignment_id,
          tracking_code: response.tracking_code
        });
      } catch (err: any) {
        console.error(`Steadfast Processing Error for order ${orderId}:`, err.message);
        results.push({ id: orderId, success: false, message: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      message: `Processed ${results.length} orders. Success: ${successCount}, Failed: ${failCount}`,
      results
    });

  } catch (error: any) {
    console.error('CRITICAL: Steadfast Route Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
