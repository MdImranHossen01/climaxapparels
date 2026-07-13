import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import LandingPage from '@/models/LandingPage';
import { auth } from '@/auth';

// Auth helper
async function authorizeAdmin() {
  const session = await auth();
  if (!session || !session.user || !(['admin', 'super_admin'].includes((session.user as any)?.role))) {
    return false;
  }
  return true;
}

// GET all landing pages
export async function GET() {
  try {
    if (!(await authorizeAdmin())) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const pages = await LandingPage.find().sort({ createdAt: -1 });
    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching landing pages:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create new landing page
export async function POST(req: NextRequest) {
  try {
    if (!(await authorizeAdmin())) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, slug } = body;

    if (!title || !slug) {
      return NextResponse.json({ message: 'Title and Slug are required' }, { status: 400 });
    }

    // Slug validation (lowercase, numbers, hyphens only)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ 
        message: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens (no trailing hyphens).' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Check if slug exists
    const existing = await LandingPage.findOne({ slug });
    if (existing) {
      return NextResponse.json({ message: 'Slug already exists' }, { status: 409 });
    }

    const newPage = await LandingPage.create({
      title,
      slug,
      sections: [], // Start with empty sections
    });

    return NextResponse.json(newPage, { status: 201 });
  } catch (error: any) {
    console.error('Error creating landing page:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
