import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['price_photo_from', 'price_hd_clip_from', 'price_4k_clip_from']
        }
      }
    });

    console.log('Pricing settings found:', settings);

    const pricing: Record<string, string> = {};
    settings.forEach(setting => {
      pricing[setting.key] = typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value);
    });

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 });
  }
}
