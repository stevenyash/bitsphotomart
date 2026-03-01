import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Image, 
  ShoppingCart, 
  Download,
  Heart,
  Clock,
  User,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user as { role?: string })?.role || "USER";

  // Redirect photographers to their own dashboard
  if (userRole === "PHOTOGRAPHER") {
    redirect("/photographer");
  }

  // Redirect admins to admin panel
  if (userRole === "ADMIN") {
    redirect("/admin");
  }

  // Regular user dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name || session.user.email}!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions for Regular Users */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link href="/dashboard/profile">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
              <User className="h-8 w-8" />
              <span className="text-lg">My Profile</span>
            </Button>
          </Link>

          <Link href="/gallery">
            <Button className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700">
              <Image className="h-8 w-8" />
              <span className="text-lg">Browse Photos</span>
            </Button>
          </Link>

          <Link href="/dashboard/orders">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
              <ShoppingCart className="h-8 w-8" />
              <span className="text-lg">My Orders</span>
            </Button>
          </Link>

          <Link href="/dashboard/downloads">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
              <Download className="h-8 w-8" />
              <span className="text-lg">My Downloads</span>
            </Button>
          </Link>
        </div>

        {/* Become a Photographer CTA */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Earn from Your Photography</h2>
          <p className="mb-4 opacity-90">
            Join our network of photographers and start selling your photos today!
          </p>
          <Link href="/register/photographer">
            <Button variant="secondary" className="bg-white text-amber-700 hover:bg-gray-100">
              Become a Photographer
            </Button>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-amber-600" />
              <div>
                <p className="font-medium">No orders yet</p>
                <p className="text-sm text-muted-foreground">Start browsing our photo collection</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Heart className="h-8 w-8 text-red-500" />
              <div>
                <p className="font-medium">No favorites yet</p>
                <p className="text-sm text-muted-foreground">Save photos you love for later</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium">No recent activity</p>
                <p className="text-sm text-muted-foreground">Your activity will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
