import { NextRequest, NextResponse } from "next/server";
import { mediaManager, MediaFolder } from "@/lib/media-manager";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate video file types
    const allowedTypes = [
      "video/mp4",
      "video/mpeg", 
      "video/quicktime",
      "video/webm",
      "video/x-msvideo",
      "video/x-matroska"
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only MP4, MPEG, MOV, WebM, AVI and MKV are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB for videos)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 500MB for videos." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine folder
    const folder: MediaFolder = 'videos/raw';

    // Upload to S3 with CloudFront delivery
    const result = await mediaManager.upload(
      buffer,
      file.name,
      file.type,
      folder,
      { userId: 'user-upload' }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to upload video" },
        { status: 500 }
      );
    }

    // Return both S3 and CloudFront URLs
    return NextResponse.json({ 
      url: result.cloudFrontUrl,
      s3Url: result.url,
      key: result.key,
      filename: file.name,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
