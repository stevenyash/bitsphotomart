'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Crown,
  Shield,
  UserCog,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Filter,
  Building,
  ShieldCheck,
  Key,
  User,
  Loader2
} from 'lucide-react';
import { theme } from "@/lib/admin-theme";

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

interface UserPermission {
  id: string;
  permissionId: string;
  permission: Permission;
}

interface AdminProfile {
  id: string;
  adminRole?: {
    id: string;
    name: string;
  };
  department?: string;
  title?: string;
  lastLoginAt?: string;
  lockedUntil?: string;
  permissions?: UserPermission[];
}

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
  adminProfile?: AdminProfile;
  photographer?: {
    id: string;
    status: string;
  } | null;
}

const roleIcons: Record<string, React.ElementType> = {
  SUPERADMIN: Crown,
  ADMIN: Shield,
  MANAGER: UserCog,
  FINANCE_MANAGER: DollarSign,
  MARKETER: UserCog,
  USER: User,
  PHOTOGRAPHER: UserCog,
};

const roleColors: Record<string, { bg: string; text: string; icon: string; darkBg?: string; darkText?: string; darkIcon?: string }> = {
  SUPERADMIN: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600', darkBg: 'bg-amber-900', darkText: 'text-amber-300', darkIcon: 'text-amber-400' },
  ADMIN: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-600', darkBg: 'bg-blue-900', darkText: 'text-blue-300', darkIcon: 'text-blue-400' },
  MANAGER: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-600', darkBg: 'bg-purple-900', darkText: 'text-purple-300', darkIcon: 'text-purple-400' },
  FINANCE_MANAGER: { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600', darkBg: 'bg-green-900', darkText: 'text-green-300', darkIcon: 'text-green-400' },
  MARKETER: { bg: 'bg-pink-100', text: 'text-pink-700', icon: 'text-pink-600', darkBg: 'bg-pink-900', darkText: 'text-pink-300', darkIcon: 'text-pink-400' },
  PHOTOGRAPHER: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'text-orange-600', darkBg: 'bg-orange-900', darkText: 'text-orange-300', darkIcon: 'text-orange-400' },
  USER: { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'text-slate-600', darkBg: 'bg-slate-800', darkText: 'text-slate-300', darkIcon: 'text-slate-400' },
};

type UserFilter = 'ALL' | 'ADMIN' | 'USER' | 'PHOTOGRAPHER' | 'MARKETER';

