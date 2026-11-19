import { prisma } from '@/lib/prisma';

/**
 * Available permission categories
 */
export const PERMISSION_CATEGORIES = [
  'users',
  'admins',
  'content',
  'orders',
  'payments',
  'payouts',
  'revenue',
  'reversals',
  'photographers',
  'services',
  'corporate',
  'analytics',
  'settings',
  'promocodes',
  'subscriptions',
  'messages',
] as const;

export type PermissionCategory = typeof PERMISSION_CATEGORIES[number];

/**
 * Default system permissions for role-based access control
 */
export const DEFAULT_PERMISSIONS = [
  // User Management
  { name: 'users.view', description: 'View user list and details', category: 'users' },
  { name: 'users.create', description: 'Create new users', category: 'users' },
  { name: 'users.update', description: 'Update user information', category: 'users' },
  { name: 'users.delete', description: 'Delete users', category: 'users' },
  { name: 'users.assign_roles', description: 'Assign roles to users', category: 'users' },
  
  // Admin Management (SuperAdmin only)
  { name: 'admins.manage', description: 'Manage admin accounts', category: 'admins' },
  { name: 'admins.roles', description: 'Manage admin roles and permissions', category: 'admins' },
  { name: 'admins.activity', description: 'View admin activity logs', category: 'admins' },
  
  // Content Management
  { name: 'content.photos.view', description: 'View photos', category: 'content' },
  { name: 'content.photos.approve', description: 'Approve/reject photos', category: 'content' },
  { name: 'content.photos.delete', description: 'Delete photos', category: 'content' },
  { name: 'content.videos.view', description: 'View videos', category: 'content' },
  { name: 'content.videos.approve', description: 'Approve/reject videos', category: 'content' },
  { name: 'content.videos.delete', description: 'Delete videos', category: 'content' },
  { name: 'content.blog.manage', description: 'Manage blog posts', category: 'content' },
  { name: 'content.categories.manage', description: 'Manage categories', category: 'content' },
  { name: 'content.media.manage', description: 'Manage media library', category: 'content' },
  
  // Orders & Payments
  { name: 'orders.view', description: 'View orders', category: 'orders' },
  { name: 'orders.manage', description: 'Manage orders', category: 'orders' },
  { name: 'orders.verify', description: 'Verify manual payments', category: 'orders' },
  { name: 'payments.view', description: 'View payment records', category: 'payments' },
  { name: 'payments.refund', description: 'Process refunds', category: 'payments' },
  
  // Payouts
  { name: 'payouts.view', description: 'View payout requests', category: 'payouts' },
  { name: 'payouts.approve', description: 'Approve payout requests', category: 'payouts' },
  { name: 'payouts.reject', description: 'Reject payout requests', category: 'payouts' },
  { name: 'payouts.process', description: 'Process payout transactions', category: 'payouts' },
  
  // Revenue & Profits
  { name: 'revenue.view', description: 'View revenue reports', category: 'revenue' },
  { name: 'revenue.export', description: 'Export revenue data', category: 'revenue' },
  { name: 'profits.view', description: 'View profit reports', category: 'revenue' },
  { name: 'profits.export', description: 'Export profit data', category: 'revenue' },
  { name: 'transactions.view', description: 'View all transactions', category: 'revenue' },
  { name: 'transactions.export', description: 'Export transaction data', category: 'revenue' },
  
  // Reversals
  { name: 'reversals.view', description: 'View payment reversals', category: 'reversals' },
  { name: 'reversals.process', description: 'Process payment reversals', category: 'reversals' },
  
  // Photographers
  { name: 'photographers.view', description: 'View photographers', category: 'photographers' },
  { name: 'photographers.approve', description: 'Approve photographers', category: 'photographers' },
  { name: 'photographers.suspend', description: 'Suspend photographers', category: 'photographers' },
  { name: 'photographers.payouts', description: 'Manage photographer payouts', category: 'photographers' },
  
  // Services
  { name: 'services.manage', description: 'Manage BPM services', category: 'services' },
  { name: 'services.requests', description: 'View service requests', category: 'services' },
  { name: 'services.editing.manage', description: 'Manage photo editing requests', category: 'services' },
  
  // Corporate Accounts
  { name: 'corporate.view', description: 'View corporate accounts', category: 'corporate' },
  { name: 'corporate.manage', description: 'Manage corporate accounts', category: 'corporate' },
  
  // Analytics
  { name: 'analytics.view', description: 'View analytics dashboard', category: 'analytics' },
  { name: 'analytics.export', description: 'Export analytics data', category: 'analytics' },
  
  // Settings (SuperAdmin only)
  { name: 'settings.platform', description: 'Manage platform settings', category: 'settings' },
  { name: 'settings.fees', description: 'Manage fee percentages', category: 'settings' },
  { name: 'settings.payment', description: 'Manage payment settings', category: 'settings' },
  { name: 'settings.email', description: 'Manage email templates', category: 'settings' },
  
  // Promo Codes
  { name: 'promocodes.manage', description: 'Manage promo codes', category: 'promocodes' },
  
  // Subscriptions
  { name: 'subscriptions.manage', description: 'Manage subscription plans', category: 'subscriptions' },
  
  // Messages
  { name: 'messages.view', description: 'View user messages', category: 'messages' },
  { name: 'messages.manage', description: 'Manage user messages', category: 'messages' },
];

