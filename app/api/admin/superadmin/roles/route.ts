import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

// GET - List all admin roles
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission using RBAC - admins.roles permission required
    const hasAccess = await hasPermission('admins.roles');
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden - admins.roles permission required" }, { status: 403 });
    }

    // Get all roles with their permission counts and admin counts
    const roles = await prisma.adminRole.findMany({
      include: {
        permissions: true,
        _count: {
          select: {
            admins: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform to match frontend expectations
    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isDefault: role.isDefault,
      isSuperRole: role.isSuperRole,
      _count: {
        admins: role._count.admins,
      },
      permissions: role.permissions.map(p => ({ permission: { id: p.permissionId } })),
    }));

    return NextResponse.json({ roles: transformedRoles });
  } catch (error) {
    console.error("Error fetching admin roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
