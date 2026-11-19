'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { theme, iconColors, adminLayout } from '@/lib/admin-theme';
import {
  Shield, 
  Key,
  Search,
  RefreshCw,
  Check,
  X,
  Info,
  Plus,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

const CATEGORIES = [
  'users',
  'admins',
  'content',
  'orders',
  'payments',
  'payouts',
  'revenue',
  'reversals',
  'photographers',
  'services',
  'corporate',
  'analytics',
  'settings',
  'promocodes',
  'subscriptions',
  'messages',
];

export default function PermissionsManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'users',
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'SUPERADMIN') {
      router.push('/admin');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'SUPERADMIN' && status === 'authenticated') {
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const permsRes = await fetch('/api/admin/superadmin/permissions');
      const permsData = await permsRes.json();

      if (permsRes.ok) {
        setPermissions(permsData.permissions || []);
        setGroupedPermissions(permsData.grouped || {});
      } else {
        console.error('Error fetching permissions:', permsData.error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReseed = async () => {
    if (!confirm('This will re-seed all permissions and roles from the system defaults. Continue?')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/superadmin/permissions/reseed', {
        method: 'POST',
      });
      const data = await res.json();
      
      if (res.ok) {
        alert('Permissions and roles re-seeded successfully!');
        fetchData();
      } else {
        alert(data.error || 'Failed to re-seed permissions');
      }
    } catch (error) {
      console.error('Error re-seeding:', error);
      alert('Failed to re-seed permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingPermission 
        ? `/api/admin/superadmin/permissions/${editingPermission.id}`
        : '/api/admin/superadmin/permissions';
      
      const method = editingPermission ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        setEditingPermission(null);
        resetForm();
        fetchData();
      } else {
        alert(data.error || 'Failed to save permission');
      }
    } catch (error) {
      console.error('Error saving permission:', error);
      alert('Failed to save permission');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (permission: Permission) => {
    if (!confirm(`Are you sure you want to delete the permission "${permission.name}"? This action cannot be undone.`)) return;
    
    setDeletingId(permission.id);
    try {
      const res = await fetch(`/api/admin/superadmin/permissions/${permission.id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete permission');
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
      alert('Failed to delete permission');
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      name: permission.name,
      description: permission.description || '',
      category: permission.category,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingPermission(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'users',
    });
  };

  // Filter permissions
  const filteredPermissions = permissions.filter(perm => {
    const matchesSearch = perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (perm.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === 'all' || perm.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Object.keys(groupedPermissions).sort();

  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userRole = session?.user?.role;
  if (userRole !== 'SUPERADMIN') {
    return null;
  }

  return (
    <div className={`p-6 min-h-screen ${theme.background}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-3 ${iconColors.success} rounded-xl`}>
            <Key className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className={adminLayout.pageTitle}>Permission Management</h1>
            <p className={adminLayout.pageSubtitle}>View, create, edit, and delete system permissions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Add Permission
          </button>
          <button
            onClick={handleReseed}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Re-seed
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`${theme.cardStyle} p-4 mb-6`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className={adminLayout.statsGrid}>
        <div className={`${theme.cardStyle} p-4`}>
          <div className={`text-sm ${theme.mutedText}`}>Total Permissions</div>
          <div className={`text-2xl font-bold ${theme.heading}`}>{permissions.length}</div>
        </div>
        <div className={`${theme.cardStyle} p-4`}>
          <div className={`text-sm ${theme.mutedText}`}>Categories</div>
          <div className={`text-2xl font-bold ${theme.heading}`}>{categories.length}</div>
        </div>
        <div className={`${theme.cardStyle} p-4`}>
          <div className={`text-sm ${theme.mutedText}`}>Filtered Results</div>
          <div className={`text-2xl font-bold ${theme.heading}`}>{filteredPermissions.length}</div>
        </div>
        <div className={`${theme.cardStyle} p-4`}>
          <div className={`text-sm ${theme.mutedText}`}>SuperAdmin Role</div>
          <div className="flex items-center gap-2 mt-1">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">Has All Permissions</span>
          </div>
        </div>
      </div>

      {/* Permissions by Category */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {(selectedCategory === 'all' ? categories : [selectedCategory]).map(category => {
            const categoryPerms = selectedCategory === 'all' 
              ? groupedPermissions[category] || []
              : filteredPermissions;
            
            if (selectedCategory !== 'all' && category !== selectedCategory) return null;
            
            return (
              <div key={category} className={`${theme.cardStyle} overflow-hidden`}>
                <div className={`${theme.muted} px-6 py-3 border-b ${theme.border}`}>
                  <h2 className={`text-lg font-semibold ${theme.heading} capitalize`}>{category}</h2>
                  <p className={`text-sm ${theme.mutedText}`}>{categoryPerms.length} permission(s)</p>
                </div>
                <div className="divide-y">
                  {categoryPerms.map(perm => (
                    <div key={perm.id} className={`px-6 py-4 ${theme.tableRowHover}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className={`text-sm font-mono ${theme.secondary} ${theme.secondaryForeground} px-2 py-1 rounded text-primary`}>
                              {perm.name}
                            </code>
                          </div>
                          {perm.description && (
                            <p className={`text-sm ${theme.mutedText} mt-1`}>{perm.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(perm)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit permission"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(perm)}
                            disabled={deletingId === perm.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete permission"
                          >
                            {deletingId === perm.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredPermissions.length === 0 && (
            <div className={`text-center py-12 ${theme.mutedText}`}>
              <Info className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No permissions found matching your criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.cardStyle} w-full max-w-md`}>
            <div className={`flex items-center justify-between p-6 ${theme.border}`}>
              <h2 className={`text-xl font-bold ${theme.heading}`}>
                {editingPermission ? 'Edit Permission' : 'Add Permission'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 hover:bg-gray-100 rounded-lg transition-colors`}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-2`}>
                  Permission Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '') })}
                  placeholder="e.g., users.view, custom.action"
                  required
                  disabled={!!editingPermission}
                />
                <p className={`text-xs ${theme.mutedText} mt-1`}>
                  Lowercase letters, numbers, dots, and underscores only
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-2`}>
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="capitalize">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-2`}>
                  Description
                </label>
                <textarea
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this permission allows..."
                  rows={3}
                />
              </div>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${theme.border}`}>
                <button 
                  type="button" 
                  className={`px-4 py-2 ${theme.card} ${theme.body} border ${theme.border} rounded-lg hover:bg-gray-50 transition-colors`}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving || !formData.name || !formData.category}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingPermission ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
