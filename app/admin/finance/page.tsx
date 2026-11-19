'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Wallet,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  Banknote,
  Receipt,
  BarChart3
} from 'lucide-react';

interface FinanceStats {
  totalRevenue: number;
  pendingPayouts: number;
  completedPayouts: number;
  pendingPayments: number;
  monthlyRevenue: number;
  platformFees: number;
}

interface RecentTransaction {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export default function FinanceDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const userRole = session?.user?.role;
      const financeRoles = ['FINANCE_MANAGER', 'SUPERADMIN'];
      if (!financeRoles.includes(userRole || '')) {
        router.push('/dashboard');
      } else {
        fetchFinanceData();
      }
    }
  }, [status, session, router]);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      // Fetch analytics
      const analyticsRes = await fetch('/api/admin/analytics');
      const analyticsData = await analyticsRes.json();

      // Fetch payouts
      const payoutsRes = await fetch('/api/admin/payouts?limit=5');
      const payoutsData = await payoutsRes.json();

      // Fetch orders
      const ordersRes = await fetch('/api/admin/orders?limit=10&status=PAID');
      const ordersData = await ordersRes.json();

      // Calculate stats
      const totalRevenue = analyticsData.stats?.totalRevenue || 0;
      const platformFees = analyticsData.stats?.platformFees || 0;
      
      const pendingPayouts = payoutsData.stats?.totalPending || 0;
      const completedPayouts = payoutsData.stats?.totalPaid || 0;

      setStats({
        totalRevenue,
        pendingPayouts,
        completedPayouts,
        pendingPayments: payoutsData.stats?.totalPending || 0,
        monthlyRevenue: totalRevenue, // Simplified
        platformFees,
      });

      setRecentOrders(ordersData.orders?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
      PENDING: { color: 'badge-warning', icon: Clock },
      PAID: { color: 'badge-info', icon: CheckCircle },
      COMPLETED: { color: 'badge-success', icon: CheckCircle },
      PROCESSING: { color: 'badge-info', icon: RefreshCw },
      CANCELLED: { color: 'badge-error', icon: XCircle },
      REFUNDED: { color: 'badge-error', icon: XCircle },
    };
    
    const config = statusConfig[status] || { color: 'badge-ghost', icon: Clock };
    const Icon = config.icon;
    
    return (
      <span className={`badge ${config.color} gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="loading loading-spinner loading-lg text-[var(--primary)]"></div>
      </div>
    );
  }

  const financeRoles = ['FINANCE_MANAGER', 'SUPERADMIN'];
  if (!financeRoles.includes(session?.user?.role || '')) {
    return null;
  }

  const menuItems = [
    {
      title: 'Payout Requests',
      description: 'View and process photographer payout requests',
      icon: Wallet,
      href: '/admin/payouts',
      color: 'bg-green-500 dark:bg-green-600',
      badge: stats && stats.pendingPayouts > 0 ? `${stats.pendingPayouts} pending` : null,
    },
    {
      title: 'Orders',
      description: 'View and manage all orders',
      icon: Receipt,
      href: '/admin/orders',
      color: 'bg-primary dark:bg-primary',
    },
    {
      title: 'Verify Payments',
      description: 'Verify pending payments',
      icon: CreditCard,
      href: '/admin/orders?verify=true',
      color: 'bg-amber-500 dark:bg-amber-600',
      badge: stats && stats.pendingPayments > 0 ? `${stats.pendingPayments} pending` : null,
    },
    {
      title: 'Analytics',
      description: 'Revenue and profit reports',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-purple-500 dark:bg-purple-600',
    },
  ];

  return (
    <div className="p-6 bg-[var(--background)] min-h-screen">
      {/* Header - using theme variables */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[var(--primary)] rounded-lg">
          <DollarSign className="w-8 h-8 text-[var(--primary-foreground)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Finance Dashboard</h1>
          <p className="text-[var(--muted-foreground)]">Manage payments, payouts, and financial reports</p>
        </div>
      </div>

      {/* Stats Cards - using theme-based styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg shadow-sm p-4 border border-[var(--border)] border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Total Revenue</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-[var(--card)] rounded-lg shadow-sm p-4 border border-[var(--border)] border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Pending Payouts</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">${stats?.pendingPayouts?.toFixed(2) || '0.00'}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        
        <div className="bg-[var(--card)] rounded-lg shadow-sm p-4 border border-[var(--border)] border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Completed Payouts</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">${stats?.completedPayouts?.toFixed(2) || '0.00'}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-[var(--card)] rounded-lg shadow-sm p-4 border border-[var(--border)] border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Platform Fees</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">${stats?.platformFees?.toFixed(2) || '0.00'}</p>
            </div>
            <Banknote className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block bg-[var(--card)] rounded-lg shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow p-6 group"
          >
            <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center mb-4`}>
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                {item.title}
              </h3>
              {item.badge && (
                <span className="badge badge-warning badge-sm">{item.badge}</span>
              )}
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">{item.description}</p>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-[var(--card)] rounded-lg shadow-sm border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent Transactions</h2>
          <Link href="/admin/orders" className="btn btn-sm btn-ghost">
            View All
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="bg-[var(--table-header)]">
                <th className="text-[var(--foreground)]">Order #</th>
                <th className="text-[var(--foreground)]">Amount</th>
                <th className="text-[var(--foreground)]">Payment Method</th>
                <th className="text-[var(--foreground)]">Status</th>
                <th className="text-[var(--foreground)]">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[var(--muted-foreground)]">
                    No recent transactions
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--table-row-hover)]">
                    <td className="font-medium text-[var(--foreground)]">{order.orderNumber}</td>
                    <td className="text-[var(--foreground)]">${order.total?.toFixed(2)}</td>
                    <td>
                      <span className="badge badge-ghost">{order.paymentMethod}</span>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td className="text-[var(--muted-foreground)]">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Link href="/admin/payouts" className="flex items-center gap-3 p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] hover:bg-[var(--table-row-hover)] transition-colors">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Wallet className="w-5 h-5 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <p className="font-medium text-[var(--foreground)]">Manage Payouts</p>
            <p className="text-sm text-[var(--muted-foreground)]">Process photographer payments</p>
          </div>
        </Link>
        
        <Link href="/admin/orders" className="flex items-center gap-3 p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] hover:bg-[var(--table-row-hover)] transition-colors">
          <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-[var(--foreground)]">Order Management</p>
            <p className="text-sm text-[var(--muted-foreground)]">View and process orders</p>
          </div>
        </Link>
        
        <Link href="/admin/analytics" className="flex items-center gap-3 p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] hover:bg-[var(--table-row-hover)] transition-colors">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="font-medium text-[var(--foreground)]">Financial Reports</p>
            <p className="text-sm text-[var(--muted-foreground)]">Revenue and profit analytics</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
