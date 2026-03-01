"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Loader2,
  Users,
  Camera,
  Image,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Star
} from "lucide-react";

interface AnalyticsData {
  stats: {
    totalUsers: number;
    totalPhotographers: number;
    totalPhotos: number;
    pendingPhotos: number;
    totalOrders: number;
    totalRevenue: number;
    pendingPayouts: number;
    pendingPayoutsCount: number;
    pendingPhotographerApps: number;
  };
  recentOrders: any[];
  topPhotographers: any[];
  monthlyRevenue: Record<string, number>;
  growth: {
    orders: number;
    revenue: number;
  };
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-red-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/admin'}
                className="text-white hover:bg-red-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Analytics</h1>
                <p className="text-red-100 text-lg">Platform performance and statistics</p>
              </div>
            </div>
            <div className="flex gap-2">
              {["7", "30", "90"].map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "outline"}
                  onClick={() => setPeriod(p)}
                  className={period === p ? "bg-white text-red-700 hover:bg-gray-100" : "text-white border-white hover:bg-red-800"}
                >
                  {p} days
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              {analytics?.growth && analytics.growth.revenue !== undefined && (
                <div className={`flex items-center gap-1 text-sm ${analytics.growth.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.growth.revenue >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(analytics.growth.revenue).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(analytics?.stats?.totalRevenue || 0)}
            </p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              {analytics?.growth && analytics.growth.orders !== undefined && (
                <div className={`flex items-center gap-1 text-sm ${analytics.growth.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.growth.orders >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(analytics.growth.orders).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{analytics?.stats?.totalOrders || 0}</p>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{analytics?.stats?.totalUsers || 0}</p>
          </div>

          {/* Total Photographers */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Camera className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Photographers</p>
            <p className="text-2xl font-bold text-gray-900">{analytics?.stats?.totalPhotographers || 0}</p>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Photos */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-teal-100 rounded-lg">
                <Image className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Total Photos</p>
            <p className="text-2xl font-bold text-gray-900">{analytics?.stats?.totalPhotos || 0}</p>
          </div>

          {/* Pending Photos */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Image className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Pending Approval</p>
            <p className="text-2xl font-bold text-gray-900">{analytics?.stats?.pendingPhotos || 0}</p>
          </div>

          {/* Pending Payouts */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Pending Payouts</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(analytics?.stats?.pendingPayouts || 0)}
            </p>
            <p className="text-xs text-gray-500">{analytics?.stats?.pendingPayoutsCount || 0} requests</p>
          </div>

          {/* Pending Applications */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-rose-100 rounded-lg">
                <Star className="h-6 w-6 text-rose-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Pending Applications</p>
            <p className="text-2xl font-bold text-gray-900">{analytics?.stats?.pendingPhotographerApps || 0}</p>
          </div>
        </div>

        {/* Third Row - Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Photographers */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Photographers</h3>
            {analytics?.topPhotographers && analytics.topPhotographers.length > 0 ? (
              <div className="space-y-4">
                {analytics.topPhotographers.map((photographer: any, index: number) => (
                  <div key={photographer.photographerId} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {photographer.user?.name || photographer.user?.email || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {photographer.totalOrders} orders
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(photographer.totalSales)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h3>
            {analytics?.recentOrders && analytics.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentOrders.slice(0, 8).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.user?.name || order.user?.email || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            )}
          </div>
        </div>

        {/* Monthly Revenue Chart (Simple) */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue</h3>
          {analytics?.monthlyRevenue && Object.keys(analytics.monthlyRevenue).length > 0 ? (
            <div className="flex items-end gap-2 h-48">
              {Object.entries(analytics.monthlyRevenue)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-6)
                .map(([month, revenue]) => {
                  const maxRevenue = Math.max(...Object.values(analytics.monthlyRevenue));
                  const height = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-red-600 rounded-t transition-all hover:bg-red-700"
                        style={{ height: `${height}%`, minHeight: revenue > 0 ? '4px' : '0' }}
                      />
                      <p className="text-xs text-gray-500 mt-2">{month.slice(5)}</p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No revenue data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
