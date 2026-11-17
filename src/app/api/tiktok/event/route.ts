import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import GlobalSettings from '@/models/GlobalSettings';
import { headers } from 'next/headers';

async function hashData(data: string): Promise<string> {
    if (!data) return '';
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
    try {
        const headersList = await headers();
        const hostname = headersList.get('host') || 'localhost';
        
        await connectToDatabase();
        const settings = await GlobalSettings.findOne().sort({ updatedAt: -1 }).lean();

        const pixelId = settings?.tiktokPixelId;
        const accessToken = settings?.tiktokAccessToken;

        if (!pixelId || !accessToken) {
            // TikTok not configured — skip silently (not an error)
            return NextResponse.json({ skipped: true, reason: 'TikTok not configured' }, { status: 200 });
        }

        const body = await request.json();
        const { 
            eventName = 'PageView', 
            eventUrl, 
            userAgent, 
            customData = {}, 
            userData = {} 
        } = body;

        // Get real client IP
        const ipAddress =
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            request.headers.get('x-real-ip') ||
            '0.0.0.0';

        // Generate/Use event ID for deduplication
        const eventId = body.eventId || crypto.randomUUID();

        // --- Hashing & Normalization ---
        const hashedEmail = userData.em ? await hashData(userData.em) : undefined;
        
        // Process phone: ensure digits only and has country code (BD: 88)
        let phone = userData.ph ? userData.ph.replace(/\D/g, '') : '';
        if (phone && !phone.startsWith('88')) {
            phone = '88' + phone;
        }
        const hashedPhone = phone ? await hashData(phone) : undefined;

        // Prepare user data for TikTok matching
        const ttUserData: any = {
            ...(hashedEmail && { email: hashedEmail }),
            ...(hashedPhone && { phone_number: hashedPhone }),
        };

        // Construct TikTok contents format
        const rawContents = Array.isArray(customData.contents) ? customData.contents : [];
        const contents = rawContents.map((i: any) => ({
            content_id: String(i.id || i.product || ''),
            price: Number(i.item_price || i.price || 0),
            quantity: Number(i.quantity || 1),
            content_name: i.name || undefined,
        }));

        const payload: any = {
            event_source: 'web',
            event_source_id: String(pixelId).trim(),
            data: [
                {
                    event: eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: eventId,
                    user: {
                        ...ttUserData,
                        ip: ipAddress,
                        user_agent: userAgent,
                    },
                    page: {
                        url: eventUrl,
                    },
                    properties: {
                        currency: customData.currency || 'BDT',
                        value: customData.value ? Number(customData.value) : undefined,
                        content_type: customData.content_type || 'product',
                        ...(contents.length > 0 && { contents }),
                    },
                },
            ],
            ...((settings as any)?.tiktokTestEventCode?.trim() && { test_event_code: (settings as any).tiktokTestEventCode.trim() }),
        };

        const response = await fetch(
            `https://business-api.tiktok.com/open_api/v1.3/event/track/`,
            {
                method: 'POST',
                headers: { 
                    'Access-Token': accessToken,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(payload),
            }
        );

        const result = await response.json();

        if (!response.ok || result.code !== 0) {
      return NextResponse.json(
        { skipped: true, details: result },
        { status: 200 }
      );
    }

        return NextResponse.json({ success: true, eventId });
    } catch (error) {
        console.error('[TikTok API] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
