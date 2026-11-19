import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission as checkSessionPermission, getUserPermissions } from '@/lib/rbac';
import type { Role } from '@/lib/generated/prisma/client';

/**
 * Check if current user is a SuperAdmin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  
  return user?.role === 'SUPERADMIN';
}

/**
 * Check if current user is an admin (Admin, SuperAdmin, Manager, FinanceManager)
 */
export async function isAdmin(includeMarketer = false): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  
  const adminRoles = includeMarketer 
    ? ['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER', 'MARKETER']
    : ['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER'];
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  
  return user ? adminRoles.includes(user.role) : false;
}

/**
 * Check if current user is a marketer
 */
export async function isMarketer(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  
  return user?.role === 'MARKETER';
}

/**
 * Get current user's marketer profile
 */
export async function getCurrentMarketerProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  return prisma.marketerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      referrals: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}

/**
 * Check if current user has a specific permission
 */
export async function requirePermission(permissionName: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  
  // SuperAdmin always has all permissions
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  
  if (user?.role === 'SUPERADMIN') {
    return true;
  }
  
  return checkSessionPermission(permissionName);
}

/**
 * Require a specific permission - throws if not authorized
 */
export async function requirePermissionOrThrow(permissionName: string): Promise<void> {
  const hasAccess = await requirePermission(permissionName);
  if (!hasAccess) {
    throw new Error(`Permission denied: ${permissionName}`);
  }
}

/**
 * Require admin role (not regular user)
 */
export async function requireAdmin(): Promise<boolean> {
  return isAdmin();
}

/**
 * Require SuperAdmin role
 */
export async function requireSuperAdmin(): Promise<boolean> {
  return isSuperAdmin();
}

/**
 * Get current user's admin profile
 */
export async function getCurrentAdminProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  return prisma.adminProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      adminRole: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });
}

/**
 * Get current user's permissions
 */
export async function getCurrentUserPermissions(): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  
  if (user?.role === 'SUPERADMIN') {
    const allPerms = await prisma.permission.findMany();
    return allPerms.map(p => p.name);
  }
  
  return getUserPermissions(session.user.id);
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(roles: string[]): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  
  return user ? roles.includes(user.role) : false;
}

/**
 * Log admin activity
 */
export async function logAdminActivity(
  adminId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.adminActivityLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details: details as any,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
}

/**
 * Authorization result type
 */
export type AuthResult = {
  authorized: boolean;
  userId?: string;
  role?: string;
  permissions?: string[];
  error?: string;
};

/**
 * Check authorization with full details
 */
export async function checkAuthorization(): Promise<AuthResult> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { authorized: false, error: 'Not authenticated' };
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  
  if (!user) {
    return { authorized: false, error: 'User not found' };
  }
  
  const adminRoles = ['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER'];
  if (!adminRoles.includes(user.role)) {
    return { authorized: false, error: 'Not authorized', role: user.role };
  }
  
  const permissions = await getCurrentUserPermissions();
  
  return {
    authorized: true,
    userId: user.id,
    role: user.role,
    permissions,
  };
}