/**
 * Default admin roles
 */
export const DEFAULT_ADMIN_ROLES = [
  {
    name: 'SuperAdmin',
    description: 'Full system access with all permissions',
    isDefault: false,
    isSuperRole: true,
    permissions: [] as string[], // SuperAdmin gets all permissions
  },
  {
    name: 'Admin',
    description: 'Standard administrator WITHOUT user management access',
    isDefault: true,
    isSuperRole: false,
    permissions: [
      // NOTE: Standard Admin does NOT have user management permissions
      // User management is reserved for SuperAdmin only
      'content.photos.view', 'content.photos.approve', 'content.photos.delete',
      'content.videos.view', 'content.videos.approve', 'content.videos.delete',
      'content.blog.manage', 'content.categories.manage', 'content.media.manage',
      'orders.view', 'orders.manage', 'orders.verify',
      'payments.view',
      'photographers.view', 'photographers.approve', 'photographers.suspend',
      'photographers.payouts',
      'services.manage', 'services.requests', 'services.editing.manage',
      'corporate.view', 'corporate.manage',
      'analytics.view', 'analytics.export',
      'promocodes.manage',
      'subscriptions.manage',
      'messages.view', 'messages.manage',
    ],
  },
  {
    name: 'Manager',
    description: 'Content and order management',
    isDefault: false,
    isSuperRole: false,
    permissions: [
      'content.photos.view', 'content.photos.approve',
      'content.videos.view', 'content.videos.approve',
      'content.blog.manage', 'content.categories.manage',
      'orders.view', 'orders.manage', 'orders.verify',
      'photographers.view', 'photographers.approve',
      'services.requests',
      'analytics.view',
      'messages.view',
    ],
  },
  {
    name: 'FinanceManager',
    description: 'Financial operations and payouts',
    isDefault: false,
    isSuperRole: false,
    permissions: [
      'orders.view',
      'payments.view', 'payments.refund',
      'payouts.view', 'payouts.approve', 'payouts.reject', 'payouts.process',
      'revenue.view', 'revenue.export',
      'profits.view', 'profits.export',
      'transactions.view', 'transactions.export',
      'reversals.view', 'reversals.process',
      'photographers.payouts',
      'analytics.view', 'analytics.export',
      'corporate.view',
    ],
  },
  {
    name: 'Marketer',
    description: 'Marketing partner - can view referred users and their activity',
    isDefault: false,
    isSuperRole: false,
    permissions: [
      'users.view',
      'photographers.view',
      'orders.view',
      'analytics.view',
    ],
  },
  {
    name: 'Support',
    description: 'Customer support and basic content moderation',
    isDefault: false,
    isSuperRole: false,
    permissions: [
      'users.view',
      'content.photos.view', 'content.photos.approve',
      'content.videos.view', 'content.videos.approve',
      'orders.view',
      'photographers.view',
      'services.requests',
      'messages.view', 'messages.manage',
    ],
  },
];

/**
 * Seed permissions and admin roles
 */
