import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/rbac';

type Permission = {
  id: string;
  name: string;
  description: string | null;
  category: string;
};

// GET /api/admin/superadmin/permissions - Get all permissions
export async function GET(request: NextRequest) {
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
    
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
    
    // Group by category
    const grouped: Record<string, Permission[]> = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
    
    return NextResponse.json({ permissions, grouped });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

// POST /api/admin/superadmin/permissions - Create a new permission
export async function POST(request: NextRequest) {
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
    
    const body = await request.json();
    const { name, description, category } = body;
    
    // Validate required fields
    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }
    
    // Validate name format (lowercase, dots, underscores only)
    const nameRegex = /^[a-z0-9._]+$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json({ 
        error: 'Permission name must be lowercase with dots or underscores only (e.g., users.view, custom_permission)' 
      }, { status: 400 });
    }
    
    // Check for duplicate
    const existing = await prisma.permission.findUnique({
      where: { name },
    });
    
    if (existing) {
      return NextResponse.json({ error: 'Permission with this name already exists' }, { status: 409 });
    }
    
    // Create permission
    const permission = await prisma.permission.create({
      data: {
        name: name.toLowerCase().trim(),
        description: description?.trim() || null,
        category: category.toLowerCase().trim(),
      },
    });
    
    return NextResponse.json({ permission }, { status: 201 });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
  }
}
