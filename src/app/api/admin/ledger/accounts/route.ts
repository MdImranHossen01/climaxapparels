import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import LedgerAccount from '@/models/LedgerAccount';
import { seedLedgerAccounts, recalculateLedgerBalance } from '@/lib/ledgerHelper';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    await seedLedgerAccounts();

    const accounts = await LedgerAccount.find().sort({ code: 1 });
    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error('Error fetching ledger accounts:', error);
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
    const { code, openingBalance } = body;

    if (!code || openingBalance === undefined) {
      return NextResponse.json({ message: 'Missing code or opening balance' }, { status: 400 });
    }

    await connectToDatabase();
    
    const account = await LedgerAccount.findOne({ code });
    if (!account) {
      return NextResponse.json({ message: 'Account not found' }, { status: 404 });
    }

    account.openingBalance = Number(openingBalance);
    await account.save();

    // Recalculate full balance of the account
    await recalculateLedgerBalance(code);

    const updatedAccount = await LedgerAccount.findOne({ code });
    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    console.error('Error updating opening balance:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
