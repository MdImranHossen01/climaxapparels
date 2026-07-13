import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import connectToDatabase from '@/lib/db';
import Blog from '@/models/Blog';
import { auth } from '@/auth';

// GET all blogs for admin
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !(['admin', 'super_admin'].includes((session.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
    const skip = (page - 1) * limit;

    const query = {};

    const [blogs, total] = await Promise.all([
      Blog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
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
  } catch (error: any) {
    console.error('[Admin Blog List GET] error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new blog
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !(['admin', 'super_admin'].includes((session.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    // Basic server-side validation for slug uniqueness
    const existingBlog = await Blog.findOne({ slug: body.slug });
    if (existingBlog) {
      return NextResponse.json({ message: 'A blog with this slug already exists' }, { status: 400 });
    }

    // Whitelist allowed fields to prevent mass-assignment
    const blogData = {
      title: body.title,
      slug: body.slug,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      content: body.content,
      thumbnail: body.thumbnail,
      isPublished: body.isPublished ?? true
    };

    const blog = await Blog.create(blogData);

    // Revalidate paths to show the new blog instantly
    try {
      revalidatePath('/');
      revalidatePath('/blog');
      revalidateTag('blogs', 'max');
    } catch (revalidateError) {
      console.error('[Admin Blog Create revalidatePath] error:', revalidateError);
    }

    return NextResponse.json(blog, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Blog Create POST] error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
