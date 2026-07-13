import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = body.items || body.cartItems;
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ message: 'Invalid items array' }, { status: 400 });
    }

    await connectToDatabase();

    const validItems = [];
    let removedCount = 0;

    for (const item of items) {
      const product = await Product.findOne({ 
        _id: item.productId, 
        isPublished: true 
      });

      if (!product) {
        removedCount++;
        continue;
      }

      // If item has variant details, check if they still exist and check stock
      let availableStock = product.stock || 0;
      let variantId = undefined;

      if (item.color || item.size) {
        const variant = product.variants?.find((v: any) => 
          String(v.color || '').trim() === String(item.color || '').trim() &&
          String(v.size || '').trim() === String(item.size || '').trim()
        );
        
        if (!variant) {
          removedCount++;
          continue;
        }
        availableStock = variant.stock || 0;
        variantId = variant._id;
      }

      validItems.push({
        ...item,
        availableStock,
        isInsufficient: availableStock < item.quantity,
        variantId
      });
    }

    return NextResponse.json({ 
      validItems, 
      removedCount,
      hasInsufficientStock: validItems.some(i => i.isInsufficient)
    });

  } catch (error) {
    console.error('Cart sync error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
