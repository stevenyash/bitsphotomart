/**
 * RBAC (Role-Based Access Control) - Single Source of Truth
 * 
 * This module provides centralized permission checking based on database records.
 * All permission checks should go through this service to ensure consistent
 * authorization across the application.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializePermissions } from "./permissions";

// Simple in-memory cache implementation
const cache = new Map<string, { data: unknown; expiry: number }>();

// Cache version - increment to invalidate all caches
const CACHE_VERSION = 2;

const CACHE = {
  get<T>(key: string): T | null {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }
    return item.data as T;
  },
  set<T>(key: string, data: T, ttlSeconds: number): void {
    cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  },
  clear(): void {
    cache.clear();
  },
};

// Types
export type Permission = {
  name: string;
  description: string;
  category: string;
};

export type MenuItem = {
  name: string;
  href: string;
  icon: string;
  description: string;
  permission?: string;
  category: string;
};

// Cache duration in seconds (5 minutes)
const PERMISSION_CACHE_TTL = 300;

/**
 * Get user-specific permissions (directly granted to user, beyond role)
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  if (!userId) return [];

  try {
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return adminProfile?.permissions.map(p => p.permission.name) || [];
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return [];
  }
}

/**
 * Get permissions for an admin role from the database
 * Results are cached for performance
 */
export async function getRolePermissions(roleName: string): Promise<string[]> {
  if (!roleName) return [];

  // Initialize permissions if not done yet
  await initializePermissions();

  // Check cache first
  const cacheKey = `v${CACHE_VERSION}_role_permissions_${roleName}`;
  const cached = CACHE.get<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const role = await prisma.adminRole.findUnique({
      where: { name: roleName },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    console.log(`[RBAC] Query for role "${roleName}":`, role ? 'found' : 'not found');
    if (role) {
      console.log(`[RBAC] Role "${roleName}" has ${role.permissions.length} permissions`);
      console.log(`[RBAC] Role "${roleName}" isSuperRole:`, role.isSuperRole);
    }

    // If role not found in database, return empty - no fallback here
    // The caller (hasPermission) will handle the fallback
    if (!role) {
      console.log(`[RBAC] Role "${roleName}" not found in database`);
      return [];
    }

    // SuperAdmin role gets all permissions
    if (role?.isSuperRole) {
      const allPermissions = await prisma.permission.findMany({
        select: { name: true },
      });
      const permNames = allPermissions.map(p => p.name);
      CACHE.set(cacheKey, permNames, PERMISSION_CACHE_TTL);
      return permNames;
    }

    const permissions = role?.permissions.map(p => p.permission.name) || [];
    CACHE.set(cacheKey, permissions, PERMISSION_CACHE_TTL);
    return permissions;
  } catch (error) {
    console.error("[RBAC] Error fetching role permissions:", error);
    return [];
  }
}

/**
 * Check if the current user has a specific permission
 * Works with both regular users and admin users
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  const userId = session.user.id;
  
  // Check if user is SuperAdmin via flag or role
  const isSuperAdmin = (session.user as { isSuperAdmin?: boolean })?.isSuperAdmin;
  const userRole = (session.user as { role?: string })?.role;
  if (isSuperAdmin || userRole === "SUPERADMIN") return true;

  // Use getCurrentUserRole to get the proper mapped admin role name
  let adminRole: string | null = await getCurrentUserRole();
  console.log(`[RBAC] getCurrentUserRole returned:`, adminRole);
  
  if (!adminRole) {
    // Check if user has admin-level role but no adminProfile
    if (['ADMIN', 'MANAGER', 'FINANCE_MANAGER', 'MARKETER'].includes(userRole || '')) {
      const mappedRole = mapUserRoleToAdminRole(userRole || '');
      if (mappedRole) {
        adminRole = mappedRole;
        console.log(`[RBAC] Using mapped role "${adminRole}" for user role "${userRole}"`);
      }
    }
    
    // If still no adminRole, deny access to admin functions
    if (!adminRole) {
      console.log(`[RBAC] No admin role found, denying access`);
      return false;
    }
  }

  // Get role permissions from database using the admin role name
  console.log(`[RBAC] Getting permissions for role: ${adminRole}`);
  const rolePermissions = await getRolePermissions(adminRole);
  
  // If still no permissions from database, deny access
  // (No hardcoded fallback - must get from DB)
  if (rolePermissions.length === 0) {
    console.log(`[RBAC] No permissions found for role "${adminRole}" in database`);
    return false;
  }
  
  // Get user-specific permissions (directly granted)
  const userPermissions = await getUserPermissions(userId);
  
  // Combine both - user has permission if either role OR user-specific allows it
  const allPermissions = [...rolePermissions, ...userPermissions];
  return allPermissions.includes(permission);
}

/**
 * Check if the current user has any of the specified permissions
 */
export async function hasAnyPermission(permissions: string[]): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if the current user has all of the specified permissions
 */
export async function hasAllPermissions(permissions: string[]): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Get all available permissions grouped by category
 */
export async function getAllPermissions(): Promise<Record<string, Permission[]>> {
  const cacheKey = `v${CACHE_VERSION}_all_permissions`;
  
  const cached = CACHE.get<Record<string, Permission[]>>(cacheKey);
  if (cached) return cached;

  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const grouped: Record<string, Permission[]> = {};
    for (const perm of permissions) {
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push({
        name: perm.name,
        description: perm.description || "",
        category: perm.category,
      });
    }

    CACHE.set(cacheKey, grouped, PERMISSION_CACHE_TTL);
    return grouped;
  } catch (error) {
    console.error("Error fetching all permissions:", error);
    return {};
  }
}

