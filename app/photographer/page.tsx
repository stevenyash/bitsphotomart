import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Image, 
  Upload, 
  DollarSign, 
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
  Settings,
  BarChart3,
  Briefcase,
  Wallet,
  Video
} from "lucide-react";

async function getPhotographerData(userId: string) {
  // Get photographer profile
  const photographer = await prisma.photographer.findUnique({
    where: { userId },
    include: {
      photos: true,
      applications: {
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      payouts: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  if (!photographer) return null;

  // Get total sales count (from OrderItems where photo belongs to this photographer)
  const photoIds = photographer.photos.map(p => p.id);
  const salesCount = await prisma.orderItem.count({
    where: {
      photoId: { in: photoIds },
      order: {
        status: { in: ['PAID', 'COMPLETED'] }
      }
    }
  });

  // Get total earnings from completed payouts
  const totalEarnings = await prisma.payout.aggregate({
    where: {
      photographerId: photographer.id,
      status: 'COMPLETED'
    },
    _sum: {
      netAmount: true
    }
  });

  // Get pending payout amount
  const pendingPayouts = await prisma.payout.aggregate({
    where: {
      photographerId: photographer.id,
      status: { in: ['PENDING', 'PROCESSING'] }
    },
    _sum: {
      netAmount: true
    }
  });

  // Get average rating from reviews
  const reviews = await prisma.review.aggregate({
    where: { photographerId: photographer.id },
    _avg: { rating: true }
  });

  return {
    photographer,
    stats: {
      totalPhotos: photographer.photos.length,
      totalSales: salesCount,
      totalEarnings: totalEarnings._sum.netAmount?.toNumber() || 0,
      pendingPayouts: pendingPayouts._sum.netAmount?.toNumber() || 0,
      rating: reviews._avg.rating || 0
    }
  };
}

export default async function PhotographerDashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user as { role?: string })?.role || "USER";

  // Only allow photographers and admins
  if (userRole !== "PHOTOGRAPHER" && userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get photographer data
  const userId = session.user.id || '';
  const photographerData = userId ? await getPhotographerData(userId) : null;
  const photographer = photographerData?.photographer;
  const stats = photographerData?.stats || { totalPhotos: 0, totalSales: 0, totalEarnings: 0, pendingPayouts: 0, rating: 0 };

  // Check if photographer profile exists
  if (!photographer && userRole === "PHOTOGRAPHER") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <div className="bg-card p-8 rounded-xl border border-border text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Welcome, {session.user.name || session.user.email}!</h1>
          <p className="text-muted-foreground mb-6">You need to complete your photographer profile to access the dashboard.</p>
          <Link href="/register/photographer">
            <Button className="bg-primary text-primary-foreground hover:opacity-90">Complete Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPending = photographer?.status === "PENDING";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="bg-[var(--card)] border-b border-[var(--border)]">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Photographer Dashboard</h1>
          <p className="text-[var(--muted-foreground)]">
            Welcome back, {session.user.name || session.user.email}!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Status Banner */}
        {isPending && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-amber-600 dark:text-amber-400 font-medium">Your application is pending approval</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Image className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Total Photos</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats.totalPhotos}</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Total Sales</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats.totalSales}</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Total Earnings</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">KES {stats.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Rating</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats.rating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions for Photographers */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Link href="/photographer/upload">
            <Button className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)]">
              <Upload className="h-8 w-8" />
              <span className="text-lg">Upload Photos</span>
            </Button>
          </Link>

          <Link href="/photographer/upload/video">
            <Button className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:opacity-90">
              <Video className="h-8 w-8" />
              <span className="text-lg">Upload Video</span>
            </Button>
          </Link>

          <Link href="/photographer/photos">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]">
              <Image className="h-8 w-8" />
              <span className="text-lg">My Photos</span>
            </Button>
          </Link>

          <Link href="/photographer/orders">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]">
              <ShoppingCart className="h-8 w-8" />
              <span className="text-lg">Sales</span>
            </Button>
          </Link>

          <Link href="/photographer/analytics">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]">
              <BarChart3 className="h-8 w-8" />
              <span className="text-lg">Analytics</span>
            </Button>
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Job Applications */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-amber-500" />
              Available Jobs
            </h2>
            <div className="space-y-3">
              {photographer?.applications && photographer.applications.length > 0 ? (
                photographer.applications.map((job) => (
                  <div key={job.id} className="p-4 bg-[var(--muted)] rounded-lg">
                    <p className="text-[var(--foreground)] font-medium">{job.jobType}</p>
                    <p className="text-[var(--muted-foreground)] text-sm">{job.clientName} - {job.location}</p>
                    <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                      job.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                      job.status === 'ASSIGNED' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                      job.status === 'COMPLETED' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                      'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-[var(--muted)] rounded-lg">
                  <p className="text-[var(--foreground)] font-medium">No jobs available yet</p>
                  <p className="text-[var(--muted-foreground)] text-sm">Check back later for job opportunities</p>
                </div>
              )}
            </div>
            <Link href="/photographer/jobs" className="mt-4 block">
              <Button variant="outline" className="w-full border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]">
                View All Jobs
              </Button>
            </Link>
          </div>

          {/* Payout Requests */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-amber-500" />
              Earnings & Payouts
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-[var(--muted)] rounded-lg">
                <span className="text-[var(--muted-foreground)]">Available Balance</span>
                <span className="text-[var(--foreground)] font-bold">KES {stats.totalEarnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-[var(--muted)] rounded-lg">
                <span className="text-[var(--muted-foreground)]">Pending</span>
                <span className="text-[var(--foreground)] font-bold">KES {stats.pendingPayouts.toLocaleString()}</span>
              </div>
            </div>
            <Link href="/photographer/payout" className="mt-4 block">
              <Button className="w-full bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)]">
                Request Payout
              </Button>
            </Link>
          </div>
        </div>

        {/* Settings */}
        <div className="mt-8">
          <Link href="/photographer/settings">
            <Button variant="outline" className="border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]">
              <Settings className="h-4 w-4 mr-2" />
              Profile Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
