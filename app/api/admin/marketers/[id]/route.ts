import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check for users.view permission via RBAC
    const { hasPermission } = await import('@/lib/rbac');
    const hasAccess = await hasPermission('users.view');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - No access' }, { status: 403 });
    }
    
    const marketer = await prisma.marketerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatar: true,
            createdAt: true,
            isVerified: true,
          },
        },
        referrals: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            referredUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    if (!marketer) {
      return NextResponse.json({ error: 'Marketer not found' }, { status: 404 });
    }
    
    return NextResponse.json({ marketer });
    
  } catch (error) {
    console.error('Error fetching marketer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check for users.update permission via RBAC
    const { hasPermission } = await import('@/lib/rbac');
    const hasAccess = await hasPermission('users.update');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - No access' }, { status: 403 });
    }
    
    const data = await request.json();
    
    const marketer = await prisma.marketerProfile.update({
      where: { id },
      data: {
        department: data.department,
        title: data.title,
        commissionRate: data.commissionRate ? parseFloat(data.commissionRate) : undefined,
        targetSales: data.targetSales ? parseFloat(data.targetSales) : undefined,
        status: data.status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });
    
    if (data.status) {
      await prisma.user.update({
        where: { id: marketer.userId },
        data: { 
          role: data.status === 'SUSPENDED' ? 'USER' : 'MARKETER',
        },
      });
    }
    
    return NextResponse.json({ marketer });
    
  } catch (error) {
    console.error('Error updating marketer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check for users.delete permission via RBAC
    const { hasPermission } = await import('@/lib/rbac');
    const hasAccess = await hasPermission('users.delete');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - No access' }, { status: 403 });
    }
    
    const marketer = await prisma.marketerProfile.findUnique({
      where: { id },
    });
    
    if (!marketer) {
      return NextResponse.json({ error: 'Marketer not found' }, { status: 404 });
    }
    
    await prisma.user.update({
      where: { id: marketer.userId },
      data: { role: 'USER' },
    });
    
    await prisma.marketerProfile.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting marketer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
