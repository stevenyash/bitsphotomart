"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      const session = await fetch('/api/auth/session').then(r => r.json());
      const userRole = session?.user?.role;

      if (userRole === 'MARKETER') {
        router.push('/dashboard/marketer');
      } else if (userRole === 'PHOTOGRAPHER') {
        router.push('/dashboard/photographer');
      } else if (userRole === 'USER') {
        router.push('/dashboard');
      } else {
        router.push('/admin');
      }
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-muted dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Camera className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-foreground">Bits Photo Mart</span>
          </Link>
        </div>

        {/* Login Form */}
        <div className="bg-card border border-border rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-center mb-6 text-foreground">Welcome Back</h1>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-4 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background text-foreground"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background text-foreground"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="rounded border-input" />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-primary hover:text-primary/70 dark:text-primary font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:text-primary/70 dark:text-primary font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials Info */}
        <div className="mt-6 p-4 bg-muted rounded-lg text-sm border border-border">
          <p className="font-medium mb-2">To test:</p>
          <ul className="space-y-1">
            <li>1. Register a new account</li>
            <li>2. Or use the registration page to create a user</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
