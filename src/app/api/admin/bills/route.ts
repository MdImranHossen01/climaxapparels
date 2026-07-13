import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Bill from '@/models/Bill';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'all', 'paid', 'due'
    const type = searchParams.get('type') || 'bill'; // 'offer', 'chalan', 'bill'
    
    await connectToDatabase();

    let query: any = {};
    if (type === 'bill') {
      query.$or = [{ documentType: 'bill' }, { documentType: { $exists: false } }];
    } else {
      query.documentType = type;
    }

    if (filter === 'paid') {
      query.status = 'Paid';
    } else if (filter === 'due') {
      query.status = 'Due';
    }

    const bills = await Bill.find(query).sort({ createdAt: -1 });
    return NextResponse.json(bills);
  } catch (error: any) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      clientName,
      clientPhone,
      clientAddress,
      items,
      subtotal,
      deliveryCharge,
      serviceFee,
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
      convertedFrom
    } = body;

    if (!clientName || !clientPhone || !clientAddress || !items || items.length === 0) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Generate unique sequential document number
    const docType = documentType || 'bill';
    const lastDoc = await Bill.findOne({ documentType: docType }).sort({ createdAt: -1 });
    
    let lastBillForFallback = null;
    if (!lastDoc && docType === 'bill') {
      lastBillForFallback = await Bill.findOne({ documentType: { $exists: false } }).sort({ createdAt: -1 });
    }
    const matchedDoc = lastDoc || lastBillForFallback;

    let nextNum = 101;
    if (matchedDoc && matchedDoc.invoiceNo) {
      const match = matchedDoc.invoiceNo.match(/\d+/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }

    let prefix = 'INV-';
    if (docType === 'offer') prefix = 'OFF-';
    else if (docType === 'chalan') prefix = 'CH-';

    const invoiceNo = `${prefix}${String(nextNum).padStart(7, '0')}`;

    const newBill = new Bill({
      clientName,
      clientPhone,
      clientAddress,
      invoiceNo,
      items,
      subtotal,
      deliveryCharge,
      serviceFee: serviceFee || 0,
      discountType,
      discountValue,
      discount,
      total,
      prevDue,
      gTotal,
      cashIn,
      currentBillDue,
      status,
      expectedReceivableDate: status === 'Due' && expectedReceivableDate ? new Date(expectedReceivableDate) : undefined,
      documentType: docType,
      convertedFrom: convertedFrom || undefined
    });

    await newBill.save();

    // Log to ledger if it is a final Bill (not offers/chalans)
    if (docType === 'bill') {
      try {
        const { logLedgerTransaction } = await import('@/lib/ledgerHelper');
        
        // Debit Accounts Receivable by the grand total of the bill
        await logLedgerTransaction(
          'AR',
          'debit',
          gTotal,
          `Bill Generated for ${clientName}`,
          invoiceNo
        );

        // If client paid any cash upfront
        if (cashIn > 0) {
          // Debit Cash (increases cash asset)
          await logLedgerTransaction(
            'CASH',
            'debit',
            cashIn,
            `Cash Paid Upfront for Bill ${invoiceNo}`,
            invoiceNo
          );
          // Credit Accounts Receivable (decreases receivable asset)
          await logLedgerTransaction(
            'AR',
            'credit',
            cashIn,
            `Upfront payment credit for Bill ${invoiceNo}`,
            invoiceNo
          );
        }
      } catch (err) {
        console.error('Error logging to ledger:', err);
      }
    }

    return NextResponse.json(newBill, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bill:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
