'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { theme, iconColors, adminLayout } from '@/lib/admin-theme';
import {
  Activity, 
  Search, 
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Globe,
  Clock,
  AlertCircle,
  Filter,
  Eye,
  Plus,
  Edit,
  Trash2,
  Settings
} from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  admin: {
    id: string;
    email: string;
    name: string | null;
  };
}

const actionColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  'create': { bg: 'bg-green-100', text: 'text-green-700', icon: Plus },
  'update': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Edit },
  'delete': { bg: 'bg-red-100', text: 'text-red-700', icon: Trash2 },
  'login': { bg: 'bg-purple-100', text: 'text-purple-700', icon: Settings },
  'settings': { bg: 'bg-amber-100', text: 'text-amber-700', icon: Settings },
};

export default function ActivityLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'SUPERADMIN') {
      router.push('/admin');
    }
  }, [status, session, router]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (session?.user?.role === 'SUPERADMIN' && status === 'authenticated') {
      fetchLogs();
    }
  }, [pagination.page, actionFilter, status, session]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (actionFilter) params.set('action', actionFilter);

      const res = await fetch(`/api/admin/superadmin/activity-logs?${params}`);
      const data = await res.json();
      
      setLogs(data.logs || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action: string) => {
    const parts = action.split('.');
    return parts.length > 1 
      ? `${parts[0]}: ${parts.slice(1).join(' ')}`
      : action;
  };

  const getActionInfo = (action: string) => {
    const actionLower = action.toLowerCase();
    for (const [key, value] of Object.entries(actionColors)) {
      if (actionLower.includes(key)) {
        return value;
      }
    }
    return { bg: 'bg-gray-100', text: 'text-gray-700', icon: Activity };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  // Filter logs locally by search term
  const filteredLogs = searchTerm 
    ? logs.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : logs;

  if (status === 'loading' || loading && logs.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className={theme.mutedText}>Loading activity logs...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'SUPERADMIN') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className={`text-xl font-semibold ${theme.heading}`}>Access Denied</h2>
          <p className={`mt-2 ${theme.mutedText}`}>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.background} p-6`}>
      {/* Header */}
      <div className={`${theme.cardStyle} p-6 mb-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 ${iconColors.info} rounded-xl`}>
              <Activity className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className={adminLayout.pageTitle}>Activity Logs</h1>
              <p className={adminLayout.pageSubtitle}>Track admin actions and system changes</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by action, admin name, or email..."
              className={`w-full pl-10 pr-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className={`px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${theme.card}`}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="settings">Settings</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className={adminLayout.statsGrid}>
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${iconColors.info}`}>
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className={`text-sm ${theme.mutedText}`}>Total Logs</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>{pagination.total}</p>
            </div>
          </div>
        </div>
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${iconColors.success}`}>
              <Plus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className={`text-sm ${theme.mutedText}`}>Creates</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>
                {logs.filter(l => l.action.includes('create')).length}
              </p>
            </div>
          </div>
        </div>
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${iconColors.primary}`}>
              <Edit className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className={`text-sm ${theme.mutedText}`}>Updates</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>
                {logs.filter(l => l.action.includes('update')).length}
              </p>
            </div>
          </div>
        </div>
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${iconColors.error}`}>
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className={`text-sm ${theme.mutedText}`}>Deletes</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>
                {logs.filter(l => l.action.includes('delete')).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className={`${theme.cardStyle} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme.muted} border-b ${theme.border}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme.mutedText} uppercase tracking-wider`}>Timestamp</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme.mutedText} uppercase tracking-wider`}>Admin</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme.mutedText} uppercase tracking-wider`}>Action</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme.mutedText} uppercase tracking-wider`}>Entity</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme.mutedText} uppercase tracking-wider`}>Details</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme.mutedText} uppercase tracking-wider`}>IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`text-center py-12 ${theme.mutedText}`}>
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No activity logs found</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actionInfo = getActionInfo(log.action);
                  const ActionIcon = actionInfo.icon;
                  const { date, time } = formatDate(log.createdAt);
                  
                  return (
                    <tr key={log.id} className={`${theme.tableRowHover} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 ${theme.secondary} rounded-lg`}>
                            <Calendar className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <div className={`text-sm font-medium ${theme.heading}`}>{date}</div>
                            <div className={`text-xs ${theme.mutedText} flex items-center gap-1`}>
                              <Clock className="w-3 h-3" /> {time}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${iconColors.info} flex items-center justify-center`}>
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <div className={`text-sm font-medium ${theme.heading}`}>{log.admin.name || 'Unknown'}</div>
                            <div className={`text-xs ${theme.mutedText}`}>{log.admin.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${actionInfo.bg} ${actionInfo.text}`}>
                          <ActionIcon className="w-3 h-3" />
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.entityType ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${theme.secondary} ${theme.secondaryForeground}`}>
                            {log.entityType}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {log.details ? (
                          <div className={`text-xs ${theme.mutedText} max-w-[200px] truncate`} title={JSON.stringify(log.details)}>
                            {JSON.stringify(log.details)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1 text-sm ${theme.mutedText}`}>
                          <Globe className="w-4 h-4 text-gray-400" />
                          {log.ipAddress || 'N/A'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className={`flex items-center justify-between px-6 py-4 border-t ${theme.muted}`}>
            <div className={`text-sm ${theme.mutedText}`}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-lg border ${theme.card} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className={`text-sm ${theme.mutedText} px-2`}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className={`p-2 rounded-lg border ${theme.card} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
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
