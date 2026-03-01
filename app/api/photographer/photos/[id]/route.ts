import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
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

    const photo = await prisma.photo.findFirst({
      where: {
        id,
        photographerId: user.photographer.id,
      },
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
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Error fetching photo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
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

    // Check if photo belongs to this photographer
    const existingPhoto = await prisma.photo.findFirst({
      where: {
        id,
        photographerId: user.photographer.id,
      },
    });

    if (!existingPhoto) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Only allow editing if not yet approved or is rejected
    if (existingPhoto.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot edit approved photos. Contact admin for changes." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      tags,
      price,
      licenseType,
    } = body;

    // Validate required fields
    if (!title || !category || !price) {
      return NextResponse.json(
        { error: "Missing required fields: title, category, price" },
        { status: 400 }
      );
    }

    const photo = await prisma.photo.update({
      where: { id },
      data: {
        title,
        description,
        category,
        tags,
        price: parseFloat(price),
        licenseType: licenseType || "STANDARD",
        // Reset approval status if editing a rejected photo
        status: existingPhoto.status === "REJECTED" ? "PENDING" : existingPhoto.status,
        isApproved: existingPhoto.status === "REJECTED" ? false : existingPhoto.isApproved,
      },
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Error updating photo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
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

    // Check if photo belongs to this photographer
    const existingPhoto = await prisma.photo.findFirst({
      where: {
        id,
        photographerId: user.photographer.id,
      },
    });

    if (!existingPhoto) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Check if photo has any orders
    const orderCount = await prisma.orderItem.count({
      where: { photoId: id },
    });

    if (orderCount > 0) {
      // Soft delete - just mark as deleted
      await prisma.photo.update({
        where: { id },
        data: {
          status: "DELETED",
        },
      });
    } else {
      // Hard delete if no orders
      await prisma.photo.delete({
        where: { id },
      });
    }

    return NextResponse.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
