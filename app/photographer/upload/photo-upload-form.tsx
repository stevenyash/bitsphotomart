"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  X, 
  Check,
  AlertCircle,
  Trash2,
  Edit,
  Eye
} from "lucide-react";
import Link from "next/link";

interface PhotoUploadFormProps {
  photographerId: string;
}

const CATEGORIES = [
  "Nature",
  "Portrait",
  "Landscape",
  "Architecture",
  "Street",
  "Wildlife",
  "Food",
  "Fashion",
  "Sports",
  "Events",
  "Abstract",
  "Travel",
  "Other",
];

export function PhotoUploadForm({ photographerId }: PhotoUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    id: string;
    file: File;
    preview: string;
    progress: number;
  }[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state for each photo
  const [photos, setPhotos] = useState<{
    id: string;
    title: string;
    description: string;
    category: string;
    price: string;
    licenseType: string;
  }[]>([]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    if (uploadedFiles.length + files.length > 50) {
      setMessage({ type: "error", text: "Maximum 50 photos allowed per upload" });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      // Upload files to server and get persistent URLs
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error("Failed to upload file");
        }
        
        const data = await response.json();
        
        return {
          id: Math.random().toString(36).substring(7),
          file,
          preview: data.url, // Use the server URL
          progress: 100,
        };
      });

      const newFiles = await Promise.all(uploadPromises);
      
      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Initialize form data for each new file
      const newPhotos = newFiles.map((f) => {
        return {
          id: f.id,
          title: f.file.name.replace(/\.[^/.]+$/, ""), // Use filename without extension as title
          description: "",
          category: "Other", // Default category
          price: "500", // Default price
          licenseType: "STANDARD",
        };
      });

      setPhotos((prev) => [...prev, ...newPhotos]);
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to upload files" 
      });
    } finally {
      setIsUploading(false);
    }
  }, []);


  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePhotoData = (id: string, field: string, value: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadedFiles.length === 0) {
      setMessage({ type: "error", text: "Please select at least one photo" });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      // Submit each photo to the API
      const results = await Promise.all(
        photos.map(async (photo) => {
          const fileData = uploadedFiles.find((f) => f.id === photo.id);
          if (!fileData) return null;

          // In production, this would upload the file and get URLs back
          // For now, we'll use the preview URL as the image URL
          const response = await fetch("/api/photographer/photos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: photo.title,
              description: photo.description,
              category: photo.category,
              originalUrl: fileData.preview, // Would be uploaded URL in production
              thumbnailUrl: fileData.preview, // Would be thumbnail URL in production
              price: photo.price,
              licenseType: photo.licenseType,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to upload photo");
          }

          return response.json();
        })
      );

      const successCount = results.filter((r) => r !== null).length;
      
      if (successCount > 0) {
        setMessage({ 
          type: "success", 
          text: `Successfully uploaded ${successCount} photo(s)! BPM will review them within 7 days. Unpurchased photos will be automatically removed.` 
        });
        
        // Clear form
        uploadedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
        setUploadedFiles([]);
        setPhotos([]);
      }
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to upload photos" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Area */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Upload Photos</h2>
        
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-amber-500 transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload"
            disabled={isUploading}
          />
          <label htmlFor="photo-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">
              Click to select photos or drag and drop
            </p>
            <p className="text-slate-400 text-sm">
              Supports JPG, PNG, WEBP (Max 20MB per file, max 50 photos)
            </p>
          </label>
        </div>

        {/* Uploaded Files Preview */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-white mb-3">
              {uploadedFiles.length} photo(s) selected
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="relative group">
                  <img
                    src={file.preview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photo Details Form */}
      {photos.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Photo Details</h2>
          
          <div className="space-y-6">
            {photos.map((photo, index) => (
              <div key={photo.id} className="border-b border-slate-700 pb-6 last:border-0">
                <div className="flex items-start gap-4">
                  <img
                    src={uploadedFiles.find((f) => f.id === photo.id)?.preview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Title *
                      </label>
                      <Input
                        value={photo.title}
                        onChange={(e) => updatePhotoData(photo.id, "title", e.target.value)}
                        placeholder="Enter photo title"
                        className="bg-slate-700 border-slate-600 text-white"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Category *
                      </label>
                      <select
                        value={photo.category}
                        onChange={(e) => updatePhotoData(photo.id, "category", e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                        required
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={photo.description}
                        onChange={(e) => updatePhotoData(photo.id, "description", e.target.value)}
                        placeholder="Describe your photo..."
                        rows={2}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none"
                      />
                    </div>

                    {/* Price - Coming Soon */}
                    <div className="opacity-50">
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Price (KES) - Coming Soon
                      </label>
                      <Input
                        type="number"
                        min="50"
                        max="1000"
                        step="1"
                        value={photo.price}
                        onChange={(e) => updatePhotoData(photo.id, "price", e.target.value)}
                        placeholder="50-1000"
                        className="bg-slate-700 border-slate-600 text-white"
                        disabled
                      />
                      <p className="text-xs text-amber-400 mt-1">Pricing feature coming soon - BPM will set prices</p>
                    </div>

                    {/* License Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        License Type
                      </label>
                      <select
                        value={photo.licenseType}
                        onChange={(e) => updatePhotoData(photo.id, "licenseType", e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="STANDARD">Standard License</option>
                        <option value="EXTENDED">Extended License</option>
                        <option value="EDITORIAL">Editorial License</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/20 text-green-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Submit Button */}
      {uploadedFiles.length > 0 && (
        <div className="flex gap-4">
          <Button
            type="submit"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {photos.length} Photo(s)
              </>
            )}
          </Button>
          
          <Link href="/photographer/photos">
            <Button
              type="button"
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              View My Photos
            </Button>
          </Link>
        </div>
      )}
    </form>
  );
}