/**
 * Get all permission names as a flat array
 */
export async function getAllPermissionNames(): Promise<string[]> {
  const cacheKey = `v${CACHE_VERSION}_all_permission_names`;
  
  const cached = CACHE.get<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const permissions = await prisma.permission.findMany({
      select: { name: true },
    });
    const names = permissions.map(p => p.name);
    CACHE.set(cacheKey, names, PERMISSION_CACHE_TTL);
    return names;
  } catch (error) {
    console.error("Error fetching all permission names:", error);
    return [];
  }
}

/**
 * Get the current user's role name (from admin role, not user role)
 */
export async function getCurrentUserRole(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) return null;
  
  console.log(`[RBAC] getCurrentUserRole - session user:`, session.user);
  console.log(`[RBAC] getCurrentUserRole - user role:`, session.user.role);
  console.log(`[RBAC] getCurrentUserRole - adminRole in session:`, (session.user as { adminRole?: string }).adminRole);
  
  // Use adminRole (from AdminRole table) if available, otherwise fall back to user role
  const adminRole = (session.user as { adminRole?: string })?.adminRole;
  if (adminRole) {
    console.log(`[RBAC] getCurrentUserRole returning adminRole from session:`, adminRole);
    return adminRole;
  }
  
  // Fall back to the user role (SUPERADMIN, ADMIN, MANAGER, etc.)
  const userRole = (session.user as { role?: string })?.role;
  console.log(`[RBAC] getCurrentUserRole - no adminRole in session, using userRole:`, userRole);
  
  // Map user role to admin role name (handle case sensitivity)
  // "ADMIN" (user role) -> "Admin" (AdminRole name)
  // "SUPERADMIN" -> "SuperAdmin"
  // "MANAGER" -> "Manager"
  // "FINANCE_MANAGER" -> "FinanceManager"
  const mappedRole = mapUserRoleToAdminRole(userRole || '');
  console.log(`[RBAC] getCurrentUserRole returning mapped role:`, mappedRole);
  return mappedRole;
}

/**
 * Map user role to admin role name
 */
function mapUserRoleToAdminRole(userRole: string): string | null {
  const roleMapping: Record<string, string> = {
    'ADMIN': 'Admin',
    'SUPERADMIN': 'SuperAdmin',
    'MANAGER': 'Manager',
    'FINANCE_MANAGER': 'FinanceManager',
    'MARKETER': 'Marketer',
  };
  
  return roleMapping[userRole] || null;
}

/**
 * Check if current user is SuperAdmin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  
  // Check isSuperAdmin flag first
  const isSuper = (session.user as { isSuperAdmin?: boolean })?.isSuperAdmin;
  if (isSuper) return true;
  
  // Also check user role directly for SUPERADMIN
  const userRole = (session.user as { role?: string })?.role;
  return userRole === "SUPERADMIN";
}

/**
 * Check if current user is Finance Manager
 */
