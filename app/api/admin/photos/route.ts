import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get photos for approval queue
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const photographerId = searchParams.get("photographerId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

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

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { photoId, action, rejectionReason } = body;

    if (!photoId || !action) {
      return NextResponse.json({ error: "photoId and action are required" }, { status: 400 });
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updateData: any = {
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
    };

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

// DELETE - Remove photo
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");

    if (!photoId) {
      return NextResponse.json({ error: "photoId is required" }, { status: 400 });
    }

    await prisma.photo.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
