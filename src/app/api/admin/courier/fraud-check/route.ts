import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import GlobalSettings from '@/models/GlobalSettings';
import FraudCheck from '@/models/FraudCheck';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    if (!phone) {
      return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if we have any cached result in the database
    const cachedResult = await FraudCheck.findOne({ phone });

    if (cachedResult) {
      return NextResponse.json(cachedResult.data);
    }

    // If no cache exists, call the BD Courier API
    const settingsDoc = await GlobalSettings.findOne().sort({ updatedAt: -1 });
    const settings = settingsDoc ? settingsDoc.toObject({ getters: true }) : null;
    const apiKey = settings?.courierConfig?.bdCourier?.apiKey;

    if (!apiKey) {
      return NextResponse.json({ message: 'BD Courier API key is not configured' }, { status: 400 });
    }

    const res = await fetch('https://api.bdcourier.com/courier-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ phone })
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ message: `BD Courier API error: ${errText}` }, { status: res.status });
    }

    const data = await res.json();

    // Save the result in database cache forever
    await FraudCheck.findOneAndUpdate(
      { phone },
      { data },
      { upsert: true, new: true }
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('BD Courier Fraud Check error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
