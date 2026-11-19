import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mediaManager, MediaFolder } from "@/lib/media-manager";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to upload files." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP and GIF are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine folder based on user role (could be enhanced)
    const folder: MediaFolder = 'photos/originals';

    // Upload to S3 with CloudFront delivery
    const result = await mediaManager.upload(
      buffer,
      file.name,
      file.type,
      folder,
      { 
        generateThumbnail: true,
        addWatermark: true,
        userId: session.user.id 
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to upload file" },
        { status: 500 }
      );
    }

    // Return both S3 and CloudFront URLs
    return NextResponse.json({ 
      url: result.cloudFrontUrl,
      s3Url: result.url,
      key: result.key,
      metadata: result.metadata
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
