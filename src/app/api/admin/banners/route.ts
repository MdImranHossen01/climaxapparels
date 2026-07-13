import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Banner from '@/models/Banner';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const banners = await Banner.find().sort({ order: 1 });
    return NextResponse.json(banners);
  } catch (error) {
    console.error('Fetch Banners Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();
    
    // Whitelist allowed fields
    const whitelistedBanner = {
      title: body.title,
      image: body.image,
      link: body.link,
      primaryBtnText: body.primaryBtnText,
      primaryBtnLink: body.primaryBtnLink,
      secondaryBtnText: body.secondaryBtnText,
      secondaryBtnLink: body.secondaryBtnLink,
      order: body.order ?? 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
    };

    const banner = await Banner.create(whitelistedBanner);
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('Create Banner Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
