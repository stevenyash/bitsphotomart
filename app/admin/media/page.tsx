"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Trash2, 
  Folder, 
  Image, 
  Video, 
  FileText, 
  Search,
  Loader2,
  RefreshCw,
  ExternalLink,
  File
} from "lucide-react";
import { theme } from "@/lib/admin-theme";

interface MediaFile {
  key: string;
  url: string;
  size: number;
  lastModified: string | null;
  contentType: string;
}

export default function AdminMediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
    nextToken: null as string | null,
  });

  const folders = [
    { name: "users/avatars", label: "User Avatars", icon: Image },
    { name: "users/covers", label: "Cover Photos", icon: Image },
    { name: "users/galleries", label: "Galleries", icon: Folder },
    { name: "photos/originals", label: "Original Photos", icon: Image },
    { name: "photos/processed", label: "Processed Photos", icon: Image },
    { name: "photos/thumbnails", label: "Thumbnails", icon: Image },
    { name: "photos/watermarked", label: "Watermarked", icon: Image },
    { name: "videos/raw", label: "Raw Videos", icon: Video },
    { name: "videos/processed", label: "Processed Videos", icon: Video },
    { name: "videos/thumbnails", label: "Video Thumbnails", icon: Video },
    { name: "documents/orders", label: "Order Documents", icon: FileText },
    { name: "documents/invoices", label: "Invoices", icon: FileText },
    { name: "documents/contracts", label: "Contracts", icon: FileText },
    { name: "blog", label: "Blog Images", icon: Image },
    { name: "services/portfolios", label: "Portfolios", icon: Folder },
    { name: "services/samples", label: "Service Samples", icon: Folder },
  ];

  useEffect(() => {
    fetchFiles();
  }, [selectedFolder, pagination.page]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      if (selectedFolder) {
        params.set("folder", selectedFolder);
      }
      
      const res = await fetch(`/api/admin/media?${params.toString()}`);
      const data = await res.json();
      
      if (data.files) {
        setFiles(data.files);
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: data.pagination.total,
            pages: data.pagination.pages,
            nextToken: data.pagination.nextToken,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete this file?\n\n${key}\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      setDeletingKey(key);
      const res = await fetch(`/api/admin/media?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchFiles();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file");
    } finally {
      setDeletingKey(null);
    }
  };

  const filteredFiles = files.filter(file => 
    file.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) return Image;
    if (contentType.startsWith("video/")) return Video;
    if (contentType.startsWith("application/pdf")) return FileText;
    return File;
  };

  return (
    <div className={`min-h-screen ${theme.secondary}`}>
      {/* Header */}
      <div className="bg-indigo-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Media Management</h1>
              <p className="text-indigo-100">Manage files in AWS S3 bucket</p>
            </div>
            <Button
              variant="outline"
              onClick={fetchFiles}
              disabled={loading}
              className="text-white border-white hover:bg-indigo-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Folder Sidebar */}
          <div className="md:col-span-1">
            <div className={`${theme.card} rounded-lg shadow-sm p-4`}>
              <h2 className={`font-semibold ${theme.heading} mb-4`}>Folders</h2>
              <div className="space-y-1">
                <button
                  onClick={() => { setSelectedFolder(""); setPagination(p => ({ ...p, page: 1 })); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    selectedFolder === "" 
                      ? "bg-indigo-100 text-indigo-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  All Files
                </button>
                {folders.map((folder) => {
                  const Icon = folder.icon;
                  return (
                    <button
                      key={folder.name}
                      onClick={() => { setSelectedFolder(folder.name); setPagination(p => ({ ...p, page: 1 })); }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
                        selectedFolder === folder.name 
                          ? "bg-indigo-100 text-indigo-700" 
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {folder.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className={`${theme.card} rounded-lg shadow-sm p-4 mt-4`}>
              <h2 className={`font-semibold ${theme.heading} mb-2`}>Statistics</h2>
              <p className={`text-sm ${theme.mutedText}`}>
                Total Files: <span className="font-semibold">{pagination.total}</span>
              </p>
              {pagination.pages > 1 && (
                <p className="text-sm text-gray-500 mt-1">
                  Page {pagination.page} of {pagination.pages}
                </p>
              )}
            </div>
          </div>

          {/* File List */}
          <div className="md:col-span-3">
            {/* Search */}
            <div className={`${theme.card} rounded-lg shadow-sm p-4 mb-4`}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search files by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Files */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className={`text-lg font-semibold ${theme.heading} mb-2`}>No files found</h3>
                <p className="text-gray-600">
                  {selectedFolder 
                    ? `No files in ${selectedFolder} folder.`
                    : "No files uploaded yet."}
                </p>
              </div>
            ) : (
              <div className={`${theme.card} rounded-lg shadow-sm overflow-hidden`}>
                <table className={`min-w-full divide-y ${theme.border}`}>
                  <thead className={theme.secondary}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${theme.card} divide-y ${theme.border}`}>
                    {filteredFiles.map((file) => {
                      const Icon = getFileIcon(file.contentType);
                      return (
                        <tr key={file.key} className={theme.tableRowHover}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {file.contentType.startsWith("image/") ? (
                                <img 
                                  src={file.url} 
                                  alt=""
                                  className="h-10 w-10 rounded object-cover mr-3"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center mr-3">
                                  <Icon className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium ${theme.heading} truncate max-w-xs`}>
                                  {file.key.split("/").pop()}
                                </p>
                                <p className="text-xs text-gray-500 truncate max-w-xs">
                                  {file.key}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">
                              {formatFileSize(file.size)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs text-gray-500">
                              {file.contentType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                title="View"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <button
                                onClick={() => handleDelete(file.key)}
                                disabled={deletingKey === file.key}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Delete"
                              >
                                {deletingKey === file.key ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className={pagination.page === 1 ? "opacity-50" : ""}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className={pagination.page === pagination.pages ? "opacity-50" : ""}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
