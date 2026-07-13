import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Blog from '@/models/Blog';
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '12'));
    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Show only published blogs publicly, newest first
    const query = { isPublished: true };
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .sort({ createdAt: -1 })
        .select('title slug metaDescription thumbnail createdAt')
        .skip(skip)
        .limit(limit),
      Blog.countDocuments(query)
    ]);

    return NextResponse.json({
      blogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching blogs collection:', error);
    if (error instanceof Error && error.stack) console.error(error.stack);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

