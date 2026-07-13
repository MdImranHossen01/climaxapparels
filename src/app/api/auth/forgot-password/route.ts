import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { sendResetEmail } from '@/lib/mail';

// In-memory rate limiting map (Note: In production/serverless, use Redis)
const rateLimit = new Map<string, { count: number; lastRequest: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

function isRateLimited(key: string) {
  const now = Date.now();
  const record = rateLimit.get(key);
  
  if (!record) {
    rateLimit.set(key, { count: 1, lastRequest: now });
    return false;
  }
  
  if (now - record.lastRequest > RATE_LIMIT_WINDOW) {
    rateLimit.set(key, { count: 1, lastRequest: now });
    return false;
  }
  
  if (record.count >= MAX_REQUESTS) return true;
  
  record.count += 1;
  record.lastRequest = now;
  return false;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const genericResponse = { message: 'If an account exists with that email, a reset link has been sent.' };
  
  try {
    const { email } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate Limiting
    if (isRateLimited(ip) || isRateLimited(normalizedEmail)) {
      // Return same generic message for rate limiting
      return NextResponse.json(genericResponse);
    }

    await connectToDatabase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Timing parity delay
      const elapsed = Date.now() - startTime;
      const sleep = Math.max(0, 1000 - elapsed); // Aim for at least 1s
      await new Promise(r => setTimeout(r, sleep));
      return NextResponse.json(genericResponse);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    // Send email first (as per user request to avoid dangling tokens on fail)
    try {
      await sendResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      return NextResponse.json({ message: 'Failed to send reset email. Please try again later.' }, { status: 500 });
    }

    // Save hashed token to DB
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    return NextResponse.json(genericResponse);
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Something went wrong. Please try again later.' }, { status: 500 });
  }
}
