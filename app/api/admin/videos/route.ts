/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

// GET - Get all videos (admin view)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('content.videos.view');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - content.videos.view permission required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.video.count({ where });

    // Get videos with pagination
    const videos = await prisma.video.findMany({
      where,
      include: {
        photographer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Convert Decimal fields to numbers
    const serializedVideos = videos.map((video) => ({
      ...video,
      price: Number(video.price),
      width: video.width,
      height: video.height,
      fileSize: video.fileSize,
      createdAt: video.createdAt?.toISOString() || null,
      updatedAt: video.updatedAt?.toISOString() || null,
    }));

    return NextResponse.json({
      videos: serializedVideos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update video status (approve/reject)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('content.videos.approve');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - content.videos.approve permission required' }, { status: 403 });
    }

    const body = await request.json();
    const { videoId, status, isFeatured } = body;

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Update video
    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: {
        ...(status && { status: status.toUpperCase() }),
        ...(typeof isFeatured === "boolean" && { isFeatured }),
        ...(status?.toUpperCase() === "APPROVED" && { isApproved: true }),
      },
    });

    return NextResponse.json({
      success: true,
      video: {
        ...updatedVideo,
        price: Number(updatedVideo.price),
      },
    });
  } catch (error) {
    console.error("Error updating video:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete video
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('content.videos.delete');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - content.videos.delete permission required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Delete related records first
    await prisma.videoCartItem.deleteMany({ where: { videoId } });
    await prisma.videoDownload.deleteMany({ where: { videoId } });
    await prisma.videoReview.deleteMany({ where: { videoId } });
    await prisma.videoOrderItem.deleteMany({ where: { videoId } });

    // Delete the video
    await prisma.video.delete({
      where: { id: videoId },
    });

    return NextResponse.json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
