import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/auth';

// GET the user's cart
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || typeof session.user.email !== 'string' || session.user.email.trim() === '') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email.trim() });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.cart || []);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

