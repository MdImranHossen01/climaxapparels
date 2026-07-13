import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Review from '@/models/Review';
import { auth } from '@/auth';

// GET all reviews for moderation (with pagination)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    
    // Parse and sanitize query parameters
    const pageRaw = parseInt(searchParams.get('page') || '1', 10);
    const limitRaw = parseInt(searchParams.get('limit') || '10', 10);
    
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 && limitRaw <= 100 ? limitRaw : 10;
    
    const skip = (page - 1) * limit;

    await connectToDatabase();
    
    const [reviews, total] = await Promise.all([
      Review.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('product', 'name slug')
        .populate('user', 'name email'),
      Review.countDocuments()
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch Admin Reviews Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
