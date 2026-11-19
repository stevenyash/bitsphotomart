'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  UserCog,
  DollarSign,
  TrendingUp,
  Pause,
  Play,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Filter,
  Loader2,
  Copy,
  RefreshCw,
  Eye
} from 'lucide-react';
import { theme } from '@/lib/admin-theme';

interface Marketer {
  id: string;
  referralCode: string;
  department: string | null;
  title: string | null;
  commissionRate: string;
  targetSales: string | null;
  totalSales: string;
  totalCommission: string;
  activeClients: number;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    avatar: string | null;
    createdAt: string;
    isVerified: boolean;
  };
  referrals?: MarketerReferral[];
}

interface MarketerReferral {
  id: string;
  referredUserId: string;
  referralSource: string | null;
  commissionEarned: string;
  saleAmount: string | null;
  status: string;
  createdAt: string;
}

export default function AdminMarketersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [marketers, setMarketers] = useState<Marketer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'>('ALL');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMarketer, setSelectedMarketer] = useState<Marketer | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    department: '',
    title: '',
    commissionRate: '10',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['ADMIN', 'SUPERADMIN', 'MANAGER'].includes(session?.user?.role || '')) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (['ADMIN', 'SUPERADMIN', 'MANAGER'].includes(session?.user?.role || '')) {
      fetchMarketers();
    }
  }, [pagination.page, search, filter, status, session]);

  const fetchMarketers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('search', search);
      if (filter !== 'ALL') params.set('status', filter);

      const res = await fetch(`/api/admin/marketers?${params}`);
      const data = await res.json();
      
      setMarketers(data.marketers || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error('Error fetching marketers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProcessingId('creating');
      const res = await fetch('/api/admin/marketers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({
          email: '',
          password: '',
          name: '',
          phone: '',
          department: '',
          title: '',
          commissionRate: '10',
        });
        fetchMarketers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create marketer');
      }
    } catch (error) {
      console.error('Error creating marketer:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateStatus = async (marketerId: string, newStatus: string) => {
    try {
      setProcessingId(marketerId);
      const res = await fetch(`/api/admin/marketers/${marketerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchMarketers();
      }
    } catch (error) {
      console.error('Error updating marketer:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (marketerId: string) => {
    if (!confirm('Are you sure you want to delete this marketer? Their role will be changed to USER.')) {
      return;
    }
    try {
      setProcessingId(marketerId);
      const res = await fetch(`/api/admin/marketers/${marketerId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchMarketers();
      }
    } catch (error) {
      console.error('Error deleting marketer:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const viewMarketerDetails = async (marketer: Marketer) => {
    try {
      const res = await fetch(`/api/admin/marketers/${marketer.id}`);
      const data = await res.json();
      if (res.ok && data.marketer) {
        setSelectedMarketer(data.marketer);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Error fetching marketer details:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; darkBg?: string; darkText?: string }> = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-300' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-700', darkBg: 'dark:bg-gray-800', darkText: 'dark:text-gray-300' },
      SUSPENDED: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'dark:bg-red-900', darkText: 'dark:text-red-300' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', darkBg: 'dark:bg-yellow-900', darkText: 'dark:text-yellow-300' },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.darkBg || ''} ${config.text} ${config.darkText || ''}`}>
        {status}
      </span>
    );
  };

  const totalSales = marketers.reduce((sum, m) => sum + parseFloat(m.totalSales || '0'), 0);
  const totalCommission = marketers.reduce((sum, m) => sum + parseFloat(m.totalCommission || '0'), 0);
  const activeMarketers = marketers.filter(m => m.status === 'ACTIVE').length;

  if (status === 'loading' || loading && marketers.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.secondary}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className={theme.mutedText}>Loading marketers...</p>
        </div>
      </div>
    );
  }

  if (!['ADMIN', 'SUPERADMIN', 'MANAGER'].includes(session?.user?.role || '')) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.secondary}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className={`text-xl font-semibold ${theme.heading}`}>Access Denied</h2>
          <p className={`${theme.mutedText} mt-2`}>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.secondary} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className={`text-2xl font-bold ${theme.heading}`}>Marketer Management</h1>
              <p className={theme.mutedText}>Manage your marketing partners and track their performance</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Marketer
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`${theme.cardStyle} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className={`${theme.mutedText} text-sm`}>Total Marketers</p>
                <p className={`text-xl font-bold ${theme.heading}`}>{pagination.total}</p>
              </div>
            </div>
          </div>
          <div className={`${theme.cardStyle} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className={`${theme.mutedText} text-sm`}>Active</p>
                <p className={`text-xl font-bold ${theme.heading}`}>{activeMarketers}</p>
              </div>
            </div>
          </div>
          <div className={`${theme.cardStyle} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className={`${theme.mutedText} text-sm`}>Total Sales</p>
                <p className={`text-xl font-bold ${theme.heading}`}>KES {totalSales.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className={`${theme.cardStyle} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className={`${theme.mutedText} text-sm`}>Total Commission</p>
                <p className={`text-xl font-bold ${theme.heading}`}>KES {totalCommission.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${theme.cardStyle} p-4 mb-6`}>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email..."
                className={`w-full pl-10 pr-4 py-2 border ${theme.border} rounded-lg ${theme.card} focus:ring-2 focus:ring-primary`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === f 
                      ? 'bg-primary text-primary-foreground' 
                      : `${theme.secondary} ${theme.body} hover:${theme.tableRowHover}`
                  }`}
                >
                  {f === 'ALL' && 'All'}
                  {f === 'ACTIVE' && 'Active'}
                  {f === 'INACTIVE' && 'Inactive'}
                  {f === 'SUSPENDED' && 'Suspended'}
                  {f === 'PENDING' && 'Pending'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={`${theme.cardStyle} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${theme.secondary} border-b ${theme.border}`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>Marketer</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>Contact</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>Department</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>Commission</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>Total Sales</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>Commission Earned</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>Clients</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>Status</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {marketers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={`px-4 py-8 text-center ${theme.mutedText}`}>
                      No marketers found
                    </td>
                  </tr>
                ) : (
                  marketers.map((marketer) => (
                    <tr key={marketer.id} className={`${theme.tableRowHover}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                            <UserCog className="w-5 h-5 text-pink-600" />
                          </div>
                          <div>
                            <p className={`font-medium ${theme.body}`}>{marketer.user.name || 'N/A'}</p>
                            <p className={`text-sm ${theme.mutedText}`}>{marketer.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`text-sm ${theme.body}`}>
                          {marketer.user.phone || 'No phone'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`text-sm ${theme.body}`}>
                          {marketer.department || '-'}
                          {marketer.title && <p className={`text-xs ${theme.mutedText}`}>{marketer.title}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium text-primary`}>
                          {marketer.commissionRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium text-green-600 dark:text-green-400`}>
                          KES {parseFloat(marketer.totalSales || '0').toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium text-purple-600 dark:text-purple-400`}>
                          KES {parseFloat(marketer.totalCommission || '0').toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${theme.body}`}>
                          {marketer.activeClients}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(marketer.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewMarketerDetails(marketer)}
                            className="p-1 text-primary hover:opacity-80"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {marketer.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleUpdateStatus(marketer.id, 'SUSPENDED')}
                              disabled={processingId === marketer.id}
                              className="p-1 text-yellow-600 dark:text-yellow-400 hover:opacity-80"
                              title="Suspend"
                            >
                              {processingId === marketer.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Pause className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(marketer.id, 'ACTIVE')}
                              disabled={processingId === marketer.id}
                              className="p-1 text-green-600 dark:text-green-400 hover:opacity-80"
                              title="Activate"
                            >
                              {processingId === marketer.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(marketer.id)}
                            disabled={processingId === marketer.id}
                            className="p-1 text-red-600 dark:text-red-400 hover:opacity-80"
                            title="Delete"
                          >
                            {processingId === marketer.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className={`flex items-center justify-between px-4 py-3 border-t ${theme.border}`}>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className={`px-3 py-1 rounded ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Previous
              </button>
              <span className={theme.mutedText}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className={`px-3 py-1 rounded ${pagination.page === pagination.pages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${theme.cardStyle} w-full max-w-md p-6 rounded-lg`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold ${theme.heading}`}>Add New Marketer</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.body} mb-1`}>Email *</label>
                  <input
                    type="email"
                    required
                    className={`w-full px-4 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-primary`}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme.body} mb-1`}>Password *</label>
                  <input
                    type="password"
                    required
                    className={`w-full px-4 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-primary`}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme.body} mb-1`}>Name</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-primary`}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme.body} mb-1`}>Phone</label>
                  <input
                    type="tel"
                    className={`w-full px-4 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-primary`}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${theme.body} mb-1`}>Department</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-primary`}
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme.body} mb-1`}>Title</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-primary`}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme.body} mb-1`}>Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className={`w-full px-4 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-primary`}
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`px-4 py-2 ${theme.body} ${theme.secondary} rounded-lg hover:bg-muted`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingId === 'creating'}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {processingId === 'creating' ? 'Creating...' : 'Create Marketer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showViewModal && selectedMarketer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${theme.cardStyle} w-full max-w-2xl p-6 rounded-lg max-h-[90vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold ${theme.heading}`}>Marketer Details</h2>
                <button onClick={() => setShowViewModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                    <UserCog className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${theme.heading}`}>{selectedMarketer.user.name || 'N/A'}</h3>
                    <p className={theme.mutedText}>{selectedMarketer.user.email}</p>
                    {getStatusBadge(selectedMarketer.status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 ${theme.secondary} rounded-lg`}>
                    <p className={`text-sm ${theme.mutedText}`}>Total Sales</p>
                    <p className={`text-xl font-bold text-green-600 dark:text-green-400`}>KES {parseFloat(selectedMarketer.totalSales || '0').toLocaleString()}</p>
                  </div>
                  <div className={`p-3 ${theme.secondary} rounded-lg`}>
                    <p className={`text-sm ${theme.mutedText}`}>Commission Earned</p>
                    <p className={`text-xl font-bold text-primary`}>KES {parseFloat(selectedMarketer.totalCommission || '0').toLocaleString()}</p>
                  </div>
                  <div className={`p-3 ${theme.secondary} rounded-lg`}>
                    <p className={`text-sm ${theme.mutedText}`}>Active Clients</p>
                    <p className={`text-xl font-bold ${theme.heading}`}>{selectedMarketer.activeClients}</p>
                  </div>
                  <div className={`p-3 ${theme.secondary} rounded-lg`}>
                    <p className={`text-sm ${theme.mutedText}`}>Commission Rate</p>
                    <p className={`text-xl font-bold ${theme.heading}`}>{selectedMarketer.commissionRate}%</p>
                  </div>
                </div>

                <div className={`p-3 ${theme.secondary} rounded-lg`}>
                  <p className={`text-sm ${theme.mutedText} mb-2`}>Contact Info</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className={theme.body}>{selectedMarketer.user.email}</span>
                  </div>
                  {selectedMarketer.user.phone && (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className={theme.body}>{selectedMarketer.user.phone}</span>
                    </div>
                  )}
                </div>

                <div className={`p-3 ${theme.secondary} rounded-lg`}>
                  <p className={`text-sm ${theme.mutedText} mb-2`}>Work Info</p>
                  <p className={theme.body}>Department: {selectedMarketer.department || 'N/A'}</p>
                  <p className={theme.body}>Title: {selectedMarketer.title || 'N/A'}</p>
                  <p className={theme.body}>Target Sales: {selectedMarketer.targetSales ? `KES ${parseFloat(selectedMarketer.targetSales).toLocaleString()}` : 'Not set'}</p>
                </div>

                <div className={`p-3 ${theme.secondary} rounded-lg`}>
                  <p className={`text-sm ${theme.mutedText} mb-2`}>Referral Link</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${selectedMarketer.referralCode}`}
                      className={`flex-1 px-3 py-2 border ${theme.border} rounded text-sm bg-white ${theme.body}`}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/register?ref=${selectedMarketer.referralCode}`);
                      }}
                      className="px-3 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
