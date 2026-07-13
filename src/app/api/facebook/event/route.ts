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

        const pixelId = settings?.metaPixelId;
        const accessToken = settings?.facebookAccessToken;

        if (!pixelId || !accessToken) {
            console.error('[FB CAPI] Missing configuration for', hostname, { hasPixelId: !!pixelId, hasAccessToken: !!accessToken });
            return NextResponse.json({ error: 'Missing Facebook config' }, { status: 500 });
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

        // Get browser identifiers for best match quality
        const fbp = request.cookies.get('_fbp')?.value;
        const fbc = request.cookies.get('_fbc')?.value;

        // --- Hashing & Normalization ---
        const hashedEmail = userData.em ? await hashData(userData.em) : undefined;
        
        // Process phone: ensure digits only and has country code (BD: 88)
        let phone = userData.ph ? userData.ph.replace(/\D/g, '') : '';
        if (phone && !phone.startsWith('88')) {
            phone = '88' + phone;
        }
        const hashedPhone = phone ? await hashData(phone) : undefined;
        
        // Hash name if provided
        const hashedFirstName = userData.fn ? await hashData(userData.fn) : undefined;
        const hashedLastName = userData.ln ? await hashData(userData.ln) : undefined;
        
        // Hash additional details
        const hashedCity = userData.ct ? await hashData(userData.ct) : undefined;
        const hashedState = userData.st ? await hashData(userData.st) : undefined;
        const hashedZip = userData.zp ? await hashData(userData.zp) : undefined;
        const hashedCountry = userData.country ? await hashData(userData.country) : undefined;

        // Prepare user data for best match quality
        const fbUserData: any = {
            client_ip_address: ipAddress,
            client_user_agent: userAgent,
            fbp,
            fbc,
            ...(hashedEmail && { em: [hashedEmail] }),
            ...(hashedPhone && { ph: [hashedPhone] }),
            ...(hashedFirstName && { fn: [hashedFirstName] }),
            ...(hashedLastName && { ln: [hashedLastName] }),
            ...(hashedCity && { ct: [hashedCity] }),
            ...(hashedState && { st: [hashedState] }),
            ...(hashedZip && { zp: [hashedZip] }),
            ...(hashedCountry && { country: [hashedCountry] }),
        };

        const payload: any = {
            data: [
                {
                    event_name: eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: eventId,
                    event_source_url: eventUrl,
                    action_source: 'website',
                    user_data: fbUserData,
                    custom_data: {
                        ...customData,
                    },
                },
            ],
        };

        // Add test_event_code if present (useful for testing in Events Manager)
        if (settings?.facebookTestEventCode) {
            payload.test_event_code = settings.facebookTestEventCode;
        }

        const fbResponse = await fetch(
            `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );

        const result = await fbResponse.json();

        if (!fbResponse.ok) {
            console.error('[FB CAPI] Error:', result);
            return NextResponse.json(
                { error: 'Failed to send event to Facebook', details: result },
                { status: fbResponse.status }
            );
        }

        return NextResponse.json({ success: true, eventId });
    } catch (error) {
        console.error('[FB CAPI] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

