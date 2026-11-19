/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import bcrypt from "bcryptjs";

// GET - Get all users with optional filtering
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for admin role or permission
    const userRole = (session.user as { role?: string })?.role;
    const validAdminRoles = ['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER', 'MARKETER'];
    const hasAdminRole = userRole && validAdminRoles.includes(userRole);
    const hasAccess = await hasPermission('users.view');
    
    if (!hasAdminRole && !hasAccess) {
      return NextResponse.json({ error: "Forbidden - No user management access" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ];
    }

    // For photographers, we need to join with photographer table
    if (status === "PENDING" || status === "APPROVED" || status === "REJECTED") {
      where.photographer = {
        status,
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          photographer: true,
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
          marketerProfile: true,
        },
        orderBy: { createdAt: "desc" },
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
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update user role
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for admin role or permission
    const userRole = (session.user as { role?: string })?.role;
    const validAdminRoles = ['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER', 'MARKETER'];
    const hasAdminRole = userRole && validAdminRoles.includes(userRole);
    const hasAccess = await hasPermission('users.update');
    
    if (!hasAdminRole && !hasAccess) {
      return NextResponse.json({ error: "Forbidden - No user update access" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
    }

    // Validate role
    const validRoles = ["USER", "PHOTOGRAPHER", "ADMIN", "MANAGER", "FINANCE_MANAGER", "MARKETER"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prevent changing SUPERADMIN role
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (existingUser?.role === "SUPERADMIN") {
      return NextResponse.json({ error: "Cannot modify SUPERADMIN role" }, { status: 400 });
    }

    // Check if user already has a marketer profile
    const existingMarketerProfile = await prisma.marketerProfile.findUnique({
      where: { userId },
    });

    // Handle MARKETER role transitions
    if (role === 'MARKETER' && !existingMarketerProfile) {
      await prisma.marketerProfile.create({
        data: {
          userId,
          status: 'ACTIVE',
          commissionRate: 10,
        },
      });
    } else if (role !== 'MARKETER' && existingMarketerProfile) {
      // Remove marketer profile if changing away from MARKETER
      await prisma.marketerProfile.delete({
        where: { userId },
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for admin role or permission
    const currentUserRole = (session.user as { role?: string })?.role;
    const validAdminRoles = ['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER', 'MARKETER'];
    const hasAdminRole = currentUserRole && validAdminRoles.includes(currentUserRole);
    const hasAccess = await hasPermission('users.create');
    
    if (!hasAdminRole && !hasAccess) {
      return NextResponse.json({ error: "Forbidden - No user create access" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, phone, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const userRoleStr = role || 'USER';

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: userRoleStr as any,
        isVerified: true,
      },
    });

    // Create MarketerProfile if role is MARKETER
    if (currentUserRole === 'MARKETER') {
      await prisma.marketerProfile.create({
        data: {
          userId: user.id,
          status: 'ACTIVE',
          commissionRate: 10,
        },
      });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for admin role or permission
    const userRole = (session.user as { role?: string })?.role;
    const validAdminRoles = ['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER', 'MARKETER'];
    const hasAdminRole = userRole && validAdminRoles.includes(userRole);
    const hasAccess = await hasPermission('users.delete');
    
    if (!hasAdminRole && !hasAccess) {
      return NextResponse.json({ error: "Forbidden - No user delete access" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Prevent deleting yourself
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (currentUser?.id === userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
