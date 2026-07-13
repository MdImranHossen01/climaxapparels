import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Order from '@/models/Order';
import GlobalSettings from '@/models/GlobalSettings';
import { SteadfastProvider } from '@/lib/shipping/providers/steadfast';
import { PathaoProvider } from '@/lib/shipping/providers/pathao';
import { RedXProvider } from '@/lib/shipping/providers/redx';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';

export async function POST(
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

    // Connect to DB and fetch order and settings
    await connectToDatabase();
    
    const order = await Order.findOne({ _id: id }).populate('user');
    const settings = await GlobalSettings.findOne(); // Fetch the singleton settings

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Guard against double booking
    if (order.shippingDetails?.trackingId || order.shippingDetails?.consignmentId) {
      return NextResponse.json({ message: 'Courier already booked for this order' }, { status: 409 });
    }

    if (!settings || !settings.courierConfig || settings.courierConfig.activeProvider === 'none') {
      return NextResponse.json({ message: 'Courier service not configured' }, { status: 400 });
    }

    const { activeProvider, steadfast, pathao, redx } = settings.courierConfig;
    let provider = null;
    let courierName = '';

    const addr = order.shippingAddress || {};
    
    // Validate required courier fields
    if (!addr.phone || addr.phone.trim() === "") {
      return NextResponse.json({ message: 'Recipient phone number is required for courier booking' }, { status: 400 });
    }

    const addressParts = [addr.street, addr.city, addr.zipCode].filter(Boolean);
    if (addressParts.length === 0) {
      return NextResponse.json({ message: 'At least one address part (street, city, or zip) is required' }, { status: 400 });
    }

    const shippingData = {
      invoice: order.shortId || order._id.toString().slice(-8).toUpperCase(),
      recipient_name: addr.fullName || "Customer",
      recipient_phone: addr.phone ? addr.phone.replace(/\D/g, '').slice(-11) : "",
      recipient_address: addressParts.join(', '),
      cod_amount: order.paymentStatus === 'Paid' ? 0 : (order.totalAmount || 0),
      note: body.note || `Payment: ${order.paymentMethod || "N/A"}`,
      // Extra fields for Pathao/RedX
      store_id: body.store_id || pathao?.storeId,
      city_id: body.city_id,
      zone_id: body.zone_id,
      area_id: body.area_id,
    };

    const sApiKey = steadfast?.apiKey;
    const sSecretKey = steadfast?.secretKey;

    console.log('[Courier Booking] Using Provider:', activeProvider);
    console.log('[Courier Booking] API Key exists:', !!sApiKey);

    if (activeProvider === 'steadfast' && sApiKey && sSecretKey) {
      provider = new SteadfastProvider(sApiKey, sSecretKey);
      courierName = 'Steadfast';
    } else if (activeProvider === 'pathao' && pathao?.clientId && pathao?.clientSecret) {
      provider = new PathaoProvider(pathao.clientId, pathao.clientSecret, pathao.storeId || '');
      courierName = 'Pathao';
    } else if (activeProvider === 'redx' && redx?.apiKey) {
      provider = new RedXProvider(redx.apiKey);
      courierName = 'RedX';
    }

    if (provider) {
      console.log('[Courier Booking] Sending Data to', courierName, shippingData);
      const result = await provider.createOrder(shippingData);
      console.log('[Courier Booking] Provider Response:', result);

      if (result.success) {
        order.shippingDetails = {
          courierName,
          trackingId: result.tracking_code,
          consignmentId: result.consignment_id,
          trackingUrl: result.tracking_url,
          courierStatus: result.status,
        };
        
        order.status = 'Ready for Delivery';
        await order.save();

        return NextResponse.json({ 
          message: `${courierName} booked successfully`, 
          trackingCode: result.tracking_code 
        });
      } else {
        console.error('[Courier Booking] Booking Failed:', result.message);
        // Change to 400 so the UI can show the actual error message
        return NextResponse.json({ 
            message: result.message || 'Courier booking failed',
            details: result
        }, { status: 400 });
      }
    }

    console.error('[Courier Booking] No provider initialized. Active:', activeProvider);
    return NextResponse.json({ message: 'Courier provider not properly configured or keys missing' }, { status: 400 });

  } catch (error: any) {
    console.error('Courier Booking Exception:', error);
    return NextResponse.json({ 
      message: 'Internal server error during courier booking',
      debug: error.message 
    }, { status: 500 });
  }
}
