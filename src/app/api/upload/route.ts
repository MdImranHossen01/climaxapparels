import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Auth check - any authenticated user can upload images (e.g. profile pictures or product/setting images)
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.IMGBB_API_KEY || process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      console.error('Server Configuration Error: IMGBB_API_KEY is not set');
      return NextResponse.json({ message: 'Image upload service is not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const image = formData.get('image');

    if (!image) {
      return NextResponse.json({ message: 'No image provided' }, { status: 400 });
    }

    // Re-pack for ImgBB
    const imgbbFormData = new FormData();
    imgbbFormData.append('image', image);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: imgbbFormData,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({
        message: `Image upload failed: Unexpected response from provider. Status: ${response.status}`,
        details: text
      }, { status: 502 }); // Bad Gateway for vendor error
    }

    if (data.success) {
      return NextResponse.json({ url: data.data.url });
    } else {
      const errorMsg = data?.error?.message || data?.error || `Upload failed with status ${response.status}`;
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in /api/upload:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

