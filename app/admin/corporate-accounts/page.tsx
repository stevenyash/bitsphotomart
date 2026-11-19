'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Building, 
  Search,
  Edit, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  X,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Filter
} from 'lucide-react';
import { theme } from "@/lib/admin-theme";

interface CorporateAccount {
  id: string;
  companyName: string;
  industry: string;
  contactPerson: string;
  jobTitle: string;
  phone: string | null;
  address: string | null;
  status: string;
  subscriptionTier: string;
  createdAt: string;
  approvedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    licenses: number;
  };
}

export default function CorporateAccountsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<CorporateAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedAccount, setSelectedAccount] = useState<CorporateAccount | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['ADMIN', 'SUPERADMIN', 'MANAGER'].includes(session?.user?.role || '')) {
      router.push('/admin');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (['ADMIN', 'SUPERADMIN', 'MANAGER'].includes(session?.user?.role || '')) {
      fetchAccounts();
    }
  }, [pagination.page, search, statusFilter, status, session]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/corporate-accounts?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setAccounts(data.accounts || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (accountId: string, newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;
    
    try {
      setProcessingId(accountId);
      const res = await fetch(`/api/admin/corporate-accounts?accountId=${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        fetchAccounts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this corporate account?')) return;
    
    try {
      setProcessingId(accountId);
      const res = await fetch(`/api/admin/corporate-accounts?accountId=${accountId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchAccounts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> Active
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" /> Suspended
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return status;
    }
  };

  const totalAccounts = pagination.total;
  const activeAccounts = accounts.filter(a => a.status === 'ACTIVE').length;
  const pendingAccounts = accounts.filter(a => a.status === 'PENDING').length;

  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.secondary}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className={theme.mutedText}>Loading...</p>
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
      {/* Header */}
      <div className={`${theme.cardStyle} p-6 mb-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-xl">
              <Building className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${theme.heading}`}>Corporate Accounts</h1>
              <p className={theme.mutedText}>Manage corporate partner accounts</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name..."
              className={`w-full pl-10 pr-4 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-blue-500`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <Building className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>{totalAccounts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>{activeAccounts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>{pendingAccounts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`${theme.cardStyle} overflow-hidden`}>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No corporate accounts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className={`font-medium ${theme.heading}`}>{account.companyName}</div>
                      <div className="text-sm text-gray-500">{account.user.name || account.user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{account.industry}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {account.contactPerson}
                      </div>
                      {account.phone && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {account.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {account.subscriptionTier}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(account.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {account.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(account.id, 'ACTIVE')}
                              disabled={processingId === account.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(account.id, 'REJECTED')}
                              disabled={processingId === account.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {account.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleUpdateStatus(account.id, 'SUSPENDED')}
                            disabled={processingId === account.id}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Suspend"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {account.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleUpdateStatus(account.id, 'ACTIVE')}
                            disabled={processingId === account.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Reactivate"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
