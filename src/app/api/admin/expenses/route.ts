import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const query: any = {};
    if (category) query.category = category;
    
    if (from || to) {
      const dateQuery: any = {};
      
      if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate.getTime())) {
          return NextResponse.json({ message: 'Invalid "from" date format' }, { status: 400 });
        }
        dateQuery.$gte = fromDate;
      }
      
      if (to) {
        const toDate = new Date(to);
        if (isNaN(toDate.getTime())) {
          return NextResponse.json({ message: 'Invalid "to" date format' }, { status: 400 });
        }
        dateQuery.$lte = toDate;
      }
      
      query.date = dateQuery;
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, amount, category, date, description } = body;

    // Validate required fields (basic)
    if (!title || amount === undefined || !category) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Build safe payload (whitelist)
    const safePayload = {
      title,
      amount,
      category,
      date: date ? new Date(date) : new Date(),
      description
    };

    await connectToDatabase();
    
    const expense = await Expense.create(safePayload);

    // Log to ledger
    try {
      const { logLedgerTransaction } = await import('@/lib/ledgerHelper');
      // Credit Cash (decreases cash asset)
      await logLedgerTransaction(
        'CASH',
        'credit',
        amount,
        `Expense Paid: ${title} (${category})`,
        expense._id.toString()
      );
    } catch (err) {
      console.error('Error logging expense to ledger:', err);
    }

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
