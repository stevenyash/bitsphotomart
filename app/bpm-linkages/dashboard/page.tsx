'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  CreditCard, 
  Settings, 
  TrendingUp,
  Download,
  Plus,
  Mail,
  Phone,
  MapPin,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface CorporateAccount {
  id: string;
  companyName: string;
  industry: string;
  contactPerson: string;
  jobTitle: string;
  phone?: string;
  address?: string;
  subscriptionTier: string;
  status: string;
  billingEmail?: string;
  createdAt: string;
  teamMembers?: TeamMember[];
  licenses?: License[];
  orders?: Order[];
  usageStats?: UsageStats;
}

interface TeamMember {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface License {
  id: string;
  licenseType: string;
  scope?: string;
  seats: number;
  expiresAt?: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

interface UsageStats {
  downloadsLast30Days: number;
  totalLicenses: number;
  ordersLast30Days: number;
}

export default function CorporateDashboardPage() {
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      const res = await fetch('/api/corporate-accounts');
      if (res.ok) {
        const data = await res.json();
        setAccount(data);
      } else if (res.status === 404) {
        setError('No corporate account found. Apply for a corporate account first.');
      } else {
        setError('Failed to load account details');
      }
    } catch (err) {
      setError('An error occurred while loading your account');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-700';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'ENTERPRISE':
        return 'bg-purple-100 text-purple-700';
      case 'PREMIUM':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Account Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/bpm-linkages"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Apply for Corporate Account
          </Link>
        </div>
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Building2 className="w-8 h-8" />
                {account.companyName}
              </h1>
              <p className="text-blue-200 mt-1">{account.industry} • Corporate Account</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full font-medium ${getStatusColor(account.status)}`}>
                {account.status}
              </span>
              <span className={`px-4 py-2 rounded-full font-medium ${getTierBadge(account.subscriptionTier)}`}>
                {account.subscriptionTier}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Downloads (30 days)</span>
              <Download className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold">{account.usageStats?.downloadsLast30Days || 0}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12% from last month
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Active Licenses</span>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold">{account.usageStats?.totalLicenses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {account.licenses?.length || 0} total licenses
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Orders (30 days)</span>
              <CreditCard className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold">{account.usageStats?.ordersLast30Days || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              View all orders in history
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Orders
              </h2>
              <p className="text-sm text-gray-500 mb-4">Your recent corporate purchases</p>
              
              {account.orders && account.orders.length > 0 ? (
                <div className="space-y-4">
                  {account.orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${Number(order.total).toFixed(2)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No orders yet</p>
              )}
              <button className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                View All Orders
              </button>
            </div>

            {/* Active Licenses */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Active Licenses
              </h2>
              <p className="text-sm text-gray-500 mb-4">Your current content licenses</p>
              
              {account.licenses && account.licenses.length > 0 ? (
                <div className="space-y-4">
                  {account.licenses.slice(0, 5).map((license) => (
                    <div key={license.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{license.licenseType}</p>
                        <p className="text-sm text-gray-500">
                          {license.seats} seat{license.seats !== 1 ? 's' : ''} • {license.scope || 'All use'}
                        </p>
                      </div>
                      <div className="text-right">
                        {license.expiresAt && (
                          <p className="text-sm text-gray-500">
                            Expires: {new Date(license.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No active licenses</p>
              )}
              <button className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Manage Licenses
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{account.contactPerson}</p>
                    <p className="text-sm text-gray-500">{account.jobTitle}</p>
                  </div>
                </div>
                {account.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">{account.phone}</p>
                    </div>
                  </div>
                )}
                {account.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">{account.address}</p>
                    </div>
                  </div>
                )}
                <button className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Edit Details
                </button>
              </div>
            </div>

            {/* Team Members */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </h2>
              <p className="text-sm text-gray-500 mb-4">Users with access to this account</p>
              
              {account.teamMembers && account.teamMembers.length > 0 ? (
                <div className="space-y-3">
                  {account.teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.user.name || member.user.email}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No team members</p>
              )}
              <button className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Invite Team Member
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-left">
                  <Download className="w-4 h-4" />
                  Download Assets
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-left">
                  <Mail className="w-4 h-4" />
                  Contact Account Manager
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-left">
                  <FileText className="w-4 h-4" />
                  View Invoices
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
