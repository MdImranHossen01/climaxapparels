import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import WalletTransaction from '@/models/WalletTransaction';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const transactions = await WalletTransaction.find({ userId: (session.user as any).id })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching wallet history:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

