"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Loader2, 
  Image, 
  DollarSign, 
  Download, 
  Eye,
  Star,
  TrendingUp,
  Wallet,
  BarChart3,
  FileText
} from "lucide-react";

interface AnalyticsData {
  stats: {
    totalPhotos: number;
    approvedPhotos: number;
    totalViews: number;
    totalDownloads: number;
    totalSales: number;
    totalEarnings: number;
    recentEarnings: number;
    availableBalance: number;
    totalPaid: number;
    pendingPayouts: number;
    rating: number;
  };
  monthlySales: { month: string; sales: number; earnings: number }[];
  categorySales: { category: string; sales: number; earnings: number }[];
  topPhotos: {
    id: string;
    title: string;
    views: number;
    downloads: number;
    sales: number;
    earnings: number;
    status: string;
  }[];
  recentSales: {
    id: string;
    photoTitle: string;
    amount: string;
    date: string | null;
  }[];
  payouts: {
    id: string;
    amount: string;
    netAmount: string;
    method: string;
    status: string;
    createdAt: string;
    processedAt: string | null;
  }[];
}

export default function PhotographerAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/photographer/analytics");
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load analytics</p>
          <Button onClick={() => redirect("/photographer")} variant="outline" className="border-slate-600 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { stats, monthlySales, categorySales, topPhotos, recentSales, payouts } = analytics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/photographer">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics & Earnings</h1>
              <p className="text-slate-400">Track your sales and performance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Earnings</p>
                <p className="text-2xl font-bold text-white">KES {stats.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Last 30 Days</p>
                <p className="text-2xl font-bold text-white">KES {stats.recentEarnings.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Available Balance</p>
                <p className="text-2xl font-bold text-white">KES {stats.availableBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Star className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Rating</p>
                <p className="text-2xl font-bold text-white">{stats.rating.toFixed(1)} / 5.0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Image className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Photos</p>
                <p className="text-xl font-bold text-white">{stats.totalPhotos}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Eye className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Views</p>
                <p className="text-xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Download className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Downloads</p>
                <p className="text-xl font-bold text-white">{stats.totalDownloads.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Sales</p>
                <p className="text-xl font-bold text-white">{stats.totalSales}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Wallet className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Pending</p>
                <p className="text-xl font-bold text-white">KES {stats.pendingPayouts.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Sales Chart */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Sales</h3>
            {monthlySales.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No sales data yet</p>
            ) : (
              <div className="space-y-3">
                {monthlySales.map((month) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <span className="text-slate-300">{month.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">{month.sales} sales</span>
                      <span className="text-amber-400 font-medium">KES {month.earnings.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Performance */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Sales by Category</h3>
            {categorySales.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No sales data yet</p>
            ) : (
              <div className="space-y-3">
                {categorySales.slice(0, 6).map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <span className="text-slate-300">{cat.category}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">{cat.sales} sales</span>
                      <span className="text-amber-400 font-medium">KES {cat.earnings.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Photos */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing Photos</h3>
          {topPhotos.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No photos yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-400 font-medium pb-3">Photo</th>
                    <th className="text-right text-slate-400 font-medium pb-3">Views</th>
                    <th className="text-right text-slate-400 font-medium pb-3">Downloads</th>
                    <th className="text-right text-slate-400 font-medium pb-3">Sales</th>
                    <th className="text-right text-slate-400 font-medium pb-3">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {topPhotos.map((photo) => (
                    <tr key={photo.id} className="border-b border-slate-700/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-white truncate max-w-xs">{photo.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            photo.status === "APPROVED" ? "bg-green-500/20 text-green-400" :
                            photo.status === "PENDING" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>{photo.status}</span>
                        </div>
                      </td>
                      <td className="text-right text-slate-300 py-3">{photo.views.toLocaleString()}</td>
                      <td className="text-right text-slate-300 py-3">{photo.downloads}</td>
                      <td className="text-right text-slate-300 py-3">{photo.sales}</td>
                      <td className="text-right text-amber-400 font-medium py-3">KES {photo.earnings.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Sales & Payouts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Sales</h3>
            {recentSales.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No sales yet</p>
            ) : (
              <div className="space-y-3">
                {recentSales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{sale.photoTitle}</p>
                      <p className="text-xs text-slate-400">
                        {sale.date ? new Date(sale.date).toLocaleDateString() : "Pending"}
                      </p>
                    </div>
                    <span className="text-amber-400 font-medium">KES {Number(sale.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payout History */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Payout History</h3>
              <Link href="/photographer/payout">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                  Request Payout
                </Button>
              </Link>
            </div>
            {payouts.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No payouts yet</p>
            ) : (
              <div className="space-y-3">
                {payouts.slice(0, 5).map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{payout.method}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 font-medium">KES {Number(payout.netAmount).toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        payout.status === "COMPLETED" ? "bg-green-500/20 text-green-400" :
                        payout.status === "PROCESSING" ? "bg-blue-500/20 text-blue-400" :
                        payout.status === "FAILED" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>{payout.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
