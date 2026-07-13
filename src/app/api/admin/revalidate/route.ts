
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { tag, path } = await req.json();

    if (tag) {
      revalidateTag(tag, 'max');
      console.log(`Revalidated tag: ${tag}`);
    }

    if (path) {
      revalidatePath(path, 'layout');
      console.log(`Revalidated path: ${path}`);
    }

    // Force revalidate all main tags if no specific tag provided
    if (!tag && !path) {
      revalidateTag('products', 'max');
      revalidateTag('categories', 'max');
      revalidateTag('banners', 'max');
      revalidateTag('faqs', 'max');
      revalidateTag('settings', 'max');
      revalidatePath('/', 'layout');
      console.log('Revalidated all main tags');
    }

    return NextResponse.json({ message: 'Revalidation successful' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

