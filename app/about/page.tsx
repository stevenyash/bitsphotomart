import Link from "next/link";
import { Target, Search, Star, HandHeart, Lightbulb, Globe, User, Users, Zap, Sparkles, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: "About Us - Bits Photo Mart",
  description: "Learn about Bits Photo Mart, Kenya's premier creative media network connecting photographers, videographers, and documentary storytellers.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">About Bits Photo Mart</h1>
          <p className="text-xl opacity-90">Your Nationwide Creative Media Network</p>
        </div>
      </div>

      {/* Who We Are - From Brief */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--card)] rounded-2xl shadow-lg p-8 border border-[var(--border)]">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-6">Who We Are</h2>
            <p className="text-[var(--muted-foreground)] leading-relaxed text-lg">
              Bits Photo Mart is a digital media marketplace and production network designed to make it easier 
              for organisations to access reliable photographers, videographers, and documentary producers across Kenya. 
              We empower creative professionals with work opportunities while offering clients consistent quality 
              and nationwide coverage.
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Vision - From Brief */}
      <div className="py-16 px-4 bg-[var(--background)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="bg-[var(--card)] rounded-2xl shadow-lg p-8 border border-[var(--border)]">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-amber-600 dark:text-amber-300" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 text-center">Our Mission</h2>
              <p className="text-[var(--muted-foreground)] leading-relaxed text-center">
                "To build Africa's most trusted creative network, events coverage services and house 
                the largest library of authentic African visuals; all in one stop."
              </p>
            </div>

            {/* Vision */}
            <div className="bg-[var(--card)] rounded-2xl shadow-lg p-8 border border-[var(--border)]">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-purple-600 dark:text-purple-300" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 text-center">Our Vision</h2>
              <p className="text-[var(--muted-foreground)] leading-relaxed text-center">
                "A continent where creatives thrive, organisations tell better stories, and African imagery becomes globally accessible."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Values - From Brief */}
      <div className="py-16 px-4 bg-[var(--background)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-4">Our Core Values</h2>
            <p className="text-[var(--muted-foreground)]">The principles that guide everything we do</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-[var(--card)] rounded-2xl p-6 shadow-lg border border-[var(--border)] text-center">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Convenience</h3>
              <p className="text-[var(--muted-foreground)]">Easy access to creative services anywhere in Kenya.</p>
            </div>
            
            <div className="bg-[var(--card)] rounded-2xl p-6 shadow-lg border border-[var(--border)] text-center">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-7 h-7 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Innovativeness</h3>
              <p className="text-[var(--muted-foreground)]">We continuously evolve our platform and services.</p>
            </div>
            
            <div className="bg-[var(--card)] rounded-2xl p-6 shadow-lg border border-[var(--border)] text-center">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-7 h-7 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Excellence</h3>
              <p className="text-[var(--muted-foreground)]">Delivering professional quality in every project.</p>
            </div>

            <div className="bg-[var(--card)] rounded-2xl p-6 shadow-lg border border-[var(--border)] text-center">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-amber-600 dark:text-amber-300" />
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Fun</h3>
              <p className="text-[var(--muted-foreground)]">Making creativity enjoyable for everyone.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 px-4 bg-[var(--primary)] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">47+</div>
              <div className="text-amber-100">Counties Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-amber-100">Verified Creatives</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-amber-100">Stock Photos</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-amber-100">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* What We Offer */}
      <div className="py-16 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-4">What We Offer</h2>
            <p className="text-[var(--muted-foreground)]">Comprehensive creative media solutions for every need</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
              <Camera className="w-10 h-10 text-[var(--primary)] mb-4" />
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Photography Services</h3>
              <p className="text-[var(--muted-foreground)]">Professional photography for events, corporate, portraits, and more.</p>
            </div>
            
            <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
              <Video className="w-10 h-10 text-[var(--primary)] mb-4" />
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Videography</h3>
              <p className="text-[var(--muted-foreground)]">Documentary, event coverage, promotional videos, and cinematic productions.</p>
            </div>
            
            <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
              <Globe className="w-10 h-10 text-[var(--primary)] mb-4" />
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Stock Media</h3>
              <p className="text-[var(--muted-foreground)]">Access thousands of authentic African visuals for your marketing needs.</p>
            </div>
            
            <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
              <Users className="w-10 h-10 text-[var(--primary)] mb-4" />
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Creative Teams</h3>
              <p className="text-[var(--muted-foreground)]">On-demand teams for large-scale projects and thematic storytelling.</p>
            </div>
            
            <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
              <User className="w-10 h-10 text-[var(--primary)] mb-4" />
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Talent Booking</h3>
              <p className="text-[var(--muted-foreground)]">Connect with verified photographers, videographers, and content creators.</p>
            </div>
            
            <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
              <Sparkles className="w-10 h-10 text-[var(--primary)] mb-4" />
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Post-Production</h3>
              <p className="text-[var(--muted-foreground)]">Professional editing, color grading, and retouching services.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 px-4 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Register for Login</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join Kenya's fastest-growing creative media network. Whether you're looking to hire 
            creative professionals or want to offer your services, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/register" 
              className="px-8 py-3 bg-primary text-primary-foreground hover:opacity-90 font-semibold rounded-lg transition-colors"
            >
              Join Our Network
            </a>
            <a 
              href="/services" 
              className="px-8 py-3 bg-card text-foreground hover:bg-muted font-semibold rounded-lg transition-colors border border-border"
            >
              Explore Services
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function Camera({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  );
}

function Video({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="m22 8-6 4 6 4V8Z"/>
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
    </svg>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    </svg>
  );
}
