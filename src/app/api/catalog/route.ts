import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Catalog from '@/models/Catalog';
import { auth } from '@/auth';

const makeBulletDesc = (...lines: string[]): string =>
  JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        content: lines.map(line => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: line }] }],
        })),
      },
    ],
  });

const DEFAULT_SPEC = makeBulletDesc(
  'Materials: Cotton Lycra / Modal / Bamboo Fiber',
  'Sizes: S – XXL',
  'Styles: Low-rise, Mid-rise, Sports',
  'Features: Stretchable, skin-friendly, strong waistband',
  'MOQ: 300 pcs',
  'Design | Customization: Private Label, Branded Elastic, Tagless Printing'
);

// Default catalog data for first-time use
const DEFAULT_CATALOG = {
  companyInfo: {
    about: 'Climax Apparels is a leading manufacturer specializing in men\'s underwear with over 10 years of experience in the textile and garment industry. We focus on quality, comfort, and innovation, providing premium innerwear solutions to global brands, wholesalers, and retailers. We offer OEM (Original Equipment Manufacturer) and ODM (Original Design Manufacturer) services.',
    capacity: '5,00,000 pcs/m',
    established: 'Since 2014',
    certifications: 'ISO, BSCI Certified',
    markets: 'EU, USA, Mid-East',
    address: 'Sarkarbari, Helal Market, Uttar Khan, Dhaka, Bangladesh',
    phone: '+880 1724-338581',
    email: 'info@climaxapparels.com',
    corporatePresence: 'LinkedIn / Alibaba / Google Business Profile',
  },
  categories: [
    {
      id: 'ck',
      name: 'Calvin Klein',
      description: makeBulletDesc(
        'Materials: 100% Cotton / Cotton Spandex / Polyester',
        'Sizes: S \u2013 XXL',
        'Styles: Regular Fit, Slim Fit, Printed',
        'Features: Soft, breathable, premium quality',
        'MOQ: 300 pcs',
        'Design | Customization: Private Label, Branded Elastic, Tagless Printing'
      ),
      items: [
        { name: 'Calvin Klein - Black / Gray / White', image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=500&q=80' },
        { name: 'Calvin Klein - All Black / White Belt', image: 'https://images.unsplash.com/photo-1610102646270-e4c19ad4efd3?w=500&q=80' },
        { name: 'Calvin Klein - All Black', image: 'https://images.unsplash.com/photo-1582830359879-8908f852b630?w=500&q=80' },
        { name: 'Bralette & Legging Set', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80' },
        { name: 'Bralette & Panty Set', image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?w=500&q=80' },
        { name: 'Bikini Set', image: 'https://images.unsplash.com/photo-1507919909716-c8262e491cde?w=500&q=80' },
      ],
    },
    {
      id: 'tommy',
      name: 'Tommy Hilfiger',
      description: DEFAULT_SPEC,
      items: [
        { name: 'Boxer Brief 3-Pack (Black/White/Red)', image: 'https://images.unsplash.com/photo-1582830359879-8908f852b630?w=500&q=80' },
        { name: 'Brief 4-Pack / White', image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=500&q=80' },
        { name: 'Bralette Set / Black', image: 'https://images.unsplash.com/photo-1562572159-4ebcd318f4dd?w=500&q=80' },
        { name: 'Bikini Panty 3-Pack', image: 'https://images.unsplash.com/photo-1507919909716-c8262e491cde?w=500&q=80' },
      ],
    },
    {
      id: 'versace',
      name: 'Versace',
      description: DEFAULT_SPEC,
      items: [
        { name: 'Border Trunks', image: 'https://images.unsplash.com/photo-1610102646270-e4c19ad4efd3?w=500&q=80' },
        { name: 'Scoop Bralette', image: 'https://images.unsplash.com/photo-1562572159-4ebcd318f4dd?w=500&q=80' },
        { name: 'Versace Logo Trunks 3-Pack', image: 'https://images.unsplash.com/photo-1582830359879-8908f852b630?w=500&q=80' },
      ],
    },
    {
      id: 'boss',
      name: 'Hugo Boss',
      description: DEFAULT_SPEC,
      items: [
        { name: 'Three-pack boxer briefs', image: 'https://images.unsplash.com/photo-1582830359879-8908f852b630?w=500&q=80' },
        { name: 'Three-pack of trunks', image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=500&q=80' },
        { name: 'Triangle bra with red logo', image: 'https://images.unsplash.com/photo-1562572159-4ebcd318f4dd?w=500&q=80' },
      ],
    },
    {
      id: 'prl',
      name: 'Polo Ralph Lauren',
      description: DEFAULT_SPEC,
      items: [
        { name: 'Repeat-Logo Bikini Brief', image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?w=500&q=80' },
        { name: 'Boxer Brief 3-Pack (Navy/Red)', image: 'https://images.unsplash.com/photo-1582830359879-8908f852b630?w=500&q=80' },
        { name: 'Boxer Brief 3-Pack (Black)', image: 'https://images.unsplash.com/photo-1510102146196-77f9d05bb8e3?w=500&q=80' },
      ],
    },
    {
      id: 'swim',
      name: 'Swim Shorts',
      description: makeBulletDesc(
        'Materials: Quick Dry Microfiber / Polyester Blend',
        'Sizes: S \u2013 XXL',
        'Styles: Classic, Board, Athletic',
        'Features: Quick dry, drawstring waist, side pockets',
        'MOQ: 300 pcs',
        'Design | Customization: Custom Print, Embroidery, Branded Tag'
      ),
      items: [
        { name: 'Traveler Classic Swim Trunk', image: 'https://images.unsplash.com/photo-1507919909716-c8262e491cde?w=500&q=80' },
        { name: 'Double Waistband Swim Shorts', image: 'https://images.unsplash.com/photo-1507919909716-c8262e491cde?w=500&q=80' },
        { name: 'Medium Drawstring Swim Shorts', image: 'https://images.unsplash.com/photo-1507919909716-c8262e491cde?w=500&q=80' },
      ],
    },
  ],
};

// GET - Public: Return catalog data
export async function GET() {
  try {
    await connectToDatabase();
    const catalog = await Catalog.findOne().sort({ updatedAt: -1 });
    if (!catalog) {
      return NextResponse.json(DEFAULT_CATALOG);
    }
    return NextResponse.json(catalog.toObject());
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return NextResponse.json(DEFAULT_CATALOG);
  }
}

// POST - Admin only: Create or update full catalog
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes((session.user as any)?.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    let catalog = await Catalog.findOne().sort({ updatedAt: -1 });
    if (catalog) {
      if (body.companyInfo) {
        catalog.companyInfo = { ...catalog.companyInfo.toObject?.() ?? catalog.companyInfo, ...body.companyInfo };
        catalog.markModified('companyInfo');
      }
      if (body.categories !== undefined) {
        catalog.categories = body.categories;
        catalog.markModified('categories');
      }
      await catalog.save();
    } else {
      catalog = await Catalog.create({
        companyInfo: body.companyInfo ?? DEFAULT_CATALOG.companyInfo,
        categories: body.categories ?? DEFAULT_CATALOG.categories,
      });
    }

    return NextResponse.json(catalog.toObject(), { status: 200 });
  } catch (error: any) {
    console.error('Error saving catalog:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