export default function UnifiedUserManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserFilter>('ALL');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'USER',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER', 'MARKETER'].includes(session?.user?.role || '')) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER', 'MARKETER'].includes(session?.user?.role || '')) {
      fetchUsers();
      fetchPermissions();
    }
  }, [pagination.page, search, filter, status, session]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('search', search);
      if (filter !== 'ALL') params.set('role', filter);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      
      setUsers(data.users || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/admin/superadmin/permissions');
      const data = await res.json();
      if (res.ok) {
        setAllPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!confirm(`Change role to ${newRole}?`)) return;
    
    try {
      setProcessingId(userId);
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    
    try {
      setProcessingId(userId);
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleTogglePermission = async (userId: string, permissionId: string, hasPermission: boolean) => {
    try {
      const method = hasPermission ? 'DELETE' : 'POST';
      const res = await fetch(`/api/admin/superadmin/users/${userId}/permissions`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionId }),
      });
      
      if (res.ok) {
        fetchUsers();
        // Refresh selected user permissions
        const updatedUser = users.find(u => u.id === userId);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error toggling permission:', error);
    }
  };

  const openPermissionsModal = (user: User) => {
    setSelectedUser(user);
    setUserPermissions(user.adminProfile?.permissions?.map(p => p.permissionId) || []);
    setShowPermissionsModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'USER',
    });
  };

  // Stats
  const totalUsers = pagination.total;
  const adminCount = users.filter(u => ['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER', 'MARKETER'].includes(u.role)).length;
  const photographerCount = users.filter(u => u.role === 'PHOTOGRAPHER').length;

  if (status === 'loading' || loading && users.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.secondary}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className={theme.mutedText}>Loading users...</p>
        </div>
      </div>
    );
  }

  if (!['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER', 'MARKETER'].includes(session?.user?.role || '')) {
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
    <div className={`min-h-screen ${theme.background} p-6`}>
      {/* Header */}
      <div className={`${theme.cardStyle} p-6 mb-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-xl">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${theme.heading}`}>User Management</h1>
              <p className={theme.mutedText}>Manage all users, roles, and permissions</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.mutedText}`} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              className={`w-full pl-10 pr-4 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-primary focus:border-primary`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(['ALL', 'ADMIN', 'USER', 'PHOTOGRAPHER', 'MARKETER'] as const).map((f) => (
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
                {f === 'ADMIN' && 'Admins'}
                {f === 'USER' && 'Users'}
                {f === 'PHOTOGRAPHER' && 'Photographers'}
                {f === 'MARKETER' && 'Marketers'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className={`text-sm ${theme.mutedText}`}>Total Users</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>{totalUsers}</p>
            </div>
          </div>
        </div>
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className={`text-sm ${theme.mutedText}`}>Admins</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>{adminCount}</p>
            </div>
          </div>
        </div>
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserCog className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className={`text-sm ${theme.mutedText}`}>Photographers</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>{photographerCount}</p>
            </div>
          </div>
        </div>
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className={`text-sm ${theme.mutedText}`}>Verified</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>{users.filter(u => u.isVerified).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className={`${theme.cardStyle} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className={`text-center py-12 ${theme.mutedText}`}>
            <Users className={`w-12 h-12 mx-auto mb-3 ${theme.mutedText}`} />
            <p>No users found</p>
          </div>
        ) : (
          <div className="divide-y">
            {users.map((user) => {
              const RoleIcon = roleIcons[user.role] || User;
              const colors = roleColors[user.role] || roleColors.USER;
              
              return (
                <div key={user.id} className={`p-4 ${theme.tableRowHover} transition-colors`}>
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colors.bg} dark:${colors.darkBg || ''}`}>
                      <RoleIcon className={`w-6 h-6 ${colors.icon} dark:${colors.darkIcon || ''}`} />
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${theme.heading}`}>{user.name || 'No Name'}</span>
                        {user.isVerified && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${colors.bg} dark:${colors.darkBg || ''} ${colors.text} dark:${colors.darkText || ''}`}>
                          {user.role}
                        </span>
                      </div>
                      <div className={`flex items-center gap-4 text-sm ${theme.mutedText}`}>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {user.phone}
                          </span>
                        )}
                      </div>
                    {user.adminProfile?.title && (
                        <div className={`text-sm ${theme.mutedText}`}>
                          {user.adminProfile.title} {user.adminProfile.department && `• ${user.adminProfile.department}`}
                        </div>
                      )}
                    </div>

                    {/* Permissions Badge */}
                    {user.adminProfile?.permissions && user.adminProfile.permissions.length > 0 && (
                      <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-primary/10 dark:bg-primary/20 rounded-lg">
                        <Key className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium text-primary">{user.adminProfile.permissions.length} extra perms</span>
                      </div>
                    )}

                    {/* Status */}
                    {user.adminProfile?.lockedUntil ? (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs">Locked</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs">Active</span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Permission Button (for admin users) */}
                      {['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER'].includes(user.role) && (
                        <button
                          onClick={() => openPermissionsModal(user)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Manage permissions"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Role Buttons */}
                      {user.role === 'USER' && (
                        <button
                          onClick={() => handleUpdateRole(user.id, 'PHOTOGRAPHER')}
                          disabled={processingId === user.id}
                          className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          Make Photographer
                        </button>
                      )}
                      {user.role === 'PHOTOGRAPHER' && (
                        <button
                          onClick={() => handleUpdateRole(user.id, 'USER')}
                          disabled={processingId === user.id}
                          className={`px-3 py-1 text-xs ${theme.secondary} ${theme.body} rounded-lg hover:bg-gray-200 transition-colors`}
                        >
                          Remove Photographer
                        </button>
                      )}
                      {['USER', 'PHOTOGRAPHER'].includes(user.role) && (
                        <button
                          onClick={() => handleUpdateRole(user.id, 'ADMIN')}
                          disabled={processingId === user.id}
                          className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          Make Admin
                        </button>
                      )}
                      
                      {/* Delete */}
                      {user.id !== session?.user?.id && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={processingId === user.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className={`flex items-center justify-between px-6 py-4 border-t ${theme.secondary}`}>
            <div className={`text-sm ${theme.mutedText}`}>
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-lg border ${theme.border} ${theme.card} ${theme.tableRowHover} disabled:opacity-50`}
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded-lg border ${theme.border} ${theme.card} ${theme.tableRowHover} disabled:opacity-50`}
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.card} rounded-2xl shadow-xl w-full max-w-md`}>
            <div className={`flex items-center justify-between p-6 ${theme.border}`}>
              <h2 className={`text-xl font-bold ${theme.heading}`}>Create New User</h2>
              <button onClick={() => setShowModal(false)} className={`p-2 ${theme.tableRowHover} rounded-lg`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  type="text"
                  className={`w-full px-4 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-primary`}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Role</label>
                <select
                  className={`w-full px-4 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-blue-500 ${theme.card}`}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="USER">User</option>
                  <option value="PHOTOGRAPHER">Photographer</option>
                  <option value="MARKETER">Marketer</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="FINANCE_MANAGER">Finance Manager</option>
                </select>
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
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.card} rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden`}>
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className={`text-xl font-bold ${theme.heading}`}>User Permissions</h2>
                <p className={`text-sm ${theme.mutedText}`}>{selectedUser.name || selectedUser.email}</p>
              </div>
              <button onClick={() => setShowPermissionsModal(false)} className={`p-2 ${theme.tableRowHover} rounded-lg`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className={`text-sm ${theme.mutedText} mb-4`}>
                Assign additional permissions directly to this user. These permissions are in addition to their role permissions.
              </p>
              <div className="space-y-4">
                {Object.entries(
                  allPermissions.reduce((acc, perm) => {
                    if (!acc[perm.category]) acc[perm.category] = [];
                    acc[perm.category].push(perm);
                    return acc;
                  }, {} as Record<string, Permission[]>)
                ).map(([category, perms]) => (
                  <div key={category}>
                      <h3 className={`font-medium text-sm ${theme.body} capitalize mb-2`}>{category}</h3>
                    <div className="space-y-2">
                      {perms.map((perm) => {
                        const hasPermission = userPermissions.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${theme.border} ${theme.tableRowHover} cursor-pointer`}
                          >
                            <input
                              type="checkbox"
                              checked={hasPermission}
                              onChange={() => {
                                const newPerms = hasPermission
                                  ? userPermissions.filter(p => p !== perm.id)
                                  : [...userPermissions, perm.id];
                                setUserPermissions(newPerms);
                                handleTogglePermission(selectedUser.id, perm.id, hasPermission);
                              }}
                              className="w-4 h-4 text-primary rounded"
                            />
                            <div className="flex-1">
                              <span className={`text-sm font-medium ${theme.heading}`}>{perm.name}</span>
                              {perm.description && (
                                <p className={`text-xs ${theme.mutedText}`}>{perm.description}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`flex justify-end p-6 border-t ${theme.secondary}`}>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
