import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/auth';
// POST sync local wishlist with database
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('[Wishlist Sync] Starting sync process...');

    const session = await auth();
    console.log(`[Wishlist Sync] Auth check completed in ${Date.now() - startTime}ms`);

    if (!session || !session.user) {
      console.warn('[Wishlist Sync] Unauthorized attempt');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { productIds } = await req.json();
    console.log(`[Wishlist Sync] Body parsed. Received ${productIds?.length || 0} IDs`);

    if (!Array.isArray(productIds)) {
      return NextResponse.json({ message: 'productIds must be an array' }, { status: 400 });
    }

    const MAX_PRODUCT_IDS = 100;
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    const validProductIds = productIds
      .map((id: any) => (typeof id === 'string' ? id.trim() : ''))
      .filter((id: string) => id !== '' && objectIdRegex.test(id));

    if (validProductIds.length > MAX_PRODUCT_IDS) {
      return NextResponse.json({ message: `Maximum ${MAX_PRODUCT_IDS} product IDs allowed` }, { status: 400 });
    }

    console.log('[Wishlist Sync] Connecting to database...');
    await connectToDatabase();
    console.log(`[Wishlist Sync] Database connected in ${Date.now() - startTime}ms`);

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      console.warn('[Wishlist Sync] User not found for session');
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    console.log(`[Wishlist Sync] User fetched. Current wishlist size: ${user.wishlist.length}`);

    // OPTIMIZED Merge logic: Use a Set for O(1) lookups
    const existingIds = new Set(user.wishlist.map((id: any) => id.toString()));
    let addedCount = 0;

    validProductIds.forEach((id: string) => {
      if (!existingIds.has(id)) {
        user.wishlist.push(id as any);
        existingIds.add(id);
        addedCount++;
      }
    });

    console.log(`[Wishlist Sync] Merge completed. Added ${addedCount} new items.`);

    if (addedCount > 0) {
      console.log('[Wishlist Sync] Saving user document...');
      await user.save();
      console.log(`[Wishlist Sync] Save completed in ${Date.now() - startTime}ms`);
    }

    // Harden Serialization: Ensure we return an array of plain strings
    const finalWishlist = user.wishlist.map((id: any) => id.toString());

    console.log(`[Wishlist Sync] Process finished successfully in ${Date.now() - startTime}ms`);
    return NextResponse.json(finalWishlist);
  } catch (error: any) {
    console.error('[Wishlist Sync] CRITICAL ERROR:', error.message);
    if (error.stack) console.error(error.stack);

    return NextResponse.json({
      message: 'Internal Server Error'
    }, { status: 500 });
  }
}

