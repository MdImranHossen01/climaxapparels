import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Bill from '@/models/Bill';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin', 'manager'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const bill = await Bill.findById(id);
    if (!bill) {
      return NextResponse.json({ message: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error: any) {
    console.error('Error fetching bill:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();

    const bill = await Bill.findById(id);
    if (!bill) {
      return NextResponse.json({ message: 'Bill not found' }, { status: 404 });
    }

    const prevCashInValue = bill.cashIn || 0;

    // Update fields
    const {
      clientName,
      clientPhone,
      clientAddress,
      items,
      subtotal,
      deliveryCharge,
      discountType,
      discountValue,
      discount,
      total,
      prevDue,
      gTotal,
      cashIn,
      currentBillDue,
      status,
      expectedReceivableDate,
      documentType,
      convertedFrom,
    } = body;

    if (clientName !== undefined) bill.clientName = clientName;
    if (clientPhone !== undefined) bill.clientPhone = clientPhone;
    if (clientAddress !== undefined) bill.clientAddress = clientAddress;
    if (items !== undefined) bill.items = items;
    if (subtotal !== undefined) bill.subtotal = subtotal;
    if (deliveryCharge !== undefined) bill.deliveryCharge = deliveryCharge;
    if (discountType !== undefined) bill.discountType = discountType;
    if (discountValue !== undefined) bill.discountValue = discountValue;
    if (discount !== undefined) bill.discount = discount;
    if (total !== undefined) bill.total = total;
    if (prevDue !== undefined) bill.prevDue = prevDue;
    if (gTotal !== undefined) bill.gTotal = gTotal;
    if (cashIn !== undefined) bill.cashIn = cashIn;
    if (currentBillDue !== undefined) bill.currentBillDue = currentBillDue;
    if (status !== undefined) bill.status = status;
    if (documentType !== undefined) bill.documentType = documentType;
    if (convertedFrom !== undefined) bill.convertedFrom = convertedFrom;
    
    if (status === 'Paid') {
      bill.currentBillDue = 0;
      bill.cashIn = bill.gTotal;
      bill.expectedReceivableDate = undefined;
    } else if (expectedReceivableDate !== undefined) {
      bill.expectedReceivableDate = expectedReceivableDate ? new Date(expectedReceivableDate) : undefined;
    }

    await bill.save();

    // Log payment updates to ledger
    const paymentReceived = (bill.cashIn || 0) - prevCashInValue;
    if (paymentReceived > 0 && bill.documentType === 'bill') {
      try {
        const { logLedgerTransaction } = await import('@/lib/ledgerHelper');
        // Debit Cash by the payment amount
        await logLedgerTransaction(
          'CASH',
          'debit',
          paymentReceived,
          `Payment Received for Bill ${bill.invoiceNo}`,
          bill.invoiceNo
        );
        // Credit Accounts Receivable by the payment amount
        await logLedgerTransaction(
          'AR',
          'credit',
          paymentReceived,
          `Payment credit for Bill ${bill.invoiceNo}`,
          bill.invoiceNo
        );
      } catch (err) {
        console.error('Error logging to ledger:', err);
      }
    }

    return NextResponse.json(bill);
  } catch (error: any) {
    console.error('Error updating bill:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const bill = await Bill.findByIdAndDelete(id);
    if (!bill) {
      return NextResponse.json({ message: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bill deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting bill:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
