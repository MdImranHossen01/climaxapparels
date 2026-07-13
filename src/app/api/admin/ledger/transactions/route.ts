import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import LedgerTransaction from '@/models/LedgerTransaction';
import { logLedgerTransaction, seedLedgerAccounts } from '@/lib/ledgerHelper';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    await seedLedgerAccounts();

    const transactions = await LedgerTransaction.find()
      .populate('account')
      .sort({ date: -1, createdAt: -1 });

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
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
      entryType, // 'deposit' | 'withdrawal' | 'transfer'
      accountCode, // 'CASH' | 'BANK'
      fromAccountCode, // used for transfer
      toAccountCode, // used for transfer
      amount,
      description,
      date,
    } = body;

    if (!entryType || !amount || amount <= 0 || !description) {
      return NextResponse.json({ message: 'Invalid or missing fields' }, { status: 400 });
    }

    await connectToDatabase();
    await seedLedgerAccounts();

    const txDate = date ? new Date(date) : new Date();

    if (entryType === 'transfer') {
      if (!fromAccountCode || !toAccountCode) {
        return NextResponse.json({ message: 'From and To accounts are required for transfers' }, { status: 400 });
      }

      // Credit the source account
      await logLedgerTransaction(
        fromAccountCode,
        'credit',
        amount,
        `Transfer to ${toAccountCode}: ${description}`,
        'manual-transfer',
        txDate
      );

      // Debit the destination account
      await logLedgerTransaction(
        toAccountCode,
        'debit',
        amount,
        `Transfer from ${fromAccountCode}: ${description}`,
        'manual-transfer',
        txDate
      );
    } else if (entryType === 'deposit') {
      if (!accountCode) {
        return NextResponse.json({ message: 'Account code is required' }, { status: 400 });
      }
      await logLedgerTransaction(
        accountCode,
        'debit',
        amount,
        `Manual Deposit: ${description}`,
        'manual-deposit',
        txDate
      );
    } else if (entryType === 'withdrawal') {
      if (!accountCode) {
        return NextResponse.json({ message: 'Account code is required' }, { status: 400 });
      }
      await logLedgerTransaction(
        accountCode,
        'credit',
        amount,
        `Manual Withdrawal: ${description}`,
        'manual-withdrawal',
        txDate
      );
    } else {
      return NextResponse.json({ message: 'Invalid entry type' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Ledger transaction logged successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error logging ledger transaction:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
