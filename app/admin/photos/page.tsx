"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Check, 
  X, 
  Trash2, 
  Image,
  Filter,
  Search,
  ArrowLeft,
  Loader2
} from "lucide-react";
import {router} from "next/client";

interface Photo {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  isApproved: boolean;
  rejectionReason: string | null;
  createdAt: string;
  photographer: {
    id: string;
    user: {
      name: string | null;
      email: string;
    };
  };
  category: {
    name: string;
  } | null;
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [filter]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === "PENDING") params.set("status", "PENDING");
      if (filter === "APPROVED") params.set("status", "APPROVED");
      if (filter === "REJECTED") params.set("status", "REJECTED");
      
      const res = await fetch(`/api/admin/photos?${params.toString()}`);
      const data = await res.json();
      
      if (data.photos) {
        setPhotos(data.photos);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (photoId: string) => {
    try {
      setProcessingId(photoId);
      const res = await fetch("/api/admin/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, action: "APPROVE" }),
      });

      if (res.ok) {
        fetchPhotos();
      }
    } catch (error) {
      console.error("Error approving photo:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (photoId: string) => {
    const reason = prompt("Enter rejection reason (optional):");
    try {
      setProcessingId(photoId);
      const res = await fetch("/api/admin/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          photoId, 
          action: "REJECT",
          rejectionReason: reason || "Photo does not meet our guidelines"
        }),
      });

      if (res.ok) {
        fetchPhotos();
      }
    } catch (error) {
      console.error("Error rejecting photo:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
      return;
    }
    
    try {
      setProcessingId(photoId);
      const res = await fetch(`/api/admin/photos?photoId=${photoId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchPhotos();
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPhotos = photos.filter(photo => 
    photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    photo.photographer.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    photo.photographer.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost" 
              onClick={() => router.push('/admin')}
              className="text-white hover:bg-red-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Photo Management</h1>
              <p className="text-red-100">Approve, reject, or remove photos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className={filter === f ? "bg-red-600 hover:bg-red-700" : ""}
              >
                {f === "PENDING" && "Pending"}
                {f === "APPROVED" && "Approved"}
                {f === "REJECTED" && "Rejected"}
                {f === "ALL" && "All Photos"}
              </Button>
            ))}
          </div>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by title or photographer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredPhotos.length}</span> photos
            {filter !== "ALL" && ` (${filter.toLowerCase()})`}
          </p>
        </div>

        {/* Photos Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No photos found</h3>
            <p className="text-gray-600">
              {filter === "PENDING" 
                ? "No photos waiting for approval."
                : filter === "APPROVED"
                ? "No approved photos yet."
                : filter === "REJECTED"
                ? "No rejected photos."
                : "No photos in the system."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo) => (
              <div key={photo.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Image */}
                <div className="aspect-video relative bg-gray-100">
                  <img
                    src={photo.thumbnailUrl || photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    {photo.isApproved ? (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Approved
                      </span>
                    ) : photo.rejectionReason ? (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Rejected
                      </span>
                    ) : (
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {photo.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    by {photo.photographer.user.name || photo.photographer.user.email}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-green-600">
                      KES {photo.price.toLocaleString()}
                    </span>
                    {photo.category && (
                      <span className="text-gray-500">
                        {photo.category.name}
                      </span>
                    )}
                  </div>
                  
                  {photo.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                      <strong>Reason:</strong> {photo.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {filter === "PENDING" && (
                  <div className="border-t px-4 py-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(photo.id)}
                      disabled={processingId === photo.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processingId === photo.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(photo.id)}
                      disabled={processingId === photo.id}
                      className="flex-1"
                    >
                      {processingId === photo.id ? (
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
                
                <div className="border-t px-4 py-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(photo.id)}
                    disabled={processingId === photo.id}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {processingId === photo.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Photo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
