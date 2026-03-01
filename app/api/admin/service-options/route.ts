import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/service-options - List all service options
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bpmServiceId = searchParams.get('bpmServiceId');
    const category = searchParams.get('category');

    const where: any = {};
    
    if (bpmServiceId) {
      where.bpmServiceId = bpmServiceId;
    }
    
    if (category) {
      where.category = category;
    }

    const options = await prisma.serviceOption.findMany({
      where,
      include: {
        bpmService: true,
      },
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' },
      ],
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error fetching service options:', error);
    return NextResponse.json({ error: 'Failed to fetch service options' }, { status: 500 });
  }
}

// POST /api/admin/service-options - Create new service option
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { value, label, description, price, category, displayOrder, isActive, bpmServiceId } = body;

    if (!value || !label || !category) {
      return NextResponse.json({ error: 'Value, label, and category are required' }, { status: 400 });
    }

    // Check for duplicate
    const existing = await prisma.serviceOption.findFirst({
      where: {
        value,
        category,
        bpmServiceId: bpmServiceId || null,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Service option with this value already exists in this category' }, { status: 400 });
    }

    const option = await prisma.serviceOption.create({
      data: {
        value,
        label,
        description,
        price: price || null,
        category,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
        bpmServiceId: bpmServiceId || null,
      },
    });

    return NextResponse.json(option);
  } catch (error) {
    console.error('Error creating service option:', error);
    return NextResponse.json({ error: 'Failed to create service option' }, { status: 500 });
  }
}
