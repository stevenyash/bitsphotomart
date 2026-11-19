import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearPermissionCache } from "@/lib/rbac";

// GET - Get all permissions for a specific role
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden - SuperAdmin only" }, { status: 403 });
    }

    const { id: roleId } = await params;

    // Get role with its permissions
    const role = await prisma.adminRole.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Get all available permissions grouped by category
    const allPermissions = await prisma.permission.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const rolePermissions = role.permissions.map(p => p.permission.name);

    return NextResponse.json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
      },
      rolePermissions,
      availablePermissions: allPermissions,
    });
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Grant or revoke permissions for a role
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUserRole = (session.user as { role?: string })?.role;
    if (adminUserRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden - SuperAdmin only" }, { status: 403 });
    }

    const { id: roleId } = await params;
    const body = await request.json();
    const { permissionIds, action } = body; // action: 'grant' or 'revoke'

    if (!permissionIds || !Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "permissionIds array required" }, { status: 400 });
    }

    // Check if role exists
    const role = await prisma.adminRole.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (action === "grant") {
      // Grant permissions to role
      await Promise.all(
        permissionIds.map(async (permissionId: string) => {
          await prisma.adminRolePermission.upsert({
            where: {
              adminRoleId_permissionId: {
                adminRoleId: roleId,
                permissionId,
              },
            },
            update: {},
            create: {
              adminRoleId: roleId,
              permissionId,
            },
          });
        })
      );
    } else if (action === "revoke") {
      // Revoke permissions from role
      await prisma.adminRolePermission.deleteMany({
        where: {
          adminRoleId: roleId,
          permissionId: { in: permissionIds },
        },
      });
    }

    // Clear permission cache for all users with this role
    clearPermissionCache();

    return NextResponse.json({ 
      success: true, 
      message: action === "grant" ? "Permissions granted to role" : "Permissions revoked from role" 
    });
  } catch (error) {
    console.error("Error updating role permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
