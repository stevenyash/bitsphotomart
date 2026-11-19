import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearPermissionCache } from "@/lib/rbac";

// GET - Get all permissions for a specific user
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

    const { id: userId } = await params;

    // Get user's admin profile with permissions
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId },
      include: {
        adminRole: true,
        permissions: {
          include: {
            permission: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!adminProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all available permissions grouped by category
    const allPermissions = await prisma.permission.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Get role permissions
    let rolePermissions: string[] = [];
    if (adminProfile.adminRole) {
      const role = await prisma.adminRole.findUnique({
        where: { id: adminProfile.adminRoleId! },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
      rolePermissions = role?.permissions.map(p => p.permission.name) || [];
    }

    // Get user-specific permissions
    const userPermissions = adminProfile.permissions.map(p => p.permission.name);

    return NextResponse.json({
      user: adminProfile.user,
      role: adminProfile.adminRole,
      rolePermissions,
      userPermissions,
      availablePermissions: allPermissions,
    });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Grant or revoke user-specific permissions
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

    const { id: userId } = await params;
    const body = await request.json();
    const { permissionIds, action } = body; // action: 'grant' or 'revoke'

    if (!permissionIds || !Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "permissionIds array required" }, { status: 400 });
    }

    // Get or create admin profile
    let adminProfile = await prisma.adminProfile.findUnique({
      where: { userId },
    });

    if (!adminProfile) {
      // Create admin profile if doesn't exist
      adminProfile = await prisma.adminProfile.create({
        data: { userId },
      });
    }

    if (action === "grant") {
      // Grant permissions to user
      await Promise.all(
        permissionIds.map(async (permissionId: string) => {
          await prisma.userPermission.upsert({
            where: {
              adminProfileId_permissionId: {
                adminProfileId: adminProfile.id,
                permissionId,
              },
            },
            update: {},
            create: {
              adminProfileId: adminProfile.id,
              permissionId,
              createdBy: session.user.id,
            },
          });
        })
      );
    } else if (action === "revoke") {
      // Revoke permissions from user
      await prisma.userPermission.deleteMany({
        where: {
          adminProfileId: adminProfile.id,
          permissionId: { in: permissionIds },
        },
      });
    }

    // Clear permission cache
    clearPermissionCache();

    return NextResponse.json({ 
      success: true, 
      message: action === "grant" ? "Permissions granted" : "Permissions revoked" 
    });
  } catch (error) {
    console.error("Error updating user permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
