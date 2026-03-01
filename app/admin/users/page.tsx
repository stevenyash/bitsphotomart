"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  Loader2,
  UserCog,
  Trash2,
  Shield,
  Camera,
  CheckCircle,
  XCircle,
  Search
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
  photographer?: {
    id: string;
    status: string;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "USER" | "PHOTOGRAPHER" | "ADMIN">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchUsers();
  }, [filter, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "ALL") {
        params.set("role", filter);
      }
      params.set("page", pagination.page.toString());
      params.set("limit", "20");
      if (searchTerm) {
        params.set("search", searchTerm);
      }
      
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchUsers();
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }
    
    try {
      setProcessingId(userId);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user role:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    
    try {
      setProcessingId(userId);
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Admin</span>;
      case "PHOTOGRAPHER":
        return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Photographer</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">User</span>;
    }
  };

  const getPhotographerStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "APPROVED":
        return <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="h-3 w-3" /> Approved</span>;
      case "PENDING":
        return <span className="flex items-center gap-1 text-yellow-600 text-xs"><Loader2 className="h-3 w-3" /> Pending</span>;
      case "REJECTED":
        return <span className="flex items-center gap-1 text-red-600 text-xs"><XCircle className="h-3 w-3" /> Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-red-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/admin'}
              className="text-white hover:bg-red-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-red-100 text-lg">Manage all users, photographers, and roles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            {(["ALL", "USER", "PHOTOGRAPHER", "ADMIN"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                onClick={() => { setFilter(f); setPagination({ ...pagination, page: 1 }); }}
                className={filter === f ? "bg-red-600 hover:bg-red-700" : ""}
              >
                {f === "ALL" && "All Users"}
                {f === "USER" && "Users"}
                {f === "PHOTOGRAPHER" && "Photographers"}
                {f === "ADMIN" && "Admins"}
              </Button>
            ))}
          </div>
          
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-red-600 hover:bg-red-700">
              Search
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{users.length}</span> of <span className="font-semibold">{pagination.total}</span> users
            {pagination.pages > 1 && ` (Page ${pagination.page} of ${pagination.pages})`}
          </p>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try a different search term." : "No users in the system yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div 
                key={user.id} 
                className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || "User"}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserCog className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.name || "No name"}
                      </h3>
                      {getRoleBadge(user.role)}
                      {user.isVerified && (
                        <span className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                      {user.photographer && (
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          <span>Photographer: </span>
                          {getPhotographerStatusBadge(user.photographer.status)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {user.role !== "ADMIN" && (
                      <>
                        {user.role === "USER" && (
                          <Button
                            variant="outline"
                            onClick={() => handleUpdateRole(user.id, "PHOTOGRAPHER")}
                            disabled={processingId === user.id}
                            className="text-amber-600 border-amber-600 hover:bg-amber-50"
                          >
                            {processingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Camera className="h-4 w-4 mr-1" />
                                Make Photographer
                              </>
                            )}
                          </Button>
                        )}
                        {user.role === "PHOTOGRAPHER" && (
                          <Button
                            variant="outline"
                            onClick={() => handleUpdateRole(user.id, "USER")}
                            disabled={processingId === user.id}
                          >
                            {processingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserCog className="h-4 w-4 mr-1" />
                                Remove Photographer
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateRole(user.id, "ADMIN")}
                          disabled={processingId === user.id}
                          className="text-purple-600 border-purple-600 hover:bg-purple-50"
                        >
                          {processingId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-1" />
                              Make Admin
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={processingId === user.id}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          {processingId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
