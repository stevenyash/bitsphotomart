"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Eye,
  Trash2,
  Star,
  Video
} from "lucide-react";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string | null;
  price: number;
  status: string;
  isFeatured: boolean;
  isApproved: boolean;
  viewCount: number;
  downloadCount: number;
  quality: string;
  duration: number;
  photographer: {
    user: {
      name: string | null;
      email: string;
    };
  };
  createdAt: string | null;
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  useEffect(() => {
    fetchVideos();
  }, [search, statusFilter, pagination.page]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/admin/videos?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setVideos(data.videos);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (videoId: string, status: string) => {
    try {
      const response = await fetch("/api/admin/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, status }),
      });

      if (response.ok) {
        fetchVideos();
      }
    } catch (error) {
      console.error("Error updating video status:", error);
    }
  };

  const handleFeatureToggle = async (videoId: string, isFeatured: boolean) => {
    try {
      const response = await fetch("/api/admin/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, isFeatured: !isFeatured }),
      });

      if (response.ok) {
        fetchVideos();
      }
    } catch (error) {
      console.error("Error toggling featured status:", error);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/videos?videoId=${videoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchVideos();
      }
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-600">Rejected</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case "EXPIRED":
        return <Badge className="bg-gray-600">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case "UHD_4K":
        return <Badge className="bg-purple-600">4K</Badge>;
      case "UHD_8K":
        return <Badge className="bg-indigo-600">8K</Badge>;
      case "FULL_HD":
        return <Badge className="bg-blue-600">Full HD</Badge>;
      case "HD":
        return <Badge className="bg-cyan-600">HD</Badge>;
      default:
        return <Badge className="bg-gray-600">SD</Badge>;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Video className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Video Management</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              {statusFilter === "all" ? "All Status" : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("PENDING")}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("APPROVED")}>
              Approved
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("REJECTED")}>
              Rejected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Videos Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Video</TableHead>
              <TableHead>Photographer</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : videos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No videos found
                </TableCell>
              </TableRow>
            ) : (
              videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{video.title}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {video.description || "No description"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {video.photographer?.user?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {video.photographer?.user?.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{video.category}</Badge>
                  </TableCell>
                  <TableCell>
                    KES {video.price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getQualityBadge(video.quality)}
                  </TableCell>
                  <TableCell>
                    {formatDuration(video.duration)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span>{video.viewCount} views</span>
                      <br />
                      <span>{video.downloadCount} downloads</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(video.status)}
                      {video.isFeatured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Link
                            href={`/gallery/videos/${video.id}`}
                            className="flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        {video.status === "PENDING" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(video.id, "APPROVED")}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(video.id, "REJECTED")}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {video.status === "APPROVED" && (
                          <DropdownMenuItem
                            onClick={() => handleFeatureToggle(video.id, video.isFeatured)}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {video.isFeatured ? "Remove Featured" : "Mark Featured"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(video.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
