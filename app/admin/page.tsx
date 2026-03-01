import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  Briefcase
} from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user as { role?: string })?.role;

  // Only admins can access
  if (userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-red-100 text-lg">
                Welcome, {session.user.name || session.user.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-100 rounded-xl">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-100 rounded-xl">
                <Image className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Photos</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-yellow-100 rounded-xl">
                <ShoppingCart className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Orders</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-100 rounded-xl">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Revenue</p>
                <p className="text-3xl font-bold text-gray-900">KES 0</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Management</h2>

        {/* Admin Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/photographers">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-amber-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-amber-100 rounded-xl">
                  <Camera className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Photographer Applications</h3>
              </div>
              <p className="text-gray-600 text-base">
                Review and approve photographer applications
              </p>
            </div>
          </Link>

          <Link href="/admin/users">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-blue-100 rounded-xl">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">User Management</h3>
              </div>
              <p className="text-gray-600 text-base">
                Manage users, photographers, and roles
              </p>
            </div>
          </Link>

          <Link href="/admin/photos">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-green-100 rounded-xl">
                  <Image className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Photo Management</h3>
              </div>
              <p className="text-gray-600 text-base">
                Approve, reject, or remove photos
              </p>
            </div>
          </Link>

          <Link href="/admin/orders">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-yellow-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-yellow-100 rounded-xl">
                  <ShoppingCart className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Orders</h3>
              </div>
              <p className="text-gray-600 text-base">
                View and manage all orders
              </p>
            </div>
          </Link>

          <Link href="/admin/payouts">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-purple-100 rounded-xl">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Payouts</h3>
              </div>
              <p className="text-gray-600 text-base">
                Process photographer payouts
              </p>
            </div>
          </Link>

          <Link href="/admin/analytics">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-indigo-100 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Analytics</h3>
              </div>
              <p className="text-gray-600 text-base">
                View platform statistics
              </p>
            </div>
          </Link>

          <Link href="/admin/settings">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-gray-100 rounded-xl">
                  <Settings className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Settings</h3>
              </div>
              <p className="text-gray-600 text-base">
                Platform settings and configuration
              </p>
            </div>
          </Link>

          <Link href="/admin/services">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-orange-100 rounded-xl">
                  <Video className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Services</h3>
              </div>
              <p className="text-gray-600 text-base">
                Manage service requests (documentary, videography)
              </p>
            </div>
          </Link>

          <Link href="/admin/bpm-services">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-violet-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-violet-100 rounded-xl">
                  <Briefcase className="h-8 w-8 text-violet-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">BPM Services</h3>
              </div>
              <p className="text-gray-600 text-base">
                Manage BPM services and their options
              </p>
            </div>
          </Link>

          <Link href="/admin/photo-editing">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-pink-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-pink-100 rounded-xl">
                  <Palette className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Photo Editing</h3>
              </div>
              <p className="text-gray-600 text-base">
                Manage photo editing requests
              </p>
            </div>
          </Link>

          <Link href="/admin/subscription-plans">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-cyan-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-cyan-100 rounded-xl">
                  <CreditCard className="h-8 w-8 text-cyan-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Subscriptions</h3>
              </div>
              <p className="text-gray-600 text-base">
                Manage subscription plans
              </p>
            </div>
          </Link>

          <Link href="/admin/promo-codes">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-rose-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-rose-100 rounded-xl">
                  <Percent className="h-8 w-8 text-rose-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Promo Codes</h3>
              </div>
              <p className="text-gray-600 text-base">
                Manage promotional discount codes
              </p>
            </div>
          </Link>

          <Link href="/admin/categories">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-teal-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-teal-100 rounded-xl">
                  <LinkIcon className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">BPM Linkages</h3>
              </div>
              <p className="text-gray-600 text-base">
                Manage BPM Linkages categories
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
