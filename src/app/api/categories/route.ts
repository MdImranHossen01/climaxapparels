import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
import { auth } from '@/auth';

// GET all categories
export async function GET() {
  try {
    await connectToDatabase();
    const categories = await Category.find({}).populate('parentCategory', 'name').sort({ createdAt: -1 });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new category (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session || !session.user || !(['admin', 'super_admin'].includes((session.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, slug, image, parentCategory, isActive } = await req.json();

    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if slug already exists
    if (slug) {
      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        return NextResponse.json({ message: 'Category with this slug already exists' }, { status: 400 });
      }
    }

    const newCategory = await Category.create({
      name,
      slug,
      image,
      parentCategory: parentCategory || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    revalidateTag('categories', 'max');
    revalidatePath('/');

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

