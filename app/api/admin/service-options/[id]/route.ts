import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/service-options/[id] - Get single service option
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const option = await prisma.serviceOption.findUnique({
      where: { id },
      include: {
        bpmService: true,
      },
    });

    if (!option) {
      return NextResponse.json({ error: 'Service option not found' }, { status: 404 });
    }

    return NextResponse.json(option);
  } catch (error) {
    console.error('Error fetching service option:', error);
    return NextResponse.json({ error: 'Failed to fetch service option' }, { status: 500 });
  }
}

// PATCH /api/admin/service-options/[id] - Update service option
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { value, label, description, price, category, displayOrder, isActive, bpmServiceId } = body;

    const option = await prisma.serviceOption.update({
      where: { id },
      data: {
        ...(value && { value }),
        ...(label && { label }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: price || null }),
        ...(category && { category }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
        ...(bpmServiceId !== undefined && { bpmServiceId: bpmServiceId || null }),
      },
    });

    return NextResponse.json(option);
  } catch (error) {
    console.error('Error updating service option:', error);
    return NextResponse.json({ error: 'Failed to update service option' }, { status: 500 });
  }
}

// DELETE /api/admin/service-options/[id] - Delete service option
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.serviceOption.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service option:', error);
    return NextResponse.json({ error: 'Failed to delete service option' }, { status: 500 });
  }
}
