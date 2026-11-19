"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2, Gift, CheckCircle } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [verifyingRef, setVerifyingRef] = useState(false);

  useEffect(() => {
    if (referralCode) {
      setVerifyingRef(true);
      fetch(`/api/auth/verify-ref?code=${referralCode}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid && data.marketer) {
            setReferredBy(data.marketer.user.name || data.marketer.user.email);
          }
        })
        .catch(console.error)
        .finally(() => setVerifyingRef(false));
    }
  }, [referralCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          referralCode: referralCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/login?registered=true&referred=" + (data.referred ? "true" : "false"));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-muted dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Camera className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-foreground">Bits Photo Mart</span>
          </Link>
        </div>

        {(referralCode || verifyingRef) && (
          <div className="bg-accent border border-accent-foreground/20 rounded-lg p-4 mb-6">
            {verifyingRef ? (
              <div className="flex items-center gap-2 text-pink-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying referral code...</span>
              </div>
            ) : referredBy ? (
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>You're being referred by <strong>{referredBy}</strong></span>
              </div>
            ) : (
              <div className="text-pink-600">
                <Gift className="w-5 h-5 inline mr-2" />
                Special offer applied!
              </div>
            )}
          </div>
        )}

        <div className="bg-card border border-border rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-center mb-6 text-foreground">Create Account</h1>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-4 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 text-foreground">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-background text-foreground"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-background text-foreground"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1 text-foreground">
                Phone Number (Optional)
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+254 7XX XXX XXX"
                value={formData.phone}
                onChange={handleChange}
                className="bg-background text-foreground"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-foreground">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                className="bg-background text-foreground"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-foreground">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="bg-background text-foreground"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/70 dark:text-primary font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg text-sm border border-border">
          <p className="font-medium">
            Join Bits Photo Mart
          </p>
          <p className="mt-1">
            Register to buy photos, hire photographers, or sell your creative work.
          </p>
          <p className="mt-3">
            Are you a photographer?{" "}
            <Link href="/register/photographer" className="font-medium text-primary hover:underline">
              Register as a photographer →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterFormFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-muted dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Camera className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-foreground">Bits Photo Mart</span>
          </Link>
        </div>
        <div className="bg-card border border-border rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFormFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
