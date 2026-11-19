import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/rbac';

// GET /api/admin/settings - Get all settings
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission using RBAC - settings.platform permission required
    const hasAccess = await hasPermission('settings.platform');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' }
    });

    // Convert array to key-value object for easier consumption
    const settingsMap: Record<string, { value: string; description?: string }> = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = {
        value: setting.value,
        description: setting.description || undefined
      };
    });

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/admin/settings - Update settings
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission using RBAC - settings.platform permission required
    const hasAccess = await hasPermission('settings.platform');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    let { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    // Ensure value is always a string
    value = String(value);
    if (description) description = String(description);

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description }
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
