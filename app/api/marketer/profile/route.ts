import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is a marketer
    if (session.user.role !== 'MARKETER') {
      return NextResponse.json({ error: 'Forbidden - Not a marketer' }, { status: 403 });
    }
    
    const marketer = await prisma.marketerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
      return NextResponse.json({ error: 'Marketer profile not found' }, { status: 404 });
    }
    
    return NextResponse.json({ profile: marketer });
    
  } catch (error) {
    console.error('Error fetching marketer profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'MARKETER') {
      return NextResponse.json({ error: 'Forbidden - Not a marketer' }, { status: 403 });
    }
    
    const body = await request.json();
    const { department, title } = body;
    
    const marketer = await prisma.marketerProfile.update({
      where: { userId: session.user.id },
      data: {
        department,
        title,
      },
    });
    
    return NextResponse.json({ profile: marketer });
    
  } catch (error) {
    console.error('Error updating marketer profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