export async function isFinanceManager(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  
  // Check adminRole name
  const adminRole = (session.user as { adminRole?: string })?.adminRole;
  if (adminRole === "FinanceManager") return true;
  
  // Also check user role
  const userRole = (session.user as { role?: string })?.role;
  return userRole === "FINANCE_MANAGER";
}

/**
 * Get admin menu items based on user's permissions
 * This is the single source of truth for admin navigation
 */
export async function getAdminMenuItems(): Promise<MenuItem[]> {
  const role = await getCurrentUserRole();
  if (!role) {
    // Fallback: check session directly for admin roles
    const session = await auth();
    const userRole = session?.user?.role;
    if (userRole && ['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER', 'MARKETER'].includes(userRole)) {
      // Admin user without proper role mapping - use default admin permissions
      console.log("[RBAC] Admin user without role mapping, using fallback. User role:", userRole);
    } else {
      return [];
    }
  }

  // SuperAdmin sees all menu items
  const isSuper = role === "SUPERADMIN" || role === "SuperAdmin";
  
  // Get permissions for the role
  let permissions: string[];
  if (isSuper) {
    permissions = await getAllPermissionNames();
  } else {
    permissions = await getRolePermissions(role || 'Admin');
    // If no permissions from database, log error - no hardcoded fallback
    if (permissions.length === 0) {
      console.log("[RBAC] No permissions found for role:", role, "- menu items will be empty");
    }
  }

  const allMenuItems: MenuItem[] = [
    // SuperAdmin exclusive
    {
      name: "Super Admin",
      href: "/admin/superadmin",
      icon: "Crown",
      description: "Super Admin controls",
      permission: "admins.manage",
      category: "administration",
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: "Users",
      description: "Manage platform users",
      permission: "users.view",
      category: "users",
    },
    {
      name: "Marketers",
      href: "/admin/marketers",
      icon: "UserCog",
      description: "Manage marketing partners",
      permission: "users.view",
      category: "users",
    },
    {
      name: "Photographer Applications",
      href: "/admin/photographers",
      icon: "Camera",
      description: "Review photographer applications",
      permission: "photographers.view",
      category: "photographers",
    },
    {
      name: "Photo Management",
      href: "/admin/photos",
      icon: "Image",
      description: "Approve, reject, or remove photos",
      permission: "content.photos.view",
      category: "content",
    },
    {
      name: "Video Management",
      href: "/admin/videos",
      icon: "Video",
      description: "Manage videos",
      permission: "content.videos.view",
      category: "content",
    },
    {
      name: "Media Storage",
      href: "/admin/media",
      icon: "Cloud",
      description: "Manage S3 uploads",
      permission: "content.media.manage",
      category: "content",
    },
    {
      name: "Blog Management",
      href: "/admin/blog",
      icon: "FileText",
      description: "Manage blog posts",
      permission: "content.blog.manage",
      category: "content",
    },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: "Folder",
      description: "Manage categories",
      permission: "content.categories.manage",
      category: "content",
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: "ShoppingCart",
      description: "View and manage orders",
      permission: "orders.view",
      category: "orders",
    },
    {
      name: "Payouts",
      href: "/admin/payouts",
      icon: "CreditCard",
      description: "Manage photographer payouts",
      permission: "payouts.view",
      category: "payouts",
    },
    {
      name: "Services",
      href: "/admin/services",
      icon: "Briefcase",
      description: "Manage BPM services",
      permission: "services.manage",
      category: "services",
    },
    {
      name: "Service Requests",
      href: "/admin/bpm-services",
      icon: "List",
      description: "View service requests",
      permission: "services.requests",
      category: "services",
    },
    {
      name: "Photo Editing",
      href: "/admin/photo-editing",
      icon: "Palette",
      description: "Manage photo editing",
      permission: "services.editing.manage",
      category: "services",
    },
    {
      name: "Corporate Accounts",
      href: "/admin/corporate-accounts",
      icon: "Building",
      description: "Manage corporate accounts",
      permission: "corporate.view",
      category: "corporate",
    },
    {
      name: "Promo Codes",
      href: "/admin/promo-codes",
      icon: "Percent",
      description: "Manage promo codes",
      permission: "promocodes.manage",
      category: "promocodes",
    },
    {
      name: "Subscriptions",
      href: "/admin/subscription-plans",
      icon: "Repeat",
      description: "Manage subscription plans",
      permission: "subscriptions.manage",
      category: "subscriptions",
    },
    {
      name: "Messages",
      href: "/admin/messages",
      icon: "MessageSquare",
      description: "View user messages",
      permission: "messages.view",
      category: "messages",
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: "BarChart3",
      description: "View analytics",
      permission: "analytics.view",
      category: "analytics",
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: "Settings",
      description: "Platform settings",
      permission: "settings.platform",
      category: "settings",
    },
  ];

  // Filter menu items based on permissions
  return allMenuItems.filter(item => {
    // SuperAdmin sees everything
    if (isSuper) return true;
    // Others need the specific permission
    return item.permission && permissions.includes(item.permission);
  });
}

