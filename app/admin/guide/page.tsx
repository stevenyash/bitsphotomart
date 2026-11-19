import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Users, Image, ShoppingCart, DollarSign, Settings, FileText, Activity, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Guide - Bits Photo Mart',
  description: 'Admin guide for managing Bits Photo Mart platform.',
};

export default function AdminGuidePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
      </div>

      {/* Header */}
      <div className="bg-[var(--admin-header)] border-b border-[var(--border)] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Admin Guide</h1>
              <p className="text-[var(--muted-foreground)]">Quick reference for platform management</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Admin Sections Overview */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Admin Sections
          </h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="pb-2 text-[var(--foreground)]">Section</th>
                <th className="pb-2 text-[var(--foreground)]">URL</th>
                <th className="pb-2 text-[var(--foreground)]">Description</th>
              </tr>
            </thead>
            <tbody className="text-[var(--muted-foreground)]">
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Main Dashboard</td>
                <td className="py-2"><Link href="/admin" className="text-primary hover:underline">/admin</Link></td>
                <td className="py-2">Overview and quick actions</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Analytics</td>
                <td className="py-2"><Link href="/admin/analytics" className="text-primary hover:underline">/admin/analytics</Link></td>
                <td className="py-2">Platform statistics</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Orders</td>
                <td className="py-2"><Link href="/admin/orders" className="text-primary hover:underline">/admin/orders</Link></td>
                <td className="py-2">View and process orders</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Photos</td>
                <td className="py-2"><Link href="/admin/photos" className="text-primary hover:underline">/admin/photos</Link></td>
                <td className="py-2">Moderate photo uploads</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Photographers</td>
                <td className="py-2"><Link href="/admin/photographers" className="text-primary hover:underline">/admin/photographers</Link></td>
                <td className="py-2">Manage photographer accounts</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Users</td>
                <td className="py-2"><Link href="/admin/users" className="text-primary hover:underline">/admin/users</Link></td>
                <td className="py-2">Manage registered users</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Blog</td>
                <td className="py-2"><Link href="/admin/blog" className="text-primary hover:underline">/admin/blog</Link></td>
                <td className="py-2">Manage blog posts</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Services</td>
                <td className="py-2"><Link href="/admin/services" className="text-primary hover:underline">/admin/services</Link></td>
                <td className="py-2">Configure service offerings</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Finance</td>
                <td className="py-2"><Link href="/admin/finance" className="text-primary hover:underline">/admin/finance</Link></td>
                <td className="py-2">Financial reports</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Payouts</td>
                <td className="py-2"><Link href="/admin/payouts" className="text-primary hover:underline">/admin/payouts</Link></td>
                <td className="py-2">Manage photographer payouts</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Categories</td>
                <td className="py-2"><Link href="/admin/categories" className="text-primary hover:underline">/admin/categories</Link></td>
                <td className="py-2">Photo categories</td>
              </tr>
              <tr>
                <td className="py-2">Settings</td>
                <td className="py-2"><Link href="/admin/settings" className="text-primary hover:underline">/admin/settings</Link></td>
                <td className="py-2">Platform settings</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* User Management */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            User Management
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Managing Regular Users</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
                <li>Go to <Link href="/admin/users" className="text-primary hover:underline">/admin/users</Link></li>
                <li>View all registered users</li>
                <li>Actions: View, Edit, Block, Delete</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Managing Photographers</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
                <li>Go to <Link href="/admin/photographers" className="text-primary hover:underline">/admin/photographers</Link></li>
                <li>View photographer profiles</li>
                <li>Actions: Approve, Verify, Suspend, View Portfolio</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Content Management */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Image className="w-6 h-6 text-primary" />
            Content Management
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Photo Moderation</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
                <li>Go to <Link href="/admin/photos" className="text-primary hover:underline">/admin/photos</Link></li>
                <li>Review uploaded photos</li>
                <li>Actions: Approve, Reject, Feature</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Blog Management</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
                <li>Go to <Link href="/admin/blog" className="text-primary hover:underline">/admin/blog</Link></li>
                <li>Create new posts or edit existing ones</li>
                <li>Publish or save as draft</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Service Configuration</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
                <li>Go to <Link href="/admin/services" className="text-primary hover:underline">/admin/services</Link></li>
                <li>Add/edit service offerings</li>
                <li>Set pricing tiers</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Orders & Payments */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Orders & Payments
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Processing Orders</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
                <li>Go to <Link href="/admin/orders" className="text-primary hover:underline">/admin/orders</Link></li>
                <li>View all orders</li>
                <li>Filter by status: Pending, Paid, Processing, Completed</li>
                <li>Update status as needed</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Managing Payouts</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
                <li>Go to <Link href="/admin/payouts" className="text-primary hover:underline">/admin/payouts</Link></li>
                <li>View payout requests</li>
                <li>Review photographer earnings</li>
                <li>Process payments via M-Pesa/PayPal</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Viewing Finance</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
                <li>Go to <Link href="/admin/finance" className="text-primary hover:underline">/admin/finance</Link></li>
                <li>View revenue reports</li>
                <li>Filter by date range</li>
                <li>Export reports</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Superadmin Functions */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            Superadmin Functions
          </h2>
          <p className="text-sm text-amber-400 mb-4">Note: These functions are only for Superadmin users</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Role Management</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
                <li>Go to <Link href="/admin/superadmin/roles" className="text-primary hover:underline">/admin/superadmin/roles</Link></li>
                <li>Create new roles</li>
                <li>Assign permissions to roles</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">User Administration</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
                <li>Go to <Link href="/admin/superadmin/users" className="text-primary hover:underline">/admin/superadmin/users</Link></li>
                <li>Create new admin users</li>
                <li>Assign roles</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Activity Logs</h3>
              <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
                <li>Go to <Link href="/admin/superadmin/activity-logs" className="text-primary hover:underline">/admin/superadmin/activity-logs</Link></li>
                <li>View all system activities</li>
                <li>Track user actions</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Quick Reference */}
        <section className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Quick Reference</h2>
          <table className="w-full text-left">
            <tbody className="text-[var(--muted-foreground)]">
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">View all orders</td>
                <td className="py-2"><Link href="/admin/orders" className="text-primary hover:underline">/admin/orders</Link></td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Approve photographer</td>
                <td className="py-2"><Link href="/admin/photographers" className="text-primary hover:underline">/admin/photographers</Link></td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Moderate photos</td>
                <td className="py-2"><Link href="/admin/photos" className="text-primary hover:underline">/admin/photos</Link></td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Create blog post</td>
                <td className="py-2"><Link href="/admin/blog" className="text-primary hover:underline">/admin/blog</Link></td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Add promo code</td>
                <td className="py-2"><Link href="/admin/promo-codes" className="text-primary hover:underline">/admin/promo-codes</Link></td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">Process payout</td>
                <td className="py-2"><Link href="/admin/payouts" className="text-primary hover:underline">/admin/payouts</Link></td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2">View revenue</td>
                <td className="py-2"><Link href="/admin/finance" className="text-primary hover:underline">/admin/finance</Link></td>
              </tr>
              <tr>
                <td className="py-2">Platform settings</td>
                <td className="py-2"><Link href="/admin/settings" className="text-primary hover:underline">/admin/settings</Link></td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
