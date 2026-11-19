import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['platform_email', 'platform_phone', 'platform_address']
        }
      }
    });

    console.log('Contact settings found:', settings);

    const contact: Record<string, string> = {};
    settings.forEach(setting => {
      contact[setting.key] = typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value);
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact info:', error);
    return NextResponse.json({ error: 'Failed to fetch contact info' }, { status: 500 });
  }
}
