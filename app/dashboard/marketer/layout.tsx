'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
  Camera, 
  LayoutDashboard, 
  LogOut, 
  User,
  Users,
  TrendingUp,
  Settings
} from 'lucide-react';

export default function MarketerLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as { role?: string })?.role;
      if (userRole !== 'MARKETER') {
        router.push('/dashboard');
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard/marketer" className="flex items-center gap-2">
              <Camera className="h-8 w-8 text-pink-600" />
              <span className="font-bold text-lg text-foreground">Bits Photo Mart</span>
              <span className="ml-2 px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded-full font-medium">
                Marketer
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href="/dashboard/marketer" 
                className="flex items-center gap-1.5 text-foreground hover:text-pink-600 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link 
                href="/dashboard/marketer/referrals" 
                className="flex items-center gap-1.5 text-muted-foreground hover:text-pink-600 transition-colors"
              >
                <Users className="h-4 w-4" />
                Referrals
              </Link>
              <Link 
                href="/dashboard/marketer/analytics" 
                className="flex items-center gap-1.5 text-muted-foreground hover:text-pink-600 transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                Analytics
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-pink-600" />
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:inline">
                  {session?.user?.name || session?.user?.email}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-red-600 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
