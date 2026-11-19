import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin, logAdminActivity } from '@/lib/authorization';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/superadmin/roles/[id] - Update a role
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
    
    const body = await request.json();
    const { name, description, permissionIds } = body;
    
    // Get current role
    const currentRole = await prisma.adminRole.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });
    
    if (!currentRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    // Cannot modify SuperAdmin role
    if (currentRole.name === 'SuperAdmin') {
      return NextResponse.json({ error: 'Cannot modify SuperAdmin role' }, { status: 400 });
    }
    
    // Update role
    const role = await prisma.adminRole.update({
      where: { id },
      data: {
        description,
      },
    });
    
    // Update permissions if provided
    if (permissionIds !== undefined) {
      // Delete existing permissions
      await prisma.adminRolePermission.deleteMany({
        where: { adminRoleId: id },
      });
      
      // Add new permissions
      if (permissionIds.length > 0) {
        await prisma.adminRolePermission.createMany({
          data: permissionIds.map((permId: string) => ({
            adminRoleId: id,
            permissionId: permId,
          })),
        });
      }
    }
    
    // Log activity
    await logAdminActivity(
      session.user.id,
      'role.update',
      'AdminRole',
      role.id,
      { name: role.name, permissionCount: permissionIds?.length || 0 },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );
    
    // Return updated role
    const updatedRole = await prisma.adminRole.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { admins: true },
        },
      },
    });
    
    return NextResponse.json({ role: updatedRole });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE /api/admin/superadmin/roles/[id] - Delete a role
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
    
    // Get role
    const role = await prisma.adminRole.findUnique({
      where: { id },
      include: {
        _count: {
          select: { admins: true },
        },
      },
    });
    
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    // Cannot delete SuperAdmin role
    if (role.name === 'SuperAdmin') {
      return NextResponse.json({ error: 'Cannot delete SuperAdmin role' }, { status: 400 });
    }
    
    // Check if role has admins
    if (role._count.admins > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete role with assigned admins. Please reassign them first.' 
      }, { status: 400 });
    }
    
    // Delete role permissions first
    await prisma.adminRolePermission.deleteMany({
      where: { adminRoleId: id },
    });
    
    // Delete role
    await prisma.adminRole.delete({
      where: { id },
    });
    
    // Log activity
    await logAdminActivity(
      session.user.id,
      'role.delete',
      'AdminRole',
      id,
      { name: role.name },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );
    
    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
