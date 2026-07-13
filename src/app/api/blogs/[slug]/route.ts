import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Blog from '@/models/Blog';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();
    const { slug } = await params;

    const blog = await Blog.findOne({ slug, isPublished: true });

    if (!blog) {
      return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error: unknown) {
    if (error instanceof Error) {
        console.error('Error fetching blog detail:', error.message);
    } else {
        console.error('An unknown error occurred while fetching blog detail');
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

