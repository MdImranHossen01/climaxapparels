import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin;
  return NextResponse.redirect(`${origin}/checkout`, 303);
}

