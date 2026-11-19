import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Camera, CreditCard, User, Upload, Image, Video, DollarSign, HelpCircle, Mail, Phone, ArrowLeft } from 'lucide-react';
import { PricingSection } from './pricing-section';
import { ContactInfoDisplay } from '@/components/forms/contact-info-display';

export const metadata: Metadata = {
  title: 'User Guide - Bits Photo Mart',
  description: 'Learn how to use Bits Photo Mart - Kenya\'s premier creative media network.',
};

export default function UserGuidePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">User Guide</h1>
          <p className="text-xl opacity-90">Your quick guide to using Bits Photo Mart</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Book Our Services */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            Book Our Services
          </h2>
          <p className="text-[var(--muted-foreground)] mb-4">
            Need professional photography or videography? Here's how:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-[var(--foreground)]">
            <li>Visit <Link href="/services" className="text-primary hover:underline">Services</Link> page</li>
            <li>Choose your service type (Photography, Videography, Drone, Documentary)</li>
            <li>Click "Request Coverage" or "Request a Quote"</li>
            <li>Fill in your requirements</li>
            <li>Submit and wait for a quote</li>
          </ol>
        </section>

        {/* Our BPM Pricing */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Our BPM Pricing
          </h2>
          <PricingSection />
        </section>

        {/* Navigate to Gallery */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Image className="w-6 h-6 text-primary" />
            Navigate to Gallery
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-[var(--foreground)]">
            <li>Go to <Link href="/gallery" className="text-primary hover:underline">Gallery</Link></li>
            <li>Browse photos and videos</li>
            <li>Click on any item to view details</li>
          </ol>
        </section>

        {/* Purchasing Photos/Videos */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Purchasing Photos/Videos</h2>
          <ol className="list-decimal list-inside space-y-2 text-[var(--foreground)]">
            <li>Click on any photo to view details</li>
            <li>Select license type (Standard or Extended)</li>
            <li>Add to Cart or Buy Now</li>
            <li>Proceed to Checkout</li>
            <li>Choose payment method (M-Pesa, Stripe, or PayPal)</li>
            <li>Complete payment</li>
            <li>Download from your Dashboard</li>
          </ol>
        </section>

        {/* Payment Methods */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Payment Methods
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">M-Pesa (Kenya)</h3>
              <ol className="list-decimal list-inside text-sm text-[var(--muted-foreground)] mt-1">
                <li>Select M-Pesa at checkout</li>
                <li>Enter your phone number</li>
                <li>Receive STK push on your phone</li>
                <li>Enter PIN to confirm</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">Stripe (International)</h3>
              <ol className="list-decimal list-inside text-sm text-[var(--muted-foreground)] mt-1">
                <li>Select Stripe at checkout</li>
                <li>Enter card details</li>
                <li>Complete 3D secure verification</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">PayPal</h3>
              <ol className="list-decimal list-inside text-sm text-[var(--muted-foreground)] mt-1">
                <li>Select PayPal at checkout</li>
                <li>Login to your PayPal account</li>
                <li>Confirm payment</li>
              </ol>
            </div>
          </div>
        </section>

        {/* For Photographers */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            For Photographers
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Becoming a Photographer</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--foreground)]">
                <li>Register for a regular account first</li>
                <li>Visit <Link href="/register/photographer" className="text-primary hover:underline">Become a Photographer</Link></li>
                <li>Complete your photographer profile</li>
                <li>Submit for approval</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Uploading Photos</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--foreground)]">
                <li>Go to <Link href="/photographer/upload" className="text-primary hover:underline">Upload Photos</Link></li>
                <li>Select photos from your device</li>
                <li>Add details: Title, Description, Category, Tags</li>
                <li>Upload - photos will be reviewed before going live</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Uploading Videos</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--foreground)]">
                <li>Go to <Link href="/photographer/upload/video" className="text-primary hover:underline">Upload Videos</Link></li>
                <li>Select video files</li>
                <li>Add details: Title, Description, Resolution, Duration</li>
                <li>Upload for review</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Applying for Jobs</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--foreground)]">
                <li>Check <Link href="/photographer/jobs" className="text-primary hover:underline">Available Jobs</Link></li>
                <li>View job details</li>
                <li>Submit your application</li>
                <li>Track application status</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            Troubleshooting
          </h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="pb-2 text-[var(--foreground)]">Issue</th>
                <th className="pb-2 text-[var(--foreground)]">Solution</th>
              </tr>
            </thead>
            <tbody className="text-[var(--muted-foreground)]">
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Can't login</td>
                <td className="py-2">Check email/password, try "Forgot Password"</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Payment failed</td>
                <td className="py-2">Verify account details, try alternative payment</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Photos not showing</td>
                <td className="py-2">Check if approved by admin</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Can't upload</td>
                <td className="py-2">Ensure file format is supported (JPEG, PNG, MP4)</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Getting Help */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Getting Help</h2>
          <ContactInfoDisplay />
          <p className="mt-4 text-[var(--muted-foreground)]">Use the AI chatbot for instant answers</p>
        </section>

        {/* Quick Reference */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Quick Reference</h2>
          <table className="w-full text-left">
            <tbody className="text-[var(--foreground)]">
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Home</td>
                <td className="py-2"><Link href="/" className="text-primary hover:underline">/</Link></td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Services</td>
                <td className="py-2"><Link href="/services" className="text-primary hover:underline">/services</Link></td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Gallery</td>
                <td className="py-2"><Link href="/gallery" className="text-primary hover:underline">/gallery</Link></td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Client Dashboard</td>
                <td className="py-2"><Link href="/dashboard" className="text-primary hover:underline">/dashboard</Link></td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Photographer Dashboard</td>
                <td className="py-2"><Link href="/photographer" className="text-primary hover:underline">/photographer</Link></td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
