"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2 } from "lucide-react";

export default function PhotographerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    bio: "",
    portfolio: "",
    location: "",
    skills: "",
    idNumber: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register-photographer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSuccess(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
        <div className="max-w-md w-full mx-4 p-8 bg-card border border-border rounded-lg shadow-xl text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Registration Submitted!</h2>
          <p className="text-muted-foreground mb-4">
            Your photographer application has been submitted and is pending approval.
          </p>
          <p className="text-sm text-primary">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Camera className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-foreground">Bits Photo Mart</span>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mt-6 mb-2">
            Become a <span className="text-primary">Photographer</span>
          </h1>
          <p className="text-muted-foreground">
            Join Bits Photo Mart as a professional photographer and start selling your work
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-2">
                Bio / About You *
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background text-foreground"
                placeholder="Tell clients about your photography experience and style..."
              />
            </div>

            <div>
              <label htmlFor="portfolio" className="block text-sm font-medium text-foreground mb-2">
                Portfolio URL
              </label>
              <Input
                id="portfolio"
                name="portfolio"
                type="url"
                value={formData.portfolio}
                onChange={handleChange}
                placeholder="https://yourportfolio.com"
                className="bg-background text-foreground"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                Town & County *
              </label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="e.g., Nairobi, Nairobi County"
                className="bg-background text-foreground"
              />
            </div>

            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-foreground mb-2">
                Skills *
              </label>
              <Input
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                required
                placeholder="Wedding, Portrait, Product, Event..."
                className="bg-background text-foreground"
              />
            </div>

            <div>
              <label htmlFor="idNumber" className="block text-sm font-medium text-foreground mb-2">
                National ID Number (for verification)
              </label>
              <Input
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="12345678"
                className="bg-background text-foreground"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Your ID is only used for verification purposes
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/70 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/register" className="text-muted-foreground hover:text-primary">
            ← Back to regular registration
          </Link>
        </div>
      </div>
    </div>
  );
}
