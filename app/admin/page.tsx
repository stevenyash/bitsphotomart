import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminMenuItems, getFinanceMenuItems, canView } from "@/lib/rbac";
import { 
  Users, 
  Image, 
  ShoppingCart, 
  DollarSign,
  Settings,
  BarChart3,
  Shield,
  Camera,
  CreditCard,
  Video,
  Palette,
  Percent,
  Link as LinkIcon,
  Briefcase,
  Cloud,
  Wallet,
  FileText,
  Folder,
  List,
  Building,
  Repeat,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  Undo2,
  UserCog,
  BookOpen
} from "lucide-react";

// Icon mapping for dynamic menu items
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Image, ShoppingCart, DollarSign, Settings, BarChart3, Shield,
  Camera, CreditCard, Video, Palette, Percent, Link: LinkIcon, Briefcase,
  Cloud, Wallet, FileText, Folder, List, Building, Repeat, MessageSquare,
  TrendingUp, RefreshCw, Undo2, UserCog, BookOpen
};

export default async function AdminPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user as { role?: string })?.role;

  // Only allow proper admin roles (not Marketer - they have separate dashboard)
  const adminRoles = ["ADMIN", "SUPERADMIN", "MANAGER", "FINANCE_MANAGER"];
  if (!userRole || !adminRoles.includes(userRole)) {
    redirect("/dashboard");
  }

  // Check permissions using canView() - the single source of truth
  const showFinance = await canView('revenue.view');

  // Get dynamic menu items from database permissions
  const menuItems = await getAdminMenuItems();
  const financeMenuItems = await getFinanceMenuItems();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header - using theme variables for consistent styling */}
      <div className="bg-[var(--admin-header)] border-b border-[var(--border)] shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--primary)] rounded-lg">
              <Shield className="h-8 w-8 text-[var(--primary-foreground)]" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Admin Panel</h1>
              <p className="text-[var(--muted-foreground)] text-lg">
                Welcome, {session.user.name || session.user.email}
              </p>
            </div>
            {showFinance && (
              <Link 
                href="/admin/finance"
                className="flex items-center gap-2 bg-[var(--primary)] hover:opacity-90 px-4 py-2 rounded-lg transition-opacity text-[var(--primary-foreground)]"
              >
                <Wallet className="h-5 w-5" />
                <span className="font-medium text-[var(--primary-foreground)]">Finance</span>
              </Link>
            )}
            <Link 
              href="/admin/guide"
              className="flex items-center gap-2 bg-[var(--card)] hover:bg-muted px-4 py-2 rounded-lg transition-colors text-[var(--foreground)] border border-[var(--border)]"
            >
              <BookOpen className="h-5 w-5" />
              <span className="font-medium">Guide</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Admin Stats - using theme-based card styling */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--card)] p-6 rounded-xl shadow-sm border border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-xl">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">Total Users</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">0</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] p-6 rounded-xl shadow-sm border border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-xl">
                <Image className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">Photos</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">0</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] p-6 rounded-xl shadow-sm border border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-xl">
                <ShoppingCart className="h-8 w-8 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">Orders</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">0</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] p-6 rounded-xl shadow-sm border border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-xl">
                <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)] font-medium">Revenue</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">KES 0</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">Management</h2>

        {/* Dynamic Admin Menu - Based on Database Permissions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const IconComponent = iconMap[item.icon] || Shield;
            return (
              <Link key={item.href} href={item.href}>
                <div className="bg-[var(--card)] p-6 rounded-xl shadow-sm border border-[var(--border)] hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-200 cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-amber-100 dark:bg-amber-900 rounded-xl">
                      <IconComponent className="h-8 w-8 text-amber-600 dark:text-amber-300" />
                    </div>
                    <h3 className="font-bold text-xl text-[var(--foreground)]">{item.name}</h3>
                  </div>
                  <p className="text-[var(--muted-foreground)] text-base">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Finance Menu - Only for Finance Managers and SuperAdmins */}
        {financeMenuItems.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 mt-12">Finance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {financeMenuItems.map((item) => {
                const IconComponent = iconMap[item.icon] || DollarSign;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className="bg-[var(--card)] p-6 rounded-xl shadow-sm border border-[var(--border)] hover:shadow-md hover:border-green-300/30 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 bg-green-100 dark:bg-green-900 rounded-xl">
                          <IconComponent className="h-8 w-8 text-green-600 dark:text-green-300" />
                        </div>
                        <h3 className="font-bold text-xl text-[var(--foreground)]">{item.name}</h3>
                      </div>
                      <p className="text-[var(--muted-foreground)] text-base">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Legacy menu items - now replaced by dynamic RBAC menu
 * Handled by getAdminMenuItems() from @/lib/rbac
 */
