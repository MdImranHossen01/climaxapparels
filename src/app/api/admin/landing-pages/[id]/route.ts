import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import LandingPage from '@/models/LandingPage';
import { auth } from '@/auth';
import mongoose from 'mongoose';

// Auth helper
async function authorizeAdmin() {
  const session = await auth();
  if (!session || !session.user || !(['admin', 'super_admin'].includes((session.user as any)?.role))) {
    return false;
  }
  return true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!(await authorizeAdmin())) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    await connectToDatabase();
    const page = await LandingPage.findById(id);
    
    if (!page) {
      return NextResponse.json({ message: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!(await authorizeAdmin())) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    const body = await req.json();
    
    // Sanitize update data (Whitelist)
    const allowedFields = ['title', 'description', 'sections', 'seoConfig', 'isActive'];
    const sanitizedUpdate: any = {};
    
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        sanitizedUpdate[key] = body[key];
      }
    });

    if (Object.keys(sanitizedUpdate).length === 0) {
      return NextResponse.json({ message: 'No valid fields provided for update' }, { status: 400 });
    }

    await connectToDatabase();
    const updatedPage = await LandingPage.findByIdAndUpdate(
      id,
      { $set: sanitizedUpdate },
      { new: true, runValidators: true }
    );

    if (!updatedPage) {
      return NextResponse.json({ message: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(updatedPage);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!(await authorizeAdmin())) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    await connectToDatabase();
    const deletedPage = await LandingPage.findByIdAndDelete(id);

    if (!deletedPage) {
      return NextResponse.json({ message: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Page deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
