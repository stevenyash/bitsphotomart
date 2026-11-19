"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  Video, 
  Loader2, 
  X, 
  Check,
  AlertCircle,
  Play,
  Clock,
  Monitor
} from "lucide-react";
import Link from "next/link";

interface VideoUploadFormProps {
  photographerId: string;
}

const VIDEO_CATEGORIES = [
  "Drone",
  "Wildlife",
  "Urban",
  "Culture",
  "Nature",
  "Business",
  "Events",
  "Lifestyle",
  "Other",
];

const VIDEO_QUALITIES = [
  { value: "SD", label: "SD (480p)" },
  { value: "HD", label: "HD (720p)" },
  { value: "FULL_HD", label: "Full HD (1080p)" },
  { value: "UHD_4K", label: "4K Ultra HD" },
];

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VideoUploadForm({ photographerId }: VideoUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    id: string;
    file: File;
    preview: string;
    duration: number;
    progress: number;
  } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Form state
  const [videoData, setVideoData] = useState({
    title: "",
    description: "",
    category: "Other",
    tags: "",
    price: "2500",
    licenseType: "ROYALTY_FREE",
    quality: "HD",
    duration: 0,
  });

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      // Upload video to server
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload/video", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload video");
      }
      
      const data = await response.json();
      
      // Get video duration
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = data.url;
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          resolve();
        };
      });
      
      const duration = Math.floor(video.duration);
      
      setUploadedFile({
        id: Math.random().toString(36).substring(7),
        file,
        preview: data.url,
        duration,
        progress: 100,
      });

      setVideoData((prev) => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, ""),
        duration,
      }));
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to upload video" 
      });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const removeFile = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.preview);
      setUploadedFile(null);
      setVideoData({
        title: "",
        description: "",
        category: "Other",
        tags: "",
        price: "2500",
        licenseType: "ROYALTY_FREE",
        quality: "HD",
        duration: 0,
      });
    }
  };

  const updateVideoData = (field: string, value: string | number) => {
    setVideoData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFile) {
      setMessage({ type: "error", text: "Please select a video" });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/photographer/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: videoData.title,
          description: videoData.description,
          category: videoData.category,
          tags: videoData.tags,
          originalUrl: uploadedFile.preview,
          previewUrl: uploadedFile.preview,
          thumbnailUrl: uploadedFile.preview, // Would need thumbnail generation in production
          duration: videoData.duration,
          price: videoData.price,
          licenseType: videoData.licenseType,
          quality: videoData.quality,
          format: uploadedFile.file.type,
          fileSize: uploadedFile.file.size,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload video");
      }

      const result = await response.json();
      
      setMessage({ 
        type: "success", 
        text: "Video uploaded successfully! It will be available after admin approval." 
      });
      
      // Clear form
      removeFile();
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to upload video" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Area */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Upload Video</h2>
        
        {!uploadedFile ? (
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept="video/mp4,video/mpeg,video/quicktime,video/webm,video/x-msvideo,video/x-matroska"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
              disabled={isUploading}
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              {isUploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
                  <p className="text-white font-medium mb-2">
                    Uploading video...
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-white font-medium mb-2">
                    Click to select a video or drag and drop
                  </p>
                  <p className="text-slate-400 text-sm">
                    Supports MP4, MOV, WebM, AVI, MKV (Max 500MB)
                  </p>
                </>
              )}
            </label>
          </div>
        ) : (
          /* Video Preview */
          <div className="relative">
            <video
              src={uploadedFile.preview}
              controls
              className="w-full max-h-80 rounded-lg bg-black"
            />
            <button
              type="button"
              onClick={removeFile}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mt-2 flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatTime(uploadedFile.duration)}
              </span>
              <span className="text-sm text-slate-400">
                {(uploadedFile.file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Video Details Form */}
      {uploadedFile && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Video Details</h2>
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Title *
              </label>
              <Input
                value={videoData.title}
                onChange={(e) => updateVideoData("title", e.target.value)}
                placeholder="Enter video title"
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            {/* Category & Quality */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={videoData.category}
                  onChange={(e) => updateVideoData("category", e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  required
                >
                  {VIDEO_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Quality *
                </label>
                <select
                  value={videoData.quality}
                  onChange={(e) => updateVideoData("quality", e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  required
                >
                  {VIDEO_QUALITIES.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Description
              </label>
              <textarea
                value={videoData.description}
                onChange={(e) => updateVideoData("description", e.target.value)}
                placeholder="Describe your video..."
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none"
              />
            </div>

            {/* Price & License - Coming Soon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="opacity-50">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Price (KES) - Coming Soon
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={videoData.price}
                  onChange={(e) => updateVideoData("price", e.target.value)}
                  placeholder="2500"
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled
                />
                <p className="text-xs text-amber-400 mt-1">Pricing feature coming soon</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  License Type
                </label>
                <select
                  value={videoData.licenseType}
                  onChange={(e) => updateVideoData("licenseType", e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="ROYALTY_FREE">Royalty-Free</option>
                  <option value="STANDARD">Standard License</option>
                  <option value="EXTENDED">Extended License</option>
                  <option value="EDITORIAL">Editorial License</option>
                </select>
              </div>
            </div>

            {/* Pricing Guide */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-400 mb-2">Pricing Guide</h4>
              <div className="text-xs text-slate-400 space-y-1">
                <p>• SD: KES 1,000 - 3,000</p>
                <p>• HD: KES 2,500 - 5,000</p>
                <p>• Full HD: KES 5,000 - 10,000</p>
                <p>• 4K: KES 10,000 - 25,000</p>
              </div>
            </div>
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
      {uploadedFile && (
        <div className="flex gap-4">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white"
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
                Upload Video
              </>
            )}
          </Button>
          
          <Link href="/photographer/videos">
            <Button
              type="button"
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              <Video className="w-4 h-4 mr-2" />
              View My Videos
            </Button>
          </Link>
        </div>
      )}
    </form>
  );
}
