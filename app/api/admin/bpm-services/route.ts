import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('services.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - services.manage permission required' }, { status: 403 });
    }

    const services = await prisma.bpmService.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('services.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - services.manage permission required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, icon, color, link, cta, isActive, displayOrder } = body;

    // Generate slug from name if not provided
    const serviceSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const service = await prisma.bpmService.create({
      data: {
        name,
        slug: `${serviceSlug}-${Date.now()}`,
        description,
        icon,
        color,
        link,
        cta,
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
