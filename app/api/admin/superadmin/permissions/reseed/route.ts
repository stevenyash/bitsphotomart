import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { seedPermissionsAndRoles } from "@/lib/permissions";
import { isSuperAdmin } from "@/lib/rbac";

// This endpoint re-seeds permissions and roles - useful after updates
// NOTE: Requires SuperAdmin user role OR a valid session with admin-level role
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin-level role (not permission - roles may not exist yet)
    const userRole = (session.user as { role?: string }).role;
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'FINANCE_MANAGER'].includes(userRole || '');
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - admin role required" }, { status: 403 });
    }

    await seedPermissionsAndRoles();
    
    return NextResponse.json({ 
      success: true, 
      message: "Permissions and roles re-seeded successfully" 
    });
  } catch (error) {
    console.error("Error re-seeding permissions:", error);
    return NextResponse.json({ error: "Failed to seed permissions" }, { status: 500 });
  }
}
