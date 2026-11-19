import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/rbac';
import { logAdminActivity } from '@/lib/authorization';
import bcrypt from 'bcryptjs';

// GET /api/admin/superadmin/users - Get all users with admin roles
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permission using RBAC - admins.manage permission required
    const hasAccess = await hasPermission('admins.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - admins.manage permission required' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    
    if (role) {
      where.role = role;
    }
    // Don't filter by default - show all users
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          adminProfile: {
            include: {
              adminRole: true,
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
          photographer: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/admin/superadmin/users - Create a new admin user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permission using RBAC - admins.manage permission required
    const hasAccess = await hasPermission('admins.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - admins.manage permission required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { email, password, name, phone, role, adminRoleId, department, title } = body;
    
    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, password, and role are required' }, { status: 400 });
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user with any role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role,
      },
    });
    
    // Create admin profile if role is an admin role
    if (['SUPERADMIN', 'ADMIN', 'MANAGER', 'FINANCE_MANAGER'].includes(role)) {
      await prisma.adminProfile.create({
        data: {
          userId: user.id,
          adminRoleId: adminRoleId || null,
          department,
          title,
        },
      });
    }
    
    // Create photographer profile if role is photographer
    if (role === 'PHOTOGRAPHER') {
      await prisma.photographer.create({
        data: {
          userId: user.id,
          status: 'PENDING',
        },
      });
    }
    
    // Log activity
    await logAdminActivity(
      session.user.id,
      'user.create',
      'User',
      user.id,
      { email, role, adminRoleId },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
