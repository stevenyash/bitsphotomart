"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Trash2, 
  Image,
  DollarSign,
  Tag,
  FileText
} from "lucide-react";

interface Photo {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string | null;
  price: string;
  licenseType: string;
  status: string;
  thumbnailUrl: string;
}

const CATEGORIES = [
  "Nature",
  "Portrait",
  "Architecture",
  "Travel",
  "Food",
  "Business",
  "Technology",
  "Abstract",
  "Animals",
  "Sports",
  "Events",
  "Fashion",
  "Other"
];

const LICENSE_TYPES = [
  { value: "STANDARD", label: "Standard License", description: "For personal and small commercial use" },
  { value: "EXTENDED", label: "Extended License", description: "For unlimited commercial use" },
  { value: "EDITORIAL", label: "Editorial License", description: "For news and editorial purposes only" },
];

export default function EditPhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    price: "",
    licenseType: "STANDARD",
  });

  useEffect(() => {
    const fetchPhoto = async () => {
      const { id } = await params;
      try {
        const res = await fetch(`/api/photographer/photos/${id}`);
        if (!res.ok) throw new Error("Failed to fetch photo");
        const data = await res.json();
        setPhoto(data);
        setFormData({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          tags: data.tags || "",
          price: data.price || "",
          licenseType: data.licenseType || "STANDARD",
        });
      } catch (err) {
        setError("Failed to load photo");
      } finally {
        setLoading(false);
      }
    };
    fetchPhoto();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const { id } = await params;
      const res = await fetch(`/api/photographer/photos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update photo");
      }

      router.push("/photographer/photos");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const { id } = await params;
      const res = await fetch(`/api/photographer/photos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete photo");
      }

      router.push("/photographer/photos");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Photo not found</p>
          <Button onClick={() => router.push("/photographer/photos")} variant="outline" className="border-slate-600 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Photos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.push("/photographer/photos")}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Edit Photo</h1>
                <p className="text-slate-400">Update your photo details</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleting}
                className="border-red-600 text-red-400 hover:bg-red-600/20"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Photo Preview */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 sticky top-8">
              <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
                <img
                  src={photo.thumbnailUrl}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  photo.status === "APPROVED" 
                    ? "bg-green-500/20 text-green-400"
                    : photo.status === "PENDING"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : photo.status === "REJECTED"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-slate-600 text-slate-300"
                }`}>
                  {photo.status}
                </span>
              </div>

              {photo.status === "APPROVED" && (
                <p className="text-xs text-amber-400 mt-2">
                  Approved photos cannot be edited. Contact admin for changes.
                </p>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
                  {error}
                </div>
              )}

              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Title *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter photo title"
                      required
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your photo..."
                      rows={4}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select category</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Tags
                      </label>
                      <Input
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="tag1, tag2, tag3"
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  Pricing & License
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Price (KES) *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="Enter price in KES"
                      required
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      License Type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {LICENSE_TYPES.map((license) => (
                        <label
                          key={license.value}
                          className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                            formData.licenseType === license.value
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-slate-600 hover:border-slate-500"
                          }`}
                        >
                          <input
                            type="radio"
                            name="licenseType"
                            value={license.value}
                            checked={formData.licenseType === license.value}
                            onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                            className="sr-only"
                          />
                          <p className="font-medium text-white">{license.label}</p>
                          <p className="text-xs text-slate-400 mt-1">{license.description}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/photographer/photos")}
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || photo.status === "APPROVED"}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
