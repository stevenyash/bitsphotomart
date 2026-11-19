'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { theme, iconColors, adminLayout } from '@/lib/admin-theme';
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
  Loader2,
  RefreshCw,
  MoreHorizontal,
  ShieldOff,
  Award
} from 'lucide-react';

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

interface Role {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isSuperRole: boolean;
}

const roleIcons: Record<string, React.ElementType> = {
  SUPERADMIN: Crown,
  ADMIN: Shield,
  MANAGER: UserCog,
  FINANCE_MANAGER: DollarSign,
  USER: User,
  PHOTOGRAPHER: UserCog,
};

const roleColors: Record<string, { bg: string; text: string; icon: string; darkBg?: string; darkText?: string; darkIcon?: string }> = {
  SUPERADMIN: { bg: 'bg-amber-500', text: 'text-white', icon: 'text-white', darkBg: 'bg-amber-600', darkText: 'text-white', darkIcon: 'text-white' },
  ADMIN: { bg: 'bg-blue-500', text: 'text-white', icon: 'text-white', darkBg: 'bg-blue-600', darkText: 'text-white', darkIcon: 'text-white' },
  MANAGER: { bg: 'bg-purple-500', text: 'text-white', icon: 'text-white', darkBg: 'bg-purple-600', darkText: 'text-white', darkIcon: 'text-white' },
  FINANCE_MANAGER: { bg: 'bg-green-500', text: 'text-white', icon: 'text-white', darkBg: 'bg-green-600', darkText: 'text-white', darkIcon: 'text-white' },
  PHOTOGRAPHER: { bg: 'bg-cyan-500', text: 'text-white', icon: 'text-white', darkBg: 'bg-cyan-600', darkText: 'text-white', darkIcon: 'text-white' },
  USER: { bg: 'bg-gray-500', text: 'text-white', icon: 'text-white', darkBg: 'bg-gray-600', darkText: 'text-white', darkIcon: 'text-white' },
};

type UserFilter = 'ALL' | 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'FINANCE_MANAGER' | 'USER' | 'PHOTOGRAPHER';

