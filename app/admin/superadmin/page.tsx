'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { 
  Shield, 
  Users, 
  Settings, 
  Key, 
  Crown,
  UserCog,
  Layers,
  Activity,
  Database,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { theme } from "@/lib/admin-theme";

interface Stats {
  totalAdmins: number;
  totalRoles: number;
  totalPermissions: number;
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ totalAdmins: 0, totalRoles: 0, totalPermissions: 0 });
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [roleStatus, setRoleStatus] = useState<{ roles: Array<{ name: string; permissionCount: number }> } | null>(null);
  const statsFetched = useRef(false);

  // Handle authentication and role-based redirect
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    } else if (status === "authenticated" && session?.user) {
      const userRole = (session.user as { role?: string })?.role;
      if (userRole !== "SUPERADMIN") {
        router.push("/admin");
      }
    }
  }, [status, session, router]);

  // Fetch stats using async IIFE to avoid setState in effect body
  useEffect(() => {
    if (status === "authenticated" && session?.user && !statsFetched.current) {
      const userRole = (session.user as { role?: string })?.role;
      if (userRole === "SUPERADMIN") {
        statsFetched.current = true;
        
        // Using async IIFE pattern - the async function is defined and called immediately
        // but the setState happens in the callback, not synchronously in the effect body
        (async () => {
          try {
            const [rolesRes, usersRes] = await Promise.all([
              fetch("/api/admin/superadmin/roles"),
              fetch("/api/admin/users")
            ]);
            
            const roles = await rolesRes.json();
            const usersData = await usersRes.json();
            
            const permRes = await fetch("/api/admin/superadmin/users/permissions");
            const permData = await permRes.json();
            
            setStats({
              totalAdmins: Array.isArray(usersData) ? usersData.length : 0,
              totalRoles: Array.isArray(roles) ? roles.length : 0,
              totalPermissions: Array.isArray(permData?.availablePermissions) 
                ? permData.availablePermissions.length 
                : 0
            });
          } catch (error) {
            console.error("Error fetching stats:", error);
            statsFetched.current = false; // Reset on error to retry
          }
        })();
      }
    }
  }, [status, session]);

  const menuItems = [
    {
      title: "User Management",
      description: "Manage admin users and their access",
      icon: Users,
      href: "/admin/superadmin/users",
      color: "bg-primary dark:bg-primary"
    },
    {
      title: "Role Management",
      description: "Configure roles and their permissions",
      icon: Layers,
      href: "/admin/superadmin/roles",
      color: "bg-purple-500 dark:bg-purple-600"
    },
    {
      title: "Permission Management",
      description: "View and manage system permissions",
      icon: Key,
      href: "/admin/superadmin/permissions",
      color: "bg-green-500 dark:bg-green-600"
    },
    {
      title: "System Settings",
      description: "Global system configuration",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-orange-500 dark:bg-orange-600"
    },
    {
      title: "Activity Logs",
      description: "View admin activity logs",
      icon: Shield,
      href: "/admin/superadmin/activity-logs",
      color: "bg-indigo-500 dark:bg-indigo-600"
    }
  ];

  // Check database roles status
  const checkRoleStatus = async () => {
    try {
      const res = await fetch("/api/debug/roles");
      const data = await res.json();
      setRoleStatus(data);
    } catch (error) {
      console.error("Error checking roles:", error);
      setSeedMessage({ type: 'error', text: 'Failed to check roles status' });
    }
  };

  // Re-seed permissions and roles
  const handleReseed = async () => {
    if (!confirm("This will re-seed all permissions and roles. Existing roles will be updated. Continue?")) {
      return;
    }
    
    setSeeding(true);
    setSeedMessage(null);
    
    try {
      const res = await fetch("/api/admin/superadmin/permissions/reseed", {
        method: "POST",
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSeedMessage({ type: 'success', text: data.message || 'Seeding completed successfully!' });
        // Refresh stats
        checkRoleStatus();
      } else {
        setSeedMessage({ type: 'error', text: data.error || 'Seeding failed' });
      }
    } catch (error) {
      console.error("Error seeding:", error);
      setSeedMessage({ type: 'error', text: 'Failed to seed permissions and roles' });
    } finally {
      setSeeding(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  const userRole = (session?.user as { role?: string })?.role;
  if (userRole !== "SUPERADMIN") {
    return null;
  }

  return (
    <div className="p-6 min-h-screen bg-[var(--background)]">
      {/* Header - using theme variables */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">SuperAdmin Dashboard</h1>
          <p className="text-[var(--muted-foreground)]">System-wide administration and configuration</p>
        </div>
      </div>

      {/* Stats - using theme-based card styling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--card)] rounded-xl p-6 shadow-sm border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Total Admins</p>
              <p className="text-3xl font-bold text-[var(--foreground)]">{stats.totalAdmins}</p>
            </div>
            <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-xl p-6 shadow-sm border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Total Roles</p>
              <p className="text-3xl font-bold text-[var(--foreground)]">{stats.totalRoles}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Layers className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-xl p-6 shadow-sm border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Total Permissions</p>
              <p className="text-3xl font-bold text-[var(--foreground)]">{stats.totalPermissions}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Menu Grid - using theme-based styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item) => (
          <button
            key={item.title}
            onClick={() => router.push(item.href)}
            className="bg-[var(--card)] rounded-xl p-6 shadow-sm border border-[var(--border)] hover:shadow-md transition-all text-left group"
          >
            <div className={`p-3 ${item.color} rounded-lg mb-4 w-fit`}>
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-1 text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">{item.description}</p>
          </button>
        ))}
      </div>

      {/* Database Maintenance Section */}
      <div className="mt-8 bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <Database className="w-5 h-5 text-red-600 dark:text-red-300" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[var(--foreground)]">Database Maintenance</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Manage permissions and roles seeding</p>
          </div>
        </div>

        {/* Status Message */}
        {seedMessage && (
          <div className={`mb-4 p-3 rounded-lg ${seedMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'}`}>
            {seedMessage.text}
          </div>
        )}

        {/* Current Roles Status */}
        <div className="mb-4">
          <button
            onClick={checkRoleStatus}
            className="text-sm text-[var(--primary)] hover:underline mb-2"
          >
            Click to check current roles status
          </button>
          {roleStatus && (
            <div className="bg-[var(--background)] rounded-lg p-3 text-sm">
              <p className="font-medium mb-2">Current Roles in Database:</p>
              {roleStatus.roles && roleStatus.roles.length > 0 ? (
                <ul className="space-y-1">
                  {roleStatus.roles.map((role) => (
                    <li key={role.name} className="flex justify-between">
                      <span>{role.name}</span>
                      <span className="text-[var(--muted-foreground)]">{role.permissionCount} permissions</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  No roles found in database! Click Re-seed below.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleReseed}
            disabled={seeding}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {seeding ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Re-seed Permissions & Roles
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Access - using theme-based gradient */}
      <div className="mt-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2 text-white">Quick Actions</h3>
            <p className="text-slate-300">Common SuperAdmin tasks</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/admin/superadmin/users")}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-white"
            >
              <UserCog className="w-4 h-4" />
              Add Admin User
            </button>
            <button
              onClick={() => router.push("/admin/superadmin/roles")}
              className="px-4 py-2 bg-[var(--primary)] hover:opacity-90 rounded-lg transition-colors flex items-center gap-2 text-[var(--primary-foreground)]"
            >
              <Layers className="w-4 h-4" />
              Manage Roles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
