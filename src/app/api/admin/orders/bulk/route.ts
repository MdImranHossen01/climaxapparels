import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import { auth } from '@/auth';

const ALLOWED_ORDER_STATUSES = ['Order Placed', 'Confirmed', 'Paid', 'Ready for Delivery', 'Released for Delivery', 'Cancelled', 'Delivered'];
const ALLOWED_PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed'];
const MAX_BULK_IDS = 100;

function validateIds(ids: any) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return 'No order IDs provided';
  }
  if (ids.length > MAX_BULK_IDS) {
    return `Cannot process more than ${MAX_BULK_IDS} orders at once`;
  }
  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return `Invalid order ID format: ${id}`;
    }
  }
  return null;
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin', 'manager'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { ids, status, paymentStatus } = await req.json();

    const idError = validateIds(ids);
    if (idError) {
      return NextResponse.json({ message: idError }, { status: 400 });
    }

    const updateData: any = {};
    
    if (status) {
      if (!ALLOWED_ORDER_STATUSES.includes(status)) {
        return NextResponse.json({ 
          message: `Invalid status. Allowed values: ${ALLOWED_ORDER_STATUSES.join(', ')}` 
        }, { status: 400 });
      }
      updateData.status = status;
    }

    if (paymentStatus) {
      if (!ALLOWED_PAYMENT_STATUSES.includes(paymentStatus)) {
        return NextResponse.json({ 
          message: `Invalid payment status. Allowed values: ${ALLOWED_PAYMENT_STATUSES.join(', ')}` 
        }, { status: 400 });
      }
      updateData.paymentStatus = paymentStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid update data provided' }, { status: 400 });
    }

    const conn = await connectToDatabase();

    const dbSession = await conn.startSession();
    dbSession.startTransaction();

    let modifiedCount = 0;
    try {
      let ordersToLog: any[] = [];
      if (paymentStatus === 'Paid') {
        ordersToLog = await Order.find({ _id: { $in: ids }, paymentStatus: { $ne: 'Paid' } }).session(dbSession);
      }

      const Product = (await import('@/models/Product')).default;
      const becomesValid = ['Confirmed', 'Paid', 'Delivered'].includes(status || '');

      for (const id of ids) {
        const updateObj: any = {};
        if (status) updateObj.status = status;
        if (paymentStatus) updateObj.paymentStatus = paymentStatus;

        let order;
        if (becomesValid) {
          // Atomic check-then-set for isSalesCounted to prevent race conditions
          order = await Order.findOneAndUpdate(
            { _id: id, isSalesCounted: { $ne: true } },
            { $set: { ...updateObj, isSalesCounted: true } },
            { session: dbSession, new: true }
          );

          if (order) {
            // Only increment if we successfully flipped the isSalesCounted flag
            for (const item of order.items) {
              await Product.updateOne(
                { _id: item.product },
                { $inc: { totalSales: item.quantity } },
                { session: dbSession }
              );
            }
            modifiedCount++;
          } else {
            // Fallback: update status/paymentStatus even if sales were already counted
            const fallbackOrder = await Order.findOneAndUpdate(
              { _id: id },
              { $set: updateObj },
              { session: dbSession, new: true }
            );
            if (fallbackOrder) modifiedCount++;
          }
        } else {
          // Regular update when not becoming a valid sale
          const regularOrder = await Order.findOneAndUpdate(
            { _id: id },
            { $set: updateObj },
            { session: dbSession, new: true }
          );
          if (regularOrder) modifiedCount++;
        }
      }

      await dbSession.commitTransaction();

      if (ordersToLog.length > 0) {
        try {
          const { logOrderPaymentToLedger } = await import('@/lib/ledgerHelper');
          for (const order of ordersToLog) {
            await logOrderPaymentToLedger(order);
          }
        } catch (ledgerErr) {
          console.error('[Ledger] Error logging payments in bulk update:', ledgerErr);
        }
      }

      return NextResponse.json({ 
        message: `${modifiedCount} orders updated successfully`,
        count: modifiedCount 
      });
    } catch (error) {
      await dbSession.abortTransaction();
      throw error;
    } finally {
      await dbSession.endSession();
    }
  } catch (error) {
    console.error('Bulk Update Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    try {
      const session = await auth();
      if (!session || !(['admin', 'super_admin', 'manager'].includes((session?.user as any)?.role))) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
  
      const { ids } = await req.json();
  
      const idError = validateIds(ids);
      if (idError) {
        return NextResponse.json({ message: idError }, { status: 400 });
      }
  
      await connectToDatabase();
  
      const result = await Order.updateMany(
        { _id: { $in: ids } },
        { $set: { deletedAt: new Date() } }
      );
  
      return NextResponse.json({ 
        message: `${result.modifiedCount} orders soft-deleted successfully`,
        count: result.modifiedCount 
      });
    } catch (error) {
      console.error('Bulk Delete Error:', error);
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
  }
