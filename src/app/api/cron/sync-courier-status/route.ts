import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import GlobalSettings from '@/models/GlobalSettings';
import { getSteadfastStatus } from '@/lib/steadfast';
import { getPathaoStatus, PathaoProvider } from '@/lib/pathao';
import { getRedXStatus, RedXProvider } from '@/lib/redx';
import { auth } from '@/auth';

/**
 * Cron Job & Manual API: Sync Courier Delivery Status (Steadfast, Pathao & RedX)
 * 
 * Checks Steadfast, Pathao and RedX for delivery updates on all active courier shipments.
 * If courier shows "Delivered" or "Partial Delivered":
 *   1. Order status is updated to "Delivered"
 *   2. If unpaid (COD), paymentStatus is updated to "Paid"
 * 
 * Can be triggered via:
 *   - External Cron with Bearer CRON_SECRET or ?key=CRON_SECRET
 *   - Admin Panel with authenticated session
 */
async function handleSyncCourierStatus(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronKey = req.nextUrl.searchParams.get('key');
  const cronSecret = process.env.CRON_SECRET;

  const isCronAuthorized =
    Boolean(cronSecret) &&
    (authHeader === `Bearer ${cronSecret}` || cronKey === cronSecret);

  let isAdminAuthorized = false;
  if (!isCronAuthorized) {
    try {
      const session = await auth();
      const role = (session?.user as any)?.role;
      const email = session?.user?.email?.toLowerCase();
      isAdminAuthorized =
        role === 'admin' ||
        role === 'super_admin' ||
        role === 'manager' ||
        role === 'moderator' ||
        email === 'imranshuvo101@gmail.com';
    } catch {
      isAdminAuthorized = false;
    }
  }

  if (!isCronAuthorized && !isAdminAuthorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const settingsDoc = await GlobalSettings.findOne();
    if (!settingsDoc) {
      return NextResponse.json({ message: 'Global settings not found' }, { status: 404 });
    }

    // 1. Steadfast credentials
    const steadfastApiKey = settingsDoc.courierConfig?.steadfast?.apiKey;
    const steadfastSecretKey = settingsDoc.courierConfig?.steadfast?.secretKey;
    const isSteadfastConfigured = Boolean(steadfastApiKey && steadfastSecretKey);
    const steadfastConfig = isSteadfastConfigured
      ? { apiKey: steadfastApiKey!, secretKey: steadfastSecretKey! }
      : null;

    // 2. Pathao credentials
    const pathaoConfigData = settingsDoc.courierConfig?.pathao;
    const isPathaoConfigured = Boolean(pathaoConfigData?.clientId && pathaoConfigData?.clientSecret);
    const pathaoProvider = isPathaoConfigured
      ? new PathaoProvider({
          clientId: pathaoConfigData!.clientId!,
          clientSecret: pathaoConfigData!.clientSecret!,
          storeId: pathaoConfigData?.storeId,
          username: pathaoConfigData?.username,
          password: pathaoConfigData?.password,
          isSandbox: pathaoConfigData?.isSandbox,
        })
      : null;

    // 3. RedX credentials
    const redxApiKey = settingsDoc.courierConfig?.redx?.apiKey;
    const isRedxConfigured = Boolean(redxApiKey);
    const redxConfig = isRedxConfigured
      ? { apiKey: redxApiKey!, isSandbox: settingsDoc.courierConfig?.redx?.isSandbox }
      : null;

    if (!isSteadfastConfigured && !isPathaoConfigured && !isRedxConfigured) {
      return NextResponse.json(
        { message: 'No courier credentials (Steadfast, Pathao or RedX) are configured in Settings.' },
        { status: 400 }
      );
    }

    // Find all active orders shipped with a courier that are not yet Delivered or Cancelled
    const pendingOrders = await Order.find({
      'shippingDetails.consignmentId': { $exists: true, $ne: null },
      status: { $nin: ['Delivered', 'Cancelled'] },
      deletedAt: null,
    }).select('_id shortId status shippingDetails paymentStatus internalNote');

    if (pendingOrders.length === 0) {
      return NextResponse.json({
        message: 'No active courier shipments to sync',
        updated: 0,
        pendingCount: 0,
      });
    }

    let deliveredCount = 0;
    let cancelledCount = 0;
    let errorCount = 0;
    let steadfastCount = 0;
    let pathaoCount = 0;
    let redxCount = 0;
    const results: any[] = [];

    for (const order of pendingOrders) {
      try {
        const consignmentId = order.shippingDetails?.consignmentId;
        const courierName = (order.shippingDetails?.courierName || '').toLowerCase();

        if (!consignmentId) continue;

        let courierStatus = '';
        let isDelivered = false;
        let isCancelled = false;

        // ── 1. STEADFAST SYNC ──
        if (courierName.includes('steadfast')) {
          if (!steadfastConfig) {
            results.push({
              orderId: order._id,
              shortId: order.shortId,
              courier: 'Steadfast',
              action: 'skipped',
              reason: 'Steadfast not configured',
            });
            continue;
          }

          steadfastCount++;
          const statusData = await getSteadfastStatus(consignmentId, steadfastConfig);
          if (statusData?.status === 401 || String(statusData?.message || '').toLowerCase().includes('unauthorized')) {
            results.push({
              orderId: order._id,
              shortId: order.shortId,
              courier: 'Steadfast',
              action: 'error',
              error: 'Steadfast API key/secret is unauthorized or expired. Please check Admin Settings > Courier.',
            });
            errorCount++;
            continue;
          }
          courierStatus = statusData?.delivery_status || statusData?.status || '';
          const normalized = String(courierStatus).toLowerCase().trim();

          if (normalized === 'delivered' || normalized === 'partial_delivered' || normalized === 'partial delivered') {
            isDelivered = true;
          } else if (normalized.includes('cancel') || normalized.includes('return') || normalized.includes('failed')) {
            isCancelled = true;
          }

        // ── 2. PATHAO SYNC ──
        } else if (courierName.includes('pathao')) {
          if (!pathaoProvider) {
            results.push({
              orderId: order._id,
              shortId: order.shortId,
              courier: 'Pathao',
              action: 'skipped',
              reason: 'Pathao not configured',
            });
            continue;
          }

          pathaoCount++;
          const statusData = await pathaoProvider.getOrderStatus(consignmentId);
          courierStatus =
            statusData?.order_status ||
            statusData?.order_status_slug ||
            statusData?.status ||
            '';
          const normalized = String(courierStatus).toLowerCase().replace(/_/g, ' ').trim();

          if (normalized === 'delivered' || normalized === 'partial delivered') {
            isDelivered = true;
          } else if (
            normalized.includes('cancel') ||
            normalized.includes('return') ||
            normalized.includes('failed')
          ) {
            isCancelled = true;
          }

        // ── 3. REDX SYNC ──
        } else if (courierName.includes('redx')) {
          if (!redxConfig) {
            results.push({
              orderId: order._id,
              shortId: order.shortId,
              courier: 'RedX',
              action: 'skipped',
              reason: 'RedX not configured',
            });
            continue;
          }

          redxCount++;
          const statusData = await getRedXStatus(consignmentId, redxConfig);
          const trackingList = statusData?.tracking || [];
          const latestMsg = trackingList.length > 0 ? trackingList[trackingList.length - 1]?.message_en : '';
          courierStatus = statusData?.status || statusData?.parcel?.status || latestMsg || '';
          const normalized = (courierStatus || '').toLowerCase();

          if (normalized.includes('delivered') || normalized === 'paid') {
            isDelivered = true;
          } else if (normalized.includes('cancel') || normalized.includes('return') || normalized.includes('failed')) {
            isCancelled = true;
          }

        } else {
          // Unknown or unsupported courier
          continue;
        }

        const updateFields: any = {
          'shippingDetails.courierStatus': courierStatus,
        };

        if (isDelivered) {
          updateFields.status = 'Delivered';
          if (order.paymentStatus !== 'Paid') {
            updateFields.paymentStatus = 'Paid';
          }
          deliveredCount++;
          results.push({
            orderId: order._id,
            shortId: order.shortId,
            courier: order.shippingDetails?.courierName,
            action: 'marked_delivered',
            courierStatus,
          });
        } else if (isCancelled) {
          updateFields.status = 'Cancelled';
          const courierNameLabel = order.shippingDetails?.courierName || 'Courier';
          const cancelMsg = `[Courier Auto-Cancel] Delivery not completed by ${courierNameLabel}. Courier Status: "${courierStatus}". Auto-marked as Cancelled.`;
          updateFields.internalNote = order.internalNote ? `${order.internalNote} | ${cancelMsg}` : cancelMsg;

          cancelledCount++;
          results.push({
            orderId: order._id,
            shortId: order.shortId,
            courier: order.shippingDetails?.courierName,
            action: 'courier_cancelled',
            courierStatus,
            message: cancelMsg,
          });
        } else {
          results.push({
            orderId: order._id,
            shortId: order.shortId,
            courier: order.shippingDetails?.courierName,
            action: 'no_change',
            courierStatus,
          });
        }

        await Order.updateOne({ _id: order._id }, { $set: updateFields });

      } catch (err: any) {
        errorCount++;
        results.push({
          orderId: order._id,
          shortId: order.shortId,
          courier: order.shippingDetails?.courierName,
          action: 'error',
          error: err.message,
        });
        console.error(`Courier sync error for order ${order._id}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${pendingOrders.length} shipments (Steadfast: ${steadfastCount}, Pathao: ${pathaoCount}, RedX: ${redxCount}). Delivered: ${deliveredCount}, Cancelled/Returned: ${cancelledCount}, Errors: ${errorCount}`,
      totalChecked: pendingOrders.length,
      steadfastCount,
      pathaoCount,
      redxCount,
      deliveredCount,
      cancelledCount,
      errorCount,
      results,
    });
  } catch (error: any) {
    console.error('CRITICAL: Courier sync cron error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleSyncCourierStatus(req);
}

export async function POST(req: NextRequest) {
  return handleSyncCourierStatus(req);
}

