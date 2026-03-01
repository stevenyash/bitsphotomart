import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

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

    // Create videos directory if it doesn't exist
    const videosDir = path.join(process.cwd(), "public", "uploads", "videos");
    if (!existsSync(videosDir)) {
      await mkdir(videosDir, { recursive: true });
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.name)}`;
    const filepath = path.join(videosDir, filename);

    // Save file
    await writeFile(filepath, buffer);

    // Return the URL
    const url = `/uploads/videos/${filename}`;
    
    return NextResponse.json({ 
      url,
      filename,
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
