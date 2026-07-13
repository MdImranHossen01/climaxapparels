import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import GlobalSettings from '@/models/GlobalSettings';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const settings = await GlobalSettings.findOne();
    
    return NextResponse.json(settings?.testimonials || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    
    const settings = await GlobalSettings.findOneAndUpdate(
      {},
      { $push: { testimonials: body } },
      { new: true, upsert: true, sort: { updatedAt: -1 } }
    );

    return NextResponse.json(settings.testimonials);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const settings = await GlobalSettings.findOneAndUpdate(
      { 'testimonials._id': id },
      { $set: { 'testimonials.$': { ...updateData, _id: id } } },
      { new: true }
    );

    return NextResponse.json(settings?.testimonials || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await req.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const settings = await GlobalSettings.findOneAndUpdate(
      {},
      { $pull: { testimonials: { _id: id } } },
      { new: true, sort: { updatedAt: -1 } }
    );

    return NextResponse.json(settings?.testimonials || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
