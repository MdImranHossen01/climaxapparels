import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import { auth } from '@/auth';
import { slugify } from '@/lib/slugify';
import { generateUniqueSlug } from '@/lib/slugify-server';

// GET all products
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const ids = searchParams.get('ids');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    // TODO: Consider requiring admin auth for limits > 100 or implementing a separate bulk endpoint
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '40')));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (ids) {
      query._id = { $in: ids.split(',') };
    }

    const search = searchParams.get('search');
    if (search) {
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
      query.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } },
        { sku: { $regex: sanitizedSearch, $options: 'i' } }
      ];
    }

    const category = searchParams.get('category');
    if (category) {
      query.categories = { $in: category.split(',') };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categories')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new product (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !(['admin', 'super_admin'].includes((session.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ message: 'Invalid JSON request body' }, { status: 400 });
    }

    const { name, slug, description, sku, categories, tags, images, attributes, variants, isFeatured, isNewArrival, isPublished, discountRate } = body;
    let { price, salePrice, stock } = body;

    // Numeric validation and coercion
    const rawPrice = parseFloat(price);
    const parsedPrice = Number.isFinite(rawPrice) ? rawPrice : 0;

    const rawSalePrice = parseFloat(salePrice);
    const parsedSalePrice = Number.isFinite(rawSalePrice) ? rawSalePrice : undefined;

    const rawStock = parseInt(stock, 10);
    const parsedStock = Number.isFinite(rawStock) ? rawStock : 0;

    const rawDiscountRate = parseFloat(discountRate);
    const parsedDiscountRate = Number.isFinite(rawDiscountRate) ? rawDiscountRate : undefined;

    // Validate required fields and price
    if (!name || !slug || !description || !sku || isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({
        message: 'Invalid or missing required fields. Price must be a positive number.'
      }, { status: 400 });
    }

    // Validate salePrice logic
    if (parsedSalePrice !== undefined) {
      if (isNaN(parsedSalePrice) || parsedSalePrice < 0 || parsedSalePrice > parsedPrice) {
        return NextResponse.json({
          message: 'Sale price must be a non-negative number and less than or equal to the regular price.'
        }, { status: 400 });
      }
    }

    // Coerce variant numeric fields and whitelist properties
    const coercedVariants = (variants || []).map((v: any) => ({
      _id: v._id || v.id,
      color: v.color,
      size: v.size,
      sku: v.sku,
      image: v.image,
      price: Number.isFinite(parseFloat(v.price)) ? parseFloat(v.price) : 0,
      salePrice: Number.isFinite(parseFloat(v.salePrice)) ? parseFloat(v.salePrice) : undefined,
      stock: Number.isFinite(parseInt(v.stock, 10)) ? parseInt(v.stock, 10) : 0,
      discountRate: Number.isFinite(parseFloat(v.discountRate)) ? parseFloat(v.discountRate) : undefined,
    }));

    await connectToDatabase();

    const maxRetries = 3;
    let attempt = 0;
    let lastError;

    while (attempt < maxRetries) {
      attempt++;
      const currentSlug = attempt === 1 ? slug : `${slug}-${attempt - 1}`;
      const uniqueSlug = await generateUniqueSlug(Product, currentSlug);

      try {
        const newProduct = await Product.create({
          name,
          slug: uniqueSlug,
          description,
          price: parsedPrice,
          salePrice: parsedSalePrice,
          discountRate: parsedDiscountRate,
          sku,
          stock: parsedStock,
          categories: categories || [],
          tags: tags || [],
          images: images || [],
          attributes: attributes || [],
          variants: coercedVariants,
          isFeatured: isFeatured !== undefined ? isFeatured : false,
          isNewArrival: isNewArrival !== undefined ? isNewArrival : false,
          isPublished: isPublished !== undefined ? isPublished : true,
        });

        revalidateTag('products', 'max');
        revalidatePath('/');
        return NextResponse.json(newProduct, { status: 201 });
      } catch (error: any) {
        lastError = error;
        if (error.code === 11000 && error.keyPattern?.slug) {
          // If slug conflict, retry with incremented slug
          continue;
        }

        // If other duplicate error (e.g. SKU), or other DB error, return 400
        if (error.code === 11000) {
          const field = Object.keys(error.keyPattern || {})[0] || 'slug/SKU';
          return NextResponse.json({
            message: `Product with this ${field} already exists.`
          }, { status: 400 });
        }
        throw error;
      }
    }

    // If we exhausted retries
    return NextResponse.json({
      message: 'Failed to generate a unique slug after several attempts. Please try a different name or slug.',
      error: lastError?.message
    }, { status: 400 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

