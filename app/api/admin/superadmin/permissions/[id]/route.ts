import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/rbac';

// PUT /api/admin/superadmin/permissions/[id] - Update a permission
// DELETE /api/admin/superadmin/permissions/[id] - Delete a permission
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permission using RBAC
    const hasAccess = await hasPermission('admins.roles');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - admins.roles permission required' }, { status: 403 });
    }
    
    const { id } = await params;
    const body = await request.json();
    const { name, description, category } = body;
    
    // Check if permission exists
    const existing = await prisma.permission.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }
    
    // Validate name format if provided
    if (name) {
      const nameRegex = /^[a-z0-9._]+$/;
      if (!nameRegex.test(name)) {
        return NextResponse.json({ 
          error: 'Permission name must be lowercase with dots or underscores only' 
        }, { status: 400 });
      }
      
      // Check for duplicate name (excluding current)
      const duplicate = await prisma.permission.findFirst({
        where: { 
          name: name.toLowerCase().trim(),
          NOT: { id },
        },
      });
      
      if (duplicate) {
        return NextResponse.json({ error: 'Permission with this name already exists' }, { status: 409 });
      }
    }
    
    // Update permission
    const permission = await prisma.permission.update({
      where: { id },
      data: {
        name: name?.toLowerCase().trim() || existing.name,
        description: description !== undefined ? description?.trim() || null : existing.description,
        category: category?.toLowerCase().trim() || existing.category,
      },
    });
    
    return NextResponse.json({ permission });
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permission using RBAC
    const hasAccess = await hasPermission('admins.roles');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - admins.roles permission required' }, { status: 403 });
    }
    
    const { id } = await params;
    
    // Check if permission exists
    const existing = await prisma.permission.findUnique({
      where: { id },
      include: {
        _count: {
          select: { adminRoles: true, userPermissions: true },
        },
      },
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }
    
    // Check if permission is in use
    if (existing._count.adminRoles > 0 || existing._count.userPermissions > 0) {
      return NextResponse.json({ 
        error: `Cannot delete permission "${existing.name}" - it is assigned to ${existing._count.adminRoles} role(s) and ${existing._count.userPermissions} user(s). Please remove assignments first.` 
      }, { status: 409 });
    }
    
    // Delete permission
    await prisma.permission.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: 'Permission deleted successfully' });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 });
  }
}
