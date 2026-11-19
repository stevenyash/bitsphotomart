import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin, logAdminActivity } from '@/lib/authorization';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/superadmin/users/[id] - Get a specific user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const isSuper = await isSuperAdmin();
    if (!isSuper) {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 });
    }
    
    const { id } = await params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        adminProfile: {
          include: {
            adminRole: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Don't return password
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT /api/admin/superadmin/users/[id] - Update a user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const isSuper = await isSuperAdmin();
    if (!isSuper) {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 });
    }
    
    const { id } = await params;
    
    // Check if trying to modify own account
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
    }
    
    const body = await request.json();
    const { name, phone, role, adminRoleId, department, title, password, locked } = body;
    
    // Get current user data for logging
    const currentUser = await prisma.user.findUnique({
      where: { id },
      include: { adminProfile: true },
    });
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (password !== undefined) {
      updateData.password = await bcrypt.hash(password, 12);
    }
    
    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    
    // Update admin profile if role is an admin role
    const isAdminRole = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'FINANCE_MANAGER'].includes(role || currentUser.role);
    
    if (isAdminRole) {
      await prisma.adminProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          adminRoleId: adminRoleId || null,
          department,
          title,
        },
        update: {
          adminRoleId: adminRoleId !== undefined ? adminRoleId : undefined,
          department: department !== undefined ? department : undefined,
          title: title !== undefined ? title : undefined,
          lockedUntil: locked !== undefined ? (locked ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) : null) : undefined,
        },
      });
    } else if (currentUser.adminProfile) {
      // Remove admin profile if role is no longer admin
      await prisma.adminProfile.delete({
        where: { userId: id },
      }).catch(() => {}); // Ignore if not found
    }
    
    // Log activity
    await logAdminActivity(
      session.user.id,
      'user.update',
      'User',
      user.id,
      { previousRole: currentUser.role, newRole: role, adminRoleId },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );
    
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/superadmin/users/[id] - Delete a user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const isSuper = await isSuperAdmin();
    if (!isSuper) {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 });
    }
    
    const { id } = await params;
    
    // Check if trying to delete own account
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Prevent deleting SuperAdmin
    if (user.role === 'SUPERADMIN') {
      return NextResponse.json({ error: 'Cannot delete SuperAdmin account' }, { status: 400 });
    }
    
    // Delete admin profile first
    await prisma.adminProfile.deleteMany({
      where: { userId: id },
    }).catch(() => {}); // Ignore if not found
    
    // Delete user
    await prisma.user.delete({
      where: { id },
    });
    
    // Log activity
    await logAdminActivity(
      session.user.id,
      'user.delete',
      'User',
      id,
      { email: user.email, role: user.role },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
