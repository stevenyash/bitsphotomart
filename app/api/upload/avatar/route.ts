import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mediaManager, MediaFolder } from "@/lib/media-manager";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to upload avatar." },
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

    // Validate file type - avatars only allow images
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP and GIF are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for avatars)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB for avatars." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to users/avatars folder
    const folder: MediaFolder = 'users/avatars';

    // Upload to S3 (no watermark for avatars)
    const result = await mediaManager.upload(
      buffer,
      file.name,
      file.type,
      folder,
      { userId: session.user.id }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to upload avatar" },
        { status: 500 }
      );
    }

    // Return CloudFront URL
    return NextResponse.json({ 
      url: result.cloudFrontUrl,
      s3Url: result.url,
      key: result.key
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
