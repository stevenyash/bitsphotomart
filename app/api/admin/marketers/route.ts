import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
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
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { user: { email: { contains: search } } },
        { user: { name: { contains: search } } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    const [marketers, total] = await Promise.all([
      prisma.marketerProfile.findMany({
        where,
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
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.marketerProfile.count({ where }),
    ]);
    
    return NextResponse.json({
      marketers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching marketers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check for users.create permission via RBAC
    const { hasPermission } = await import('@/lib/rbac');
    const hasAccess = await hasPermission('users.create');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - No access' }, { status: 403 });
    }
    
    const body = await request.json();
    const { email, name, phone, password, department, title, commissionRate } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        password: hashedPassword,
        role: 'MARKETER',
        isVerified: true,
      },
    });
    
    const marketer = await prisma.marketerProfile.create({
      data: {
        userId: newUser.id,
        department,
        title,
        commissionRate: commissionRate ? parseFloat(commissionRate) : 10,
        status: 'ACTIVE',
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      marketer: {
        id: marketer.id,
        email: newUser.email,
        name: newUser.name,
      }
    });
    
  } catch (error) {
    console.error('Error creating marketer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
