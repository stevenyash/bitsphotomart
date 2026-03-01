'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Camera,
  Image,
  FileText,
  Settings,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalPhotographers: number;
  pendingPhotos: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
  pendingApprovals: PendingApproval[];
}

interface Order {
  id: string;
  orderNumber: string;
  user: { name: string; email: string };
  total: number;
  status: string;
  createdAt: string;
}

interface PendingApproval {
  id: string;
  type: 'photo' | 'video' | 'photographer';
  title: string;
  submittedBy: string;
  submittedAt: string;
}

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // In a real app, this would fetch from an API
      // For now, we'll use mock data
      setStats({
        totalPhotographers: 24,
        pendingPhotos: 15,
        totalOrders: 156,
        totalRevenue: 45800,
        recentOrders: [
          { id: '1', orderNumber: 'ORD-001', user: { name: 'John Doe', email: 'john@example.com' }, total: 150, status: 'COMPLETED', createdAt: new Date().toISOString() },
          { id: '2', orderNumber: 'ORD-002', user: { name: 'Jane Smith', email: 'jane@example.com' }, total: 75, status: 'PENDING', createdAt: new Date().toISOString() },
        ],
        pendingApprovals: [
          { id: '1', type: 'photo', title: 'Sunset Landscape', submittedBy: 'Mike Photographer', submittedAt: new Date().toISOString() },
          { id: '2', type: 'photographer', title: 'New Photographer Application', submittedBy: 'Sarah Wilson', submittedAt: new Date().toISOString() },
        ]
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading manager dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Manager Dashboard
          </h1>
          <p className="text-blue-200 mt-1">Manage photographers, orders, and content approvals</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Total Photographers</span>
              <Users className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-3xl font-bold">{stats?.totalPhotographers || 0}</div>
            <Link href="/admin/photographers" className="text-xs text-indigo-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Pending Approvals</span>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold">{stats?.pendingPhotos || 0}</div>
            <Link href="/admin/photos" className="text-xs text-indigo-600 hover:underline">
              Review now
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Total Orders</span>
              <ShoppingCart className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">{stats?.totalOrders || 0}</div>
            <Link href="/admin/orders" className="text-xs text-indigo-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Total Revenue</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold">${stats?.totalRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12% this month
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/photos" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                <Image className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                <span className="text-sm font-medium">Review Photos</span>
              </Link>
              <Link href="/admin/photographers" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                <Camera className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                <span className="text-sm font-medium">Manage Photographers</span>
              </Link>
              <Link href="/admin/orders" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                <span className="text-sm font-medium">View Orders</span>
              </Link>
              <Link href="/admin/analytics" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                <span className="text-sm font-medium">Analytics</span>
              </Link>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Approvals
            </h2>
            <div className="space-y-3">
              {stats?.pendingApprovals.map((approval) => (
                <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {approval.type === 'photo' ? (
                      <Image className="w-8 h-8 text-indigo-500" />
                    ) : approval.type === 'video' ? (
                      <Camera className="w-8 h-8 text-indigo-500" />
                    ) : (
                      <Users className="w-8 h-8 text-indigo-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{approval.title}</p>
                      <p className="text-xs text-gray-500">by {approval.submittedBy}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {(!stats?.pendingApprovals || stats.pendingApprovals.length === 0) && (
                <p className="text-gray-500 text-center py-4">No pending approvals</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Orders
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Order</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                    <td className="py-3 px-4 text-sm">{order.user.name}</td>
                    <td className="py-3 px-4 font-semibold">${order.total.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