export async function seedPermissionsAndRoles() {
  console.log('Seeding permissions and admin roles...');
  
  // Create permissions
  const createdPermissions = await Promise.all(
    DEFAULT_PERMISSIONS.map(async (perm) => {
      return prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      });
    })
  );
  
  console.log(`Created ${createdPermissions.length} permissions`);
  
  // Create admin roles with permissions
  for (const roleData of DEFAULT_ADMIN_ROLES) {
    const permissions = roleData.permissions;
    const { permissions: _perms, ...roleInfo } = roleData;
    
    const role = await prisma.adminRole.upsert({
      where: { name: roleData.name },
      update: {
        description: roleInfo.description,
        isDefault: roleInfo.isDefault,
        isSuperRole: roleInfo.isSuperRole,
      },
      create: roleInfo,
    });
    
    // If it's the SuperAdmin role, give it all permissions
    const permissionNames = role.isSuperRole 
      ? DEFAULT_PERMISSIONS.map(p => p.name)
      : permissions;
    
    // IMPORTANT: Clear existing permissions first to handle updates properly
    await prisma.adminRolePermission.deleteMany({
      where: { adminRoleId: role.id },
    });
    
    // Connect permissions to role
    const permConnections = await Promise.all(
      permissionNames.map(async (permName) => {
        const perm = createdPermissions.find(p => p.name === permName);
        if (!perm) return null;
        
        return prisma.adminRolePermission.create({
          data: {
            adminRoleId: role.id,
            permissionId: perm.id,
          },
        });
      })
    );
    
    console.log(`Synced role: ${role.name} with ${permissionNames.length} permissions`);
  }
  
  console.log('Seeding completed!');
}

/**
 * Get all permissions
 */
export async function getAllPermissions() {
  return prisma.permission.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
}

/**
 * Get permissions grouped by category
 */
export async function getPermissionsByCategory() {
  const permissions = await getAllPermissions();
  
  return permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);
}

/**
 * Get all admin roles
 */
export async function getAllAdminRoles() {
  return prisma.adminRole.findMany({
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: {
        select: { admins: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
  
  if (!user) return false;
  
  // SuperAdmin role has all permissions
  if (user.adminProfile?.adminRole?.isSuperRole) {
    return true;
  }
  
  // Check specific permission
  const permissions = user.adminProfile?.adminRole?.permissions || [];
  return permissions.some(p => p.permission.name === permissionName);
}

/**
 * Get user permissions
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
  
  if (!user) return [];
  
  // SuperAdmin role has all permissions
  if (user.adminProfile?.adminRole?.isSuperRole) {
    const allPerms = await prisma.permission.findMany();
    return allPerms.map(p => p.name);
  }
  
  // Get specific permissions
  const permissions = user.adminProfile?.adminRole?.permissions || [];
  return permissions.map(p => p.permission.name);
}

// Run if called directly or for initialization
if (require.main === module || process.env.RUN_SEED === 'true') {
  seedPermissionsAndRoles()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

/**
 * Initialize permissions on app startup (one-time)
 * This ensures the database has the correct roles and permissions
 * 
 * NOTE: By default, this only runs in development mode.
 * In production, run the API endpoint manually: POST /api/admin/superadmin/permissions/reseed
 */
let initialized = false;

export async function initializePermissions(force: boolean = false) {
  // Only run automatically in development mode, or if force is true
  if (!force && process.env.NODE_ENV === 'production') {
    console.log('Skipping automatic permission initialization in production');
    return;
  }

  // Prevent multiple simultaneous initialization attempts
  if (initialized && !force) {
    return;
  }
  
  // Check if permissions AND roles already exist
  try {
    const existingPermsCount = await prisma.permission.count();
    const existingRolesCount = await prisma.adminRole.count();
    
    console.log(`[PERMISSIONS] Permissions count: ${existingPermsCount}, Roles count: ${existingRolesCount}`);
    
    // If both exist, skip seeding
    if (existingPermsCount > 0 && existingRolesCount > 0 && !force) {
      console.log('Permissions and roles already initialized, skipping seed...');
      initialized = true;
      return;
    }
    
    // If only permissions exist but not roles, we need to seed roles
    if (existingPermsCount > 0 && existingRolesCount === 0) {
      console.log('[PERMISSIONS] Permissions exist but roles are missing, seeding roles...');
    }
    
    // Mark as initialized before seeding to prevent race conditions
    initialized = true;
    console.log('Initializing permissions and roles...');
    await seedPermissionsAndRoles();
  } catch (error) {
    console.error('Error initializing permissions:', error);
    initialized = false; // Allow retry on error
  }
}
