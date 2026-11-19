'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { theme, iconColors, adminLayout } from '@/lib/admin-theme';
import {
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Key,
  X,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Crown
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isSuperRole: boolean;
  _count: {
    admins: number;
  };
  permissions: {
    permission: Permission;
  }[];
}

export default function RolesManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[],
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
  }, [status, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/admin/superadmin/roles'),
        fetch('/api/admin/superadmin/permissions'),
      ]);

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      if (rolesRes.ok) {
        setRoles(rolesData.roles || []);
      }
      if (permsRes.ok) {
        setPermissions(permsData.permissions || []);
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
      const url = editingRole 
        ? `/api/admin/superadmin/roles/${editingRole.id}`
        : '/api/admin/superadmin/roles';
      
      const method = editingRole ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissionIds: formData.permissionIds,
        }),
      });
      
      if (res.ok) {
        setShowModal(false);
        setEditingRole(null);
        resetForm();
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Failed to save role');
    }
  };

  const handleDelete = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the "${roleName}" role?`)) return;
    if (roleName === 'SuperAdmin') {
      alert('Cannot delete SuperAdmin role');
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/superadmin/roles/${roleId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions.map(p => p.permission.id),
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissionIds: [],
    });
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter(id => id !== permId)
        : [...prev.permissionIds, permId],
    }));
  };

  // Filter roles based on search
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  if (status === 'loading' || loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className={theme.mutedText}>Loading roles...</p>
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
            <div className={`p-3 ${iconColors.primary} rounded-xl`}>
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className={adminLayout.pageTitle}>Role Management</h1>
              <p className={adminLayout.pageSubtitle}>Configure roles and their permissions</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingRole(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Role
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-primary focus:border-primary`}
          />
        </div>
      </div>

      {/* Stats */}
        <div className={adminLayout.statsGrid}>
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${iconColors.primary}`}>
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className={`text-sm ${theme.mutedText}`}>Total Roles</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>{roles.length}</p>
            </div>
          </div>
        </div>
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${iconColors.success}`}>
              <Key className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className={`text-sm ${theme.mutedText}`}>Total Permissions</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>{permissions.length}</p>
            </div>
          </div>
        </div>
        <div className={`${theme.cardStyle} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${iconColors.warning}`}>
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className={`text-sm ${theme.mutedText}`}>Active Admins</p>
              <p className={`text-2xl font-bold ${theme.heading}`}>
                {roles.reduce((sum, r) => sum + r._count.admins, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      {filteredRoles.length === 0 ? (
        <div className={`${theme.cardStyle} p-12 text-center`}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className={`text-lg font-semibold ${theme.heading}`}>No roles found</h3>
          <p className={`mt-2 ${theme.mutedText}`}>Try adjusting your search or create a new role.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => (
            <div key={role.id} className={`${theme.cardStyle} ${theme.cardHover}`}>
              <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${role.isSuperRole ? 'bg-amber-100 dark:bg-amber-900' : 'bg-primary/10 dark:bg-primary/20'}`}>
                      <Shield className={`w-5 h-5 ${role.isSuperRole ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${theme.heading}`}>{role.name}</h3>
                      {role.isSuperRole && (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                          <Crown className="w-3 h-3" /> SuperAdmin
                        </span>
                      )}
                      {role.isDefault && !role.isSuperRole && (
                        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1 dark:bg-primary/20">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className={`${theme.mutedText} text-sm mb-4`}>{role.description || 'No description'}</p>

                <div className={`flex items-center gap-4 mb-4 text-sm ${theme.mutedText}`}>
                  <div className={`flex items-center gap-1 ${theme.mutedText}`}>
                    <Users className="w-4 h-4" />
                    <span>{role._count.admins} admin{role._count.admins !== 1 ? 's' : ''}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${theme.mutedText}`}>
                    <Key className="w-4 h-4" />
                    <span>{role.permissions.length} perm{role.permissions.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Permission Tags */}
                <div className="flex flex-wrap gap-1 mb-4 min-h-[24px]">
                  {role.permissions.slice(0, 3).map((p) => (
                    <span key={p.permission.id} className={`inline-flex items-center gap-1 text-xs ${theme.secondary} ${theme.secondaryForeground} px-2 py-1 rounded`}>
                      {p.permission.name}
                    </span>
                  ))}
                  {role.permissions.length > 3 && (
                    <span className={`inline-flex items-center gap-1 text-xs ${theme.secondary} ${theme.secondaryForeground} px-2 py-1 rounded`}>
                      +{role.permissions.length - 3} more
                    </span>
                  )}
                  {role.permissions.length === 0 && (
                    <span className={`text-xs ${theme.mutedText}`}>No permissions</span>
                  )}
                </div>

                {/* Actions */}
                <div className={`flex gap-2 pt-2 border-t ${theme.border}`}>
                  <button
                    onClick={() => openEditModal(role)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary bg-primary/10 hover:bg-primary/20 dark:hover:bg-primary/30 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  {role.name !== 'SuperAdmin' && role._count.admins === 0 && (
                    <button
                      onClick={() => handleDelete(role.id, role.name)}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.cardStyle} w-full max-w-3xl max-h-[90vh] overflow-hidden`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 ${theme.border}`}>
              <h2 className={`text-xl font-bold ${theme.heading}`}>
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 hover:bg-muted rounded-lg transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Role Name */}
                  <div>
                    <label className={`block text-sm font-medium ${theme.body} mb-2`}>
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-primary focus:border-primary`}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      disabled={!!editingRole}
                      placeholder="e.g., Content Manager"
                    />
                    {editingRole && (
                      <p className={`text-xs ${theme.mutedText} mt-1`}>Role name cannot be changed</p>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className={`block text-sm font-medium ${theme.body} mb-2`}>
                      Description
                    </label>
                    <textarea
                      className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-primary focus:border-primary`}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Describe what this role can do..."
                    />
                  </div>

                  {/* Permissions Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className={`block text-sm font-medium ${theme.body}`}>
                        Permissions
                      </label>
                      <span className={`text-sm ${theme.mutedText}`}>
                        {formData.permissionIds.length} selected
                      </span>
                    </div>
                    <div className={`border ${theme.border} rounded-lg overflow-hidden`}>
                      {Object.entries(groupedPermissions).map(([category, perms], categoryIndex) => (
                        <div key={category} className={categoryIndex > 0 ? `border-t ${theme.border}` : ''}>
                          <div className={`${theme.muted} px-4 py-2 flex items-center gap-2`}>
                            <Filter className="w-4 h-4" />
                            <span className={`font-medium text-sm ${theme.body} capitalize`}>{category}</span>
                            <span className={`text-xs ${theme.mutedText}`}>({perms.length})</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border">
                            {perms.map((perm) => (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-3 p-3 ${theme.card} hover:bg-muted cursor-pointer transition-colors`}
                              >
                                <input
                                  type="checkbox"
                                  className="mt-1 w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                  checked={formData.permissionIds.includes(perm.id)}
                                  onChange={() => togglePermission(perm.id)}
                                />
                                <div className="flex-1">
                                  <span className={`text-sm font-medium ${theme.heading}`}>{perm.name}</span>
                                  {perm.description && (
                                    <p className={`text-xs ${theme.mutedText} mt-0.5`}>{perm.description}</p>
                                  )}
                                </div>
                                {formData.permissionIds.includes(perm.id) && (
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className={`flex items-center justify-end gap-3 p-6 border-t ${theme.muted}`}>
            <button 
              type="button" 
              className={`px-4 py-2 ${theme.card} ${theme.body} border ${theme.border} rounded-lg hover:bg-muted transition-colors`}
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
            >
                {editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

