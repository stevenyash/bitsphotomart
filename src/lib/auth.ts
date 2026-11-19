import NextAuth, { type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Extend the User type for our needs
interface AdminUser extends User {
  id: string;
  sub?: string;
  adminRole?: string;
  isSuperAdmin?: boolean;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const prismaModule = await import("@/lib/prisma");
        const prisma = prismaModule.prisma;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        // Try to check admin profile separately (may fail if table not properly set up)
        let adminProfile = null;
        try {
          adminProfile = await prisma.adminProfile.findUnique({
            where: { userId: user.id },
          });
          console.log(`[AUTH] adminProfile query result:`, adminProfile ? 'found' : 'not found');
        } catch (e) {
          console.error("[AUTH] Error fetching adminProfile:", e);
          // Continue without adminProfile - will use user role mapping
        }

        // Check if admin account is locked
        if (adminProfile?.lockedUntil && adminProfile.lockedUntil > new Date()) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          // Increment failed login attempts for admins if adminProfile exists
          if (adminProfile && user.role !== 'USER' && user.role !== 'PHOTOGRAPHER') {
            try {
              await prisma.adminProfile.update({
                where: { userId: user.id },
                data: {
                  failedLoginAttempts: { increment: 1 },
                  lockedUntil: adminProfile.failedLoginAttempts >= 4 
                    ? new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 minutes
                    : null,
                },
              });
            } catch (e) {
              console.error("Error updating failedLoginAttempts:", e);
            }
          }
          return null;
        }

        // Reset failed login attempts and update last login for admins if adminProfile exists
        if (adminProfile) {
          try {
            await prisma.adminProfile.update({
              where: { userId: user.id },
              data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
              },
            });
          } catch (e) {
            console.error("Error resetting failedLoginAttempts:", e);
          }
        }

        // Get admin role name if admin - first try adminProfile, then fall back to user role
        let adminRole: string | undefined;
        
        if (user.role === 'SUPERADMIN' || user.role === 'ADMIN' || 
            user.role === 'MANAGER' || user.role === 'FINANCE_MANAGER' ||
            user.role === 'MARKETER') {
          
          console.log(`[AUTH] User "${user.email}" has role: ${user.role}`);
          
          // First try to get from adminProfile
          try {
            const adminProfileWithRole = await prisma.adminProfile.findUnique({
              where: { userId: user.id },
              include: { adminRole: true },
            });
            
            console.log(`[AUTH] adminProfile found:`, adminProfileWithRole ? 'yes' : 'no');
            if (adminProfileWithRole) {
              console.log(`[AUTH] adminProfile.adminRole:`, adminProfileWithRole.adminRole);
            }
            
            if (adminProfileWithRole?.adminRole?.name) {
              adminRole = adminProfileWithRole.adminRole.name;
              console.log(`[AUTH] Got adminRole from profile: ${adminRole}`);
            } else if (adminProfileWithRole) {
              // AdminProfile exists but no AdminRole - use user role mapping
              adminRole = mapUserRoleToAdminRole(user.role);
              console.log(`[AUTH] No adminRole in profile, using mapped: ${adminRole}`);
            }
          } catch (e) {
            console.error("[AUTH] Error fetching adminProfile with role:", e);
          }
          
          // Fallback: if adminRole still undefined, map from user role directly
          if (!adminRole) {
            adminRole = mapUserRoleToAdminRole(user.role);
            console.log(`[AUTH] Using direct mapped role: ${adminRole}`);
          }
        }

        const returnUser: AdminUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          adminRole,
          isSuperAdmin: user.role === 'SUPERADMIN',
        };
        
        return returnUser;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const adminUser = user as AdminUser;
        const userId = adminUser.id || adminUser.sub;
        if (userId) {
          token.id = userId;
        }
        token.role = adminUser.role;
        token.adminRole = adminUser.adminRole;
        token.isSuperAdmin = adminUser.isSuperAdmin;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {};
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.adminRole = token.adminRole as string | undefined;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
      }
      return session;
    },
  },
  events: {},
  cookies: {
    sessionToken: {
      name: `${process.env.NEXTAUTH_COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production' ? '__Secure-' : ''}nextauth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // Use secure cookie only if HTTPS is enabled via env
        secure: process.env.NEXTAUTH_COOKIE_SECURE !== 'false',
      },
    },
  },
});

/**
 * Map user role to admin role name for RBAC
 * This ensures authentication works even without AdminProfile
 */
function mapUserRoleToAdminRole(userRole: string): string | undefined {
  const roleMapping: Record<string, string> = {
    'SUPERADMIN': 'SuperAdmin',
    'ADMIN': 'Admin',
    'MANAGER': 'Manager',
    'FINANCE_MANAGER': 'FinanceManager',
    'MARKETER': 'Marketer',
  };
  
  return roleMapping[userRole];
}