/**
 * Get finance-specific menu items
 */
export async function getFinanceMenuItems(): Promise<MenuItem[]> {
  const role = await getCurrentUserRole();
  if (!role) return [];

  const isSuper = role === "SUPERADMIN";
  const isFinance = role === "FINANCE_MANAGER";
  
  if (!isSuper && !isFinance) return [];

  const permissions = isSuper 
    ? await getAllPermissionNames()
    : await getRolePermissions(role);

  const financeMenuItems: MenuItem[] = [
    {
      name: "Revenue",
      href: "/admin/finance",
      icon: "DollarSign",
      description: "View revenue reports",
      permission: "revenue.view",
      category: "finance",
    },
    {
      name: "Profits",
      href: "/admin/finance/profits",
      icon: "TrendingUp",
      description: "View profit reports",
      permission: "profits.view",
      category: "finance",
    },
    {
      name: "Transactions",
      href: "/admin/finance/transactions",
      icon: "RefreshCw",
      description: "View all transactions",
      permission: "transactions.view",
      category: "finance",
    },
    {
      name: "Reversals",
      href: "/admin/finance/reversals",
      icon: "Undo2",
      description: "View payment reversals",
      permission: "reversals.view",
      category: "finance",
    },
  ];

  return financeMenuItems.filter(item => {
    if (isSuper) return true;
    return item.permission && permissions.includes(item.permission);
  });
}

/**
 * Require a specific permission - throws error if not allowed
 * Use this in API routes and server components
 */
export async function requirePermission(permission: string): Promise<void> {
  const hasAccess = await hasPermission(permission);
  if (!hasAccess) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(permissions: string[]): Promise<void> {
  const hasAccess = await hasAnyPermission(permissions);
  if (!hasAccess) {
    throw new Error(`Permission denied: none of [${permissions.join(", ")}]`);
  }
}

/**
 * Require all of the specified permissions
 */
export async function requireAllPermissions(permissions: string[]): Promise<void> {
  const hasAccess = await hasAllPermissions(permissions);
  if (!hasAccess) {
    throw new Error(`Permission denied: all of [${permissions.join(", ")}] required`);
  }
}

/**
 * Clear permission cache (useful after role/permission updates)
 */
export function clearPermissionCache(): void {
  // Clear all keys starting with role_permissions_
  // This is a simple implementation - in production you might want more sophisticated cache clearing
  CACHE.clear();
}

// ============================================================================
// CLIENT-SIDE PERMISSION HOOKS AND HELPERS
// ============================================================================

/**
 * Create a canView function for client-side use
 * This is an async function that checks permissions on the client
 * Usage: const canView = await createCanView(); then canView('users.view')
 */
export async function createCanView() {
  const session = await auth();
  if (!session) return () => false;
  
  const userRole = (session.user as { role?: string })?.role;
  if (!userRole) return () => false;
  
  // SuperAdmin has all permissions
  if (userRole === "SUPERADMIN") return () => true;
  
  // Get permissions for the role
  const permissions = await getRolePermissions(userRole);
  
  return (permission: string): boolean => {
    return permissions.includes(permission);
  };
}

/**
 * Check if current user can view a specific section/component
 * Convenience function for quick permission checks
 * 
 * Usage examples:
 * 
 * // In Server Components (direct import):
 * import { canView } from "@/lib/rbac";
 * const canUserView = await canView("users.view");
 * 
 * // In Client Components:
 * import { usePermission } from "@/lib/rbac";
 * const { canView } = usePermission();
 * if (canView("users.view")) { ... }
 */
export async function canView(permission: string): Promise<boolean> {
  return hasPermission(permission);
}
