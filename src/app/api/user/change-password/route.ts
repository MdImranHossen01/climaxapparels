import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword) {
      return NextResponse.json(
        { message: 'Please provide a new password.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email }).select('+password');

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }
    
    // If user has a current password, we could verify it, 
    // but the user requested to allow changing with just new/confirm if logged in.
    // For Google users who don't have a password yet, this allows them to set one.

    // Set new password, User schema pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    return NextResponse.json(
      { message: 'Password updated successfully!' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { message: 'Failed to update password.' },
      { status: 500 }
    );
  }
}

