import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import AbandonedCart from '@/models/AbandonedCart';

// GET all active abandoned carts (Admin/Manager only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== 'admin' && userRole !== 'super_admin' && userRole !== 'manager')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limitParam = searchParams.get('limit') || '20';
    const limit = limitParam === 'all' ? 100000 : Math.max(1, parseInt(limitParam));
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    await connectToDatabase();

    const query: any = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (from || to) {
      query.createdAt = {};
      if (from) {
        query.createdAt.$gte = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    const totalCount = await AbandonedCart.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const carts = await AbandonedCart.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email');

    return NextResponse.json({
      carts,
      totalPages,
      totalCount,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching abandoned carts:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create/update an abandoned cart (Public checkout page)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, phone, email, street, deliveryArea, items, totalAmount } = body;

    if (!phone || !fullName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Missing required checkout information' }, { status: 400 });
    }

    await connectToDatabase();

    const session = await auth();
    const userId = session?.user?.id;

    // Clean phone number (remove whitespace, formatting)
    const cleanPhone = phone.replace(/\s+/g, '').trim();

    // Check if an abandoned cart already exists for this phone number
    let cart = await AbandonedCart.findOne({ phone: cleanPhone });

    if (cart) {
      // Update existing draft cart
      cart.fullName = fullName.trim();
      cart.email = email?.trim() || cart.email;
      cart.street = street?.trim() || cart.street;
      cart.deliveryArea = deliveryArea || cart.deliveryArea;
      cart.items = items;
      cart.totalAmount = totalAmount;
      if (userId) cart.user = userId as any;
      
      await cart.save();
    } else {
      // Create new draft cart
      cart = await AbandonedCart.create({
        user: userId || undefined,
        fullName: fullName.trim(),
        phone: cleanPhone,
        email: email?.trim(),
        street: street?.trim(),
        deliveryArea,
        items,
        totalAmount,
      });
    }

    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    console.error('Error saving abandoned cart:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE an abandoned cart (Admin/Manager only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== 'admin' && userRole !== 'super_admin' && userRole !== 'manager')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Missing cart ID' }, { status: 400 });
    }

    await connectToDatabase();
    await AbandonedCart.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Abandoned cart deleted successfully' });
  } catch (error) {
    console.error('Error deleting abandoned cart:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
