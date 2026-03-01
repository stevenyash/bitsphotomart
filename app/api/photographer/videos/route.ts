import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        photographer: true,
      },
    });

    if (!user?.photographer) {
      return NextResponse.json({ error: "Photographer profile not found" }, { status: 404 });
    }

    const videos = await prisma.video.findMany({
      where: { photographerId: user.photographer.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        photographer: true,
      },
    });

    if (!user?.photographer) {
      return NextResponse.json({ error: "Photographer profile not found" }, { status: 404 });
    }

    // Check if photographer is approved
    if (user.photographer.status !== "APPROVED") {
      return NextResponse.json({ 
        error: "Your account is not approved yet. Please wait for admin approval." 
      }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      category, 
      tags, 
      originalUrl, 
      previewUrl,
      thumbnailUrl, 
      watermarkUrl,
      duration,
      resolution,
      format,
      fileSize,
      width,
      height,
      price,
      licenseType,
      quality,
    } = body;

    // Validate required fields
    if (!title || !category || !originalUrl || !thumbnailUrl || !price) {
      return NextResponse.json({ 
        error: "Missing required fields: title, category, originalUrl, thumbnailUrl, price" 
      }, { status: 400 });
    }

    const video = await prisma.video.create({
      data: {
        title,
        description,
        category,
        tags,
        originalUrl,
        previewUrl: previewUrl || originalUrl,
        thumbnailUrl,
        watermarkUrl,
        duration: duration || 0,
        resolution,
        format,
        fileSize: fileSize || null,
        width: width || null,
        height: height || null,
        price: parseFloat(price),
        licenseType: licenseType || "ROYALTY_FREE",
        quality: quality || "HD",
        photographerId: user.photographer.id,
        status: "PENDING", // Requires admin approval
        isApproved: false,
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
