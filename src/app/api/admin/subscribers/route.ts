import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Subscriber from '@/models/Subscriber';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });

    return NextResponse.json(subscribers);
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    await connectDB();
    
    const result = await Subscriber.findOneAndDelete({ _id: id });

    if (!result) {
      return NextResponse.json({ message: 'Subscriber not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Subscriber deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
