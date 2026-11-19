import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mediaManager } from "@/lib/media-manager";
import { hasPermission } from "@/lib/rbac";

// GET - Get photos for approval queue
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check for viewing photos
    const hasViewAccess = await hasPermission('content.photos.view');
    if (!hasViewAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const photographerId = searchParams.get("photographerId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    console.log("Admin photos query - status:", status, "where:", where);

    if (photographerId) {
      where.photographerId = photographerId;
    }

    const [photos, total, statusCounts] = await Promise.all([
      prisma.photo.findMany({
        where,
        include: {
          photographer: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.photo.count({ where }),
      prisma.photo.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);
console.log("photos", photos);
    // Serialize photos with Decimal fields
    const serializedPhotos = photos.map((photo) => ({
      ...photo,
      price: Number(photo.price),
      createdAt: photo.createdAt?.toISOString() || null,
      updatedAt: photo.updatedAt?.toISOString() || null,
      expiresAt: photo.expiresAt?.toISOString() || null,
      photographer: photo.photographer ? {
        ...photo.photographer,
        totalEarnings: Number(photo.photographer.totalEarnings),
        createdAt: photo.photographer.createdAt?.toISOString() || null,
        updatedAt: photo.photographer.updatedAt?.toISOString() || null,
        user: photo.photographer.user ? {
          ...photo.photographer.user,
          createdAt: photo.photographer.user.createdAt?.toISOString() || null,
          updatedAt: photo.photographer.user.updatedAt?.toISOString() || null,
        } : undefined,
      } : undefined,
    }));

    return NextResponse.json({
      photos: serializedPhotos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      debug: { status, where, statusCounts },
    });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Approve or reject photo
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check for approving/rejecting photos
    const hasApproveAccess = await hasPermission('content.photos.approve');
    if (!hasApproveAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { photoId, action } = body;

    if (!photoId || !action) {
      return NextResponse.json({ error: "photoId and action are required" }, { status: 400 });
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updateData = {
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
    } as const;

    const photo = await prisma.photo.update({
      where: { id: photoId },
      data: updateData,
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Error updating photo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove photo (and delete from S3)
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check for deleting photos
    const hasDeleteAccess = await hasPermission('content.photos.delete');
    if (!hasDeleteAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");

    if (!photoId) {
      return NextResponse.json({ error: "photoId is required" }, { status: 400 });
    }

    // Get the photo first to find the S3 URLs
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Delete associated S3 files
    const s3KeysToDelete: string[] = [];
    
    // Extract S3 key from URLs if they exist
    const urls = [photo.originalUrl, photo.thumbnailUrl, photo.watermarkUrl].filter(Boolean);
    
    for (const url of urls) {
      if (url) {
        // Extract key from CloudFront or S3 URL
        const key = url.replace(/^https?:\/\/[^\/]+\//, '');
        if (key && key !== url) {
          s3KeysToDelete.push(key);
        }
      }
    }

    // Delete files from S3
    const deletePromises = s3KeysToDelete.map(key => 
      mediaManager.delete(key).catch(err => 
        console.error(`Failed to delete S3 key ${key}:`, err)
      )
    );
    
    await Promise.all(deletePromises);

    // Delete from database
    await prisma.photo.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ message: "Photo and associated S3 files deleted successfully" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
