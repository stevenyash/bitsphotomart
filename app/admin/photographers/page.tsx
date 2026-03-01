"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Check, 
  X, 
  User,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  Loader2,
  Camera,
  MessageSquare
} from "lucide-react";

interface Photographer {
  id: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    avatar: string | null;
    createdAt: string;
  };
}

export default function AdminPhotographersPage() {
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "ALL">("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotographers();
  }, [filter]);

  const fetchPhotographers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "PENDING") {
        params.set("status", filter);
      }
      
      const res = await fetch(`/api/admin/photographers?${params.toString()}`);
      const data = await res.json();
      
      setPhotographers(data);
    } catch (error) {
      console.error("Error fetching photographers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (photographerId: string) => {
    try {
      setProcessingId(photographerId);
      const res = await fetch("/api/admin/photographers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photographerId, action: "APPROVE" }),
      });

      if (res.ok) {
        fetchPhotographers();
      }
    } catch (error) {
      console.error("Error approving photographer:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (photographerId: string) => {
    if (!confirm("Are you sure you want to reject this photographer application?")) {
      return;
    }
    
    try {
      setProcessingId(photographerId);
      const res = await fetch("/api/admin/photographers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photographerId, action: "REJECT", notes: rejectNotes }),
      });

      if (res.ok) {
        fetchPhotographers();
        setShowRejectModal(false);
        setRejectNotes("");
        setRejectingId(null);
      }
    } catch (error) {
      console.error("Error rejecting photographer:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (photographerId: string) => {
    setRejectingId(photographerId);
    setShowRejectModal(true);
    setRejectNotes("");
  };

  const filteredPhotographers = photographers.filter(p => 
    p.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/admin'}
              className="text-white hover:bg-red-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Photographer Applications</h1>
              <p className="text-red-100">Review and manage photographer applications</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            {(["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "ALL"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className={filter === f ? "bg-red-600 hover:bg-red-700" : ""}
              >
                {f === "PENDING" && "Pending"}
                {f === "APPROVED" && "Approved"}
                {f === "REJECTED" && "Rejected"}
                {f === "SUSPENDED" && "Suspended"}
              </Button>
            ))}
          </div>
          
          <div className="flex-1 relative">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredPhotographers.length}</span> applications
            {!(filter === "PENDING" || filter === "ALL" || !` (${filter.toLowerCase()})`)}
          </p>
        </div>

        {/* Photographers List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : filteredPhotographers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No photographer applications</h3>
            <p className="text-gray-600">
              {filter === "PENDING" 
                ? "No pending applications to review."
                : `No ${filter.toLowerCase()} photographers.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPhotographers.map((photographer) => (
              <div 
                key={photographer.id} 
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {photographer.user.avatar ? (
                      <img
                        src={photographer.user.avatar}
                        alt={photographer.user.name || "Photographer"}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {photographer.user.name || "No name"}
                      </h3>
                      {photographer.status === "PENDING" && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Pending
                        </span>
                      )}
                      {photographer.status === "APPROVED" && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Approved
                        </span>
                      )}
                      {photographer.status === "REJECTED" && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                          Rejected
                        </span>
                      )}
                      {photographer.status === "SUSPENDED" && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          Suspended
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{photographer.user.email}</span>
                      </div>
                      {photographer.user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{photographer.user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Applied: {new Date(photographer.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {photographer.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(photographer.id)}
                        disabled={processingId === photographer.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingId === photographer.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openRejectModal(photographer.id)}
                        disabled={processingId === photographer.id}
                      >
                        {processingId === photographer.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Photographer Application</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection (optional):</p>
            <textarea
              className="w-full border rounded-md p-3 mb-4 h-24 resize-none"
              placeholder="Enter reason for rejection..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingId(null);
                  setRejectNotes("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => rejectingId && handleReject(rejectingId)}
                disabled={processingId === rejectingId}
                className="bg-red-600 hover:bg-red-700"
              >
                {processingId === rejectingId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm Reject"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
