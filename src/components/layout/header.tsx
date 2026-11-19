"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CartIcon } from "@/components/cart/cart-icon";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { Menu, X, Camera, LogOut, User, LayoutDashboard } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ redirectTo: "/" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-hidden">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4">
        {/* Mobile: Menu Button (left on mobile) */}
        <button
          className="md:hidden p-2 -ml-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <span className="text-sm sm:text-xl font-bold truncate max-w-[100px] sm:max-w-[180px]">Bits Photo Mart</span>
        </Link>

        {/* Desktop Navigation - shows on md (768px) and up */}
        <nav className="hidden md:flex items-center gap-2 xl:gap-4">
          <Link href="/gallery" className="text-xs xl:text-sm font-medium transition-colors hover:text-primary">
            Gallery
          </Link>
          <Link href="/services" className="text-xs xl:text-sm font-medium transition-colors hover:text-primary">
            Services
          </Link>
          <Link href="/documentary" className="text-xs xl:text-sm font-medium transition-colors hover:text-primary">
            Documentary
          </Link>
          <Link href="/photo-editing" className="text-xs xl:text-sm font-medium transition-colors hover:text-primary">
            Photo Editing
          </Link>
          <Link href="/for-creatives" className="text-xs xl:text-sm font-medium transition-colors hover:text-primary">
            For Creatives
          </Link>
          <Link href="/blog" className="text-xs xl:text-sm font-medium transition-colors hover:text-primary">
            Blog
          </Link>
          <Link href="/about" className="text-xs xl:text-sm font-medium transition-colors hover:text-primary">
            About
          </Link>
          <Link href="/contact" className="text-xs xl:text-sm font-medium transition-colors hover:text-primary">
            Contact
          </Link>
        </nav>

        {/* Desktop Auth - Logged In */}
        {session ? (
          <div className="hidden md:flex items-center gap-2 xl:gap-4">
            <NotificationDropdown />
            <CartIcon />
            {(session.user as { role?: string })?.role === "PHOTOGRAPHER" ? (
              <Link href="/photographer">
                <Button variant="ghost" size="sm" className="text-xs xl:text-sm">
                  <LayoutDashboard className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
                  <span className="hidden lg:inline">Dashboard</span>
                </Button>
              </Link>
            ) : (session.user as { role?: string })?.role === "CORPORATE" ? (
              <Link href="/bpm-linkages/dashboard">
                <Button variant="ghost" size="sm" className="text-xs xl:text-sm">
                  <LayoutDashboard className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
                  <span className="hidden lg:inline">Dashboard</span>
                </Button>
              </Link>
            ) : (session.user as { role?: string })?.role === "MANAGER" ? (
              <Link href="/manager">
                <Button variant="ghost" size="sm" className="text-xs xl:text-sm">
                  <LayoutDashboard className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
                  <span className="hidden lg:inline">Dashboard</span>
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-xs xl:text-sm">
                  <LayoutDashboard className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
                  <span className="hidden lg:inline">Dashboard</span>
                </Button>
              </Link>
            )}
            {(session.user as { role?: string })?.role === "ADMIN" && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-xs xl:text-sm">Admin</Button>
              </Link>
            )}
            <Link href="/dashboard/profile">
              <Button variant="ghost" size="sm" className="text-xs xl:text-sm hidden lg:flex">
                <User className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
                Profile
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs xl:text-sm">
              <LogOut className="h-3 w-3 xl:h-4 xl:w-4 mr-1" />
              <span className="hidden lg:inline">Logout</span>
            </Button>
          </div>
        ) : (
          /* Desktop Auth - Logged Out */
          <div className="hidden md:flex items-center gap-2 xl:gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs xl:text-sm">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-xs xl:text-sm">Register for Login</Button>
            </Link>
          </div>
        )}

        {/* Mobile: Cart & Notifications (right side on mobile) */}
        <div className="flex md:hidden items-center gap-1">
          <CartIcon />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto p-4 flex flex-col gap-4">
            <Link 
              href="/gallery" 
              className="text-sm font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Gallery
            </Link>
            <Link 
              href="/services" 
              className="text-sm font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            <Link 
              href="/for-creatives" 
              className="text-sm font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              For Creatives
            </Link>
            <Link 
              href="/blog" 
              className="text-sm font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <Link 
              href="/about" 
              className="text-sm font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              href="/documentary" 
              className="text-sm font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Documentary
            </Link>
            <Link 
              href="/photo-editing" 
              className="text-sm font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Photo Editing
            </Link>
            <Link 
              href="/contact" 
              className="text-sm font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <hr className="my-2" />
            {!session ? (
              <>
                <Link href="/login" className="text-sm font-medium py-2">
                  Login
                </Link>
                <Link href="/register" className="text-sm font-medium py-2">
                  Register for Login
                </Link>
              </>
            ) : (
              <Link href="/dashboard" className="text-sm font-medium py-2">
                Dashboard
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