export default function SuperAdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserFilter>('ALL');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'USER',
    adminRoleId: '',
    department: '',
    title: '',
  });

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
      fetchData();
    }
  }, [pagination.page, search, filter, status, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('search', search);
      if (filter !== 'ALL') params.set('role', filter);

      const [usersRes, rolesRes, permsRes] = await Promise.all([
        fetch(`/api/admin/superadmin/users?${params}`),
        fetch('/api/admin/superadmin/roles'),
        fetch('/api/admin/superadmin/permissions'),
      ]);

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      if (usersRes.ok) {
        setUsers(usersData.users || []);
        setPagination(prev => ({
          ...prev,
          total: usersData.pagination?.total || 0,
          pages: usersData.pagination?.pages || 0,
        }));
      }
      
      if (rolesRes.ok) {
        setRoles(rolesData.roles || []);
      }
      
      if (permsRes.ok) {
        setAllPermissions(permsData.permissions || []);
        setGroupedPermissions(permsData.grouped || {});
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = selectedUser 
        ? `/api/admin/superadmin/users/${selectedUser.id}`
        : '/api/admin/superadmin/users';
      
      const method = selectedUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setShowModal(false);
        setSelectedUser(null);
        resetForm();
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      setProcessingId(userId);
      const res = await fetch(`/api/admin/superadmin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleLockToggle = async (user: User) => {
    try {
      setProcessingId(user.id);
      const res = await fetch(`/api/admin/superadmin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          locked: !user.adminProfile?.lockedUntil 
        }),
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error toggling lock:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string, adminRoleId?: string) => {
    try {
      setProcessingId(userId);
      const res = await fetch(`/api/admin/superadmin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: newRole,
          adminRoleId: adminRoleId || null,
        }),
      });
      
      if (res.ok) {
        fetchData();
        setShowRoleModal(false);
        setSelectedUser(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleTogglePermission = async (permissionId: string, hasPermission: boolean) => {
    if (!selectedUser) return;
    
    try {
      const method = hasPermission ? 'DELETE' : 'POST';
      const res = await fetch(`/api/admin/superadmin/users/${selectedUser.id}/permissions`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionId }),
      });
      
      if (res.ok) {
        const newPerms = hasPermission
          ? userPermissions.filter(p => p !== permissionId)
          : [...userPermissions, permissionId];
        setUserPermissions(newPerms);
      }
    } catch (error) {
      console.error('Error toggling permission:', error);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name || '',
      phone: user.phone || '',
      role: user.role,
      adminRoleId: user.adminProfile?.adminRole?.id || '',
      department: user.adminProfile?.department || '',
      title: user.adminProfile?.title || '',
    });
    setShowModal(true);
  };

  const openPermissionsModal = async (user: User) => {
    setSelectedUser(user);
    try {
      const res = await fetch(`/api/admin/superadmin/users/${user.id}/permissions`);
      const data = await res.json();
      if (res.ok) {
        setUserPermissions(data.userPermissions || []);
        setShowPermissionsModal(true);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'USER',
      adminRoleId: '',
      department: '',
      title: '',
    });
  };

  // Stats calculation
  const totalUsers = pagination.total;
  const activeUsers = users.filter(u => !u.adminProfile?.lockedUntil).length;
  const adminCount = users.filter(u => ['SUPERADMIN', 'ADMIN', 'MANAGER', 'FINANCE_MANAGER'].includes(u.role)).length;

  if (status === 'loading' || loading && users.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
          <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4`}></div>
          <p className={theme.mutedText}>Loading users...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'SUPERADMIN') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
        <div className="text-center">
          <AlertCircle className={`w-12 h-12 text-red-500 mx-auto mb-4`} />
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
            <div className={`p-3 ${iconColors.info.replace('text-blue-600', 'text-primary').replace('bg-blue-100', 'bg-primary/10').replace('dark:bg-blue-900 dark:text-blue-300', 'dark:bg-primary/20')}`}>
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className={adminLayout.pageTitle}>User Management</h1>
              <p className={adminLayout.pageSubtitle}>Central hub for managing all users, roles, and permissions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
              <button
              onClick={fetchData}
              className={`flex items-center gap-2 px-4 py-2 ${theme.secondary} ${theme.secondaryForeground} rounded-lg hover:opacity-80 transition-opacity`}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => {
                setSelectedUser(null);
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email, name, or phone..."
              className={`w-full pl-10 pr-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-primary focus:border-primary`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'SUPERADMIN', 'ADMIN', 'MANAGER', 'FINANCE_MANAGER', 'USER', 'PHOTOGRAPHER'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  filter === f 
                    ? 'bg-primary text-primary-foreground' 
                    : `${theme.secondary} ${theme.secondaryForeground} hover:opacity-80`
                }`}
              >
                {f === 'ALL' && 'All'}
                {f === 'SUPERADMIN' && 'SuperAdmin'}
                {f === 'ADMIN' && 'Admin'}
                {f === 'MANAGER' && 'Manager'}
                {f === 'FINANCE_MANAGER' && 'Finance'}
                {f === 'USER' && 'Users'}
                {f === 'PHOTOGRAPHER' && 'Photographers'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={adminLayout.statsGrid}>
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${iconColors.primary}`}>
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
            <div className={`p-2 ${iconColors.success}`}>
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className={`text-sm ${theme.mutedText}`}>Active</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>{activeUsers}</p>
            </div>
          </div>
        </div>
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${iconColors.purple}`}>
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
            <div className={`p-2 ${iconColors.warning}`}>
              <Key className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className={`text-sm ${theme.mutedText}`}>Special Permissions</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>
                {users.filter(u => u.adminProfile?.permissions && u.adminProfile.permissions.length > 0).length}
              </p>
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
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="divide-y">
            {users.map((user) => {
              const RoleIcon = roleIcons[user.role] || User;
              const colors = roleColors[user.role] || roleColors.USER;
              const isLocked = !!user.adminProfile?.lockedUntil;
              
              return (
                <div key={user.id} className={`p-4 ${theme.tableRowHover} transition-colors`}>
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-12-full flex items-center h-12 rounded justify-center ${colors.bg} dark:${colors.darkBg || ''}`}>
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
                          {user.role.replace('_', ' ')}
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
                      {(user.adminProfile?.title || user.adminProfile?.department) && (
                        <div className={`text-sm ${theme.mutedText}`}>
                          {user.adminProfile.title} {user.adminProfile.department && `• ${user.adminProfile.department}`}
                          {user.adminProfile?.adminRole && (
                            <span className="ml-2 text-primary">({user.adminProfile.adminRole.name})</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Extra Permissions Badge */}
                    {user.adminProfile?.permissions && user.adminProfile.permissions.length > 0 && (
                      <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-lg">
                        <Key className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary">{user.adminProfile.permissions.length} extra perms</span>
                      </div>
                    )}

                    {/* Last Login */}
                    <div className={`hidden lg:block text-sm ${theme.mutedText}`}>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {user.adminProfile?.lastLoginAt
                          ? new Date(user.adminProfile.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </div>

                    {/* Status */}
                    {isLocked ? (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> Active
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(user)}
                        className={`p-2 ${theme.primary} hover:bg-primary/10 rounded-lg transition-colors`}
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {/* Role Management Button */}
                      {user.id !== session.user.id && (
                        <button
                          onClick={() => openRoleModal(user)}
                          className={`p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors`}
                          title="Change role"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Permissions Button (for admin users) */}
                      {['ADMIN', 'SUPERADMIN', 'MANAGER', 'FINANCE_MANAGER'].includes(user.role) && (
                        <button
                          onClick={() => openPermissionsModal(user)}
                          className={`p-2 ${theme.primary} hover:bg-primary/10 rounded-lg transition-colors`}
                          title="Manage permissions"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Lock/Unlock Button */}
                      {user.id !== session.user.id && user.role !== 'SUPERADMIN' && (
                        <button
                          onClick={() => handleLockToggle(user)}
                          disabled={processingId === user.id}
                          className={`p-2 rounded-lg transition-colors ${
                            isLocked
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                          title={isLocked ? 'Unlock user' : 'Lock user'}
                        >
                          {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      )}
                      
                      {/* Delete Button */}
                      {user.id !== session.user.id && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={processingId === user.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
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
          <div className={`flex items-center justify-between px-6 py-4 border-t ${theme.muted}`}>
            <div className={`text-sm ${theme.mutedText}`}>
              Page {pagination.page} of {pagination.pages} ({pagination.total} users)
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-lg border ${theme.card} hover:bg-gray-50 disabled:opacity-50`}
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded-lg border ${theme.card} hover:bg-gray-50 disabled:opacity-50`}
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.cardStyle} w-full max-w-md max-h-[90vh] overflow-y-auto`}>
            <div className={`flex items-center justify-between p-6 ${theme.border}`}>
              <h2 className={`text-xl font-bold ${theme.heading}`}>
                {selectedUser ? 'Edit User' : 'Create New User'}
              </h2>
              <button onClick={() => { setShowModal(false); setSelectedUser(null); }} className={`p-2 hover:bg-gray-100 rounded-lg`}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Email *</label>
                <input
                  type="email"
                  required
                  disabled={!!selectedUser}
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-primary disabled:bg-muted`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              
              {!selectedUser && (
                <div>
                  <label className={`block text-sm font-medium ${theme.body} mb-1`}>Password *</label>
                  <input
                    type="password"
                    required
                    className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-primary`}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}
              
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Name</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-primary`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Phone</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-primary`}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Role *</label>
                <select
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-blue-500 ${theme.card}`}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="USER">User</option>
                  <option value="PHOTOGRAPHER">Photographer</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="FINANCE_MANAGER">Finance Manager</option>
                  <option value="SUPERADMIN">SuperAdmin</option>
                </select>
              </div>
              
              {['ADMIN', 'MANAGER', 'FINANCE_MANAGER'].includes(formData.role) && (
                <>
                  <div>
                    <label className={`block text-sm font-medium ${theme.body} mb-1`}>Admin Role</label>
                    <select
                      className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-blue-500 ${theme.card}`}
                      value={formData.adminRoleId}
                      onChange={(e) => setFormData({ ...formData, adminRoleId: e.target.value })}
                    >
                      <option value="">Select a role...</option>
                      {roles.filter(r => !r.isSuperRole).map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${theme.body} mb-1`}>Department</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-primary`}
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${theme.body} mb-1`}>Title</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-primary`}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setSelectedUser(null); }}
                  className={`px-4 py-2 ${theme.secondary} ${theme.secondaryForeground} rounded-lg hover:opacity-80`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  {selectedUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.cardStyle} w-full max-w-md`}>
            <div className={`flex items-center justify-between p-6 ${theme.border}`}>
              <div>
                <h2 className={`text-xl font-bold ${theme.heading}`}>Change User Role</h2>
                <p className={`text-sm ${theme.mutedText}`}>{selectedUser.name || selectedUser.email}</p>
              </div>
              <button onClick={() => { setShowRoleModal(false); setSelectedUser(null); }} className={`p-2 hover:bg-gray-100 rounded-lg`}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className={`text-sm ${theme.mutedText} mb-4`}>Select a new role for this user:</p>
              
              {['USER', 'PHOTOGRAPHER', 'ADMIN', 'MANAGER', 'FINANCE_MANAGER'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleUpdateRole(selectedUser.id, role)}
                  disabled={processingId === selectedUser.id || selectedUser.role === role}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    selectedUser.role === role
                      ? 'border-primary bg-primary/10'
                      : `${theme.border} hover:border-primary/30 hover:bg-muted`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roleColors[role]?.bg || 'bg-gray-100'} dark:${roleColors[role]?.darkBg || 'dark:bg-gray-800'}`}>
                      {React.createElement(roleIcons[role] || User, { className: `w-5 h-5 ${roleColors[role]?.icon || 'text-gray-600'} dark:${roleColors[role]?.darkIcon || 'dark:text-gray-400'}` })}
                    </div>
                    <div>
                      <div className={`font-medium ${theme.heading}`}>{role.replace('_', ' ')}</div>
                      <div className={`text-xs ${theme.mutedText}`}>
                        {role === 'USER' && 'Basic user account'}
                        {role === 'PHOTOGRAPHER' && 'Can upload and sell photos'}
                        {role === 'ADMIN' && 'Administrative access'}
                        {role === 'MANAGER' && 'Management-level access'}
                        {role === 'FINANCE_MANAGER' && 'Financial management access'}
                      </div>
                    </div>
                    {selectedUser.role === role && (
                      <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </div>
                </button>
              ))}
              
              {/* SuperAdmin option - with extra caution */}
              {session?.user?.role === 'SUPERADMIN' && selectedUser.role !== 'SUPERADMIN' && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to make this user a SUPERADMIN? This gives them full system access.')) {
                      handleUpdateRole(selectedUser.id, 'SUPERADMIN');
                    }
                  }}
                  disabled={processingId === selectedUser.id}
                  className="w-full p-4 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:hover:bg-amber-900 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900">
                      <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="font-medium text-amber-700 dark:text-amber-300">SuperAdmin</div>
                      <div className="text-xs text-amber-600 dark:text-amber-400">Full system access - use with caution</div>
                    </div>
                  </div>
                </button>
              )}
            </div>
            <div className={`flex justify-end p-6 border-t ${theme.muted}`}>
              <button
                onClick={() => { setShowRoleModal(false); setSelectedUser(null); }}
                className={`px-4 py-2 ${theme.secondary} ${theme.secondaryForeground} rounded-lg hover:opacity-80`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.cardStyle} w-full max-w-2xl max-h-[80vh] overflow-hidden`}>
            <div className={`flex items-center justify-between p-6 ${theme.border}`}>
              <div>
                <h2 className={`text-xl font-bold ${theme.heading}`}>User Permissions</h2>
                <p className={`text-sm ${theme.mutedText}`}>
                  {selectedUser.name || selectedUser.email} - {selectedUser.role}
                </p>
              </div>
              <button onClick={() => { setShowPermissionsModal(false); setSelectedUser(null); }} className={`p-2 hover:bg-gray-100 rounded-lg`}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className={`${theme.muted} border ${theme.border} rounded-lg p-4 mb-4`}>
                <p className={`text-sm ${theme.body}`}>
                  <strong>Note:</strong> These are additional permissions granted directly to this user beyond their role permissions.
                  Role permissions are automatically assigned based on the user&apos;s role.
                </p>
              </div>
              
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="mb-6">
                  <h3 className={`font-medium text-sm ${theme.body} capitalize mb-2 flex items-center gap-2`}>
                    <Shield className="w-4 h-4" />
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {perms.map((perm) => {
                      const hasPermission = userPermissions.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            hasPermission 
                              ? 'border-green-200 bg-green-50' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={hasPermission}
                            onChange={() => handleTogglePermission(perm.id, hasPermission)}
                            className="w-4 h-4 text-primary rounded"
                          />
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${theme.heading}`}>{perm.name}</span>
                            {perm.description && (
                              <p className={`text-xs ${theme.mutedText}`}>{perm.description}</p>
                            )}
                          </div>
                          {hasPermission && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {allPermissions.length === 0 && (
                <div className={`text-center py-8 ${theme.mutedText}`}>
                  <ShieldOff className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No permissions available</p>
                </div>
              )}
            </div>
            <div className={`flex justify-end p-6 border-t ${theme.muted}`}>
              <button
                onClick={() => { setShowPermissionsModal(false); setSelectedUser(null); }}
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
