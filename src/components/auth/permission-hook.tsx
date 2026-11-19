"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Hook for checking permissions in client components
 * 
 * Usage:
 * const { canView, isLoading } = usePermission();
 * 
 * if (canView('users.view')) {
 *   // Show user management
 * }
 */
export function usePermission() {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      if (status === "unauthenticated") {
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      if (status === "loading") {
        return;
      }

      const userRole = (session?.user as { role?: string })?.role;
      
      // SuperAdmin has all permissions
      if (userRole === "SUPERADMIN") {
        try {
          const allPerms = await prisma.permission.findMany({
            select: { name: true },
          });
          setPermissions(allPerms.map(p => p.name));
        } catch (error) {
          console.error("Error fetching all permissions:", error);
          setPermissions([]);
        }
        setIsLoading(false);
        return;
      }

      if (!userRole) {
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      try {
        const role = await prisma.adminRole.findUnique({
          where: { name: userRole },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        });

        if (role?.isSuperRole) {
          // Also get all permissions for super role
          const allPerms = await prisma.permission.findMany({
            select: { name: true },
          });
          setPermissions(allPerms.map(p => p.name));
        } else {
          setPermissions(role?.permissions.map(p => p.permission.name) || []);
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
        setPermissions([]);
      }

      setIsLoading(false);
    }

    fetchPermissions();
  }, [session, status]);

  /**
   * Check if the current user has a specific permission
   */
  const canView = (permission: string): boolean => {
    if (isLoading) return false;
    return permissions.includes(permission);
  };

  /**
   * Check if the current user has any of the specified permissions
   */
  const canViewAny = (perms: string[]): boolean => {
    if (isLoading) return false;
    return perms.some(p => permissions.includes(p));
  };

  /**
   * Check if the current user has all of the specified permissions
   */
  const canViewAll = (perms: string[]): boolean => {
    if (isLoading) return false;
    return perms.every(p => permissions.includes(p));
  };

  return {
    canView,
    canViewAny,
    canViewAll,
    isLoading,
    permissions,
  };
}
