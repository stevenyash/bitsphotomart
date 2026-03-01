import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get user's video cart items
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const cartItems = await prisma.videoCartItem.findMany({
      where: { userId: user.id },
      include: {
        video: {
          include: {
            photographer: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + Number(item.video.price);
    }, 0);

    // Convert Decimal fields to numbers for serialization
    const serializedItems = cartItems.map((item) => ({
      ...item,
      video: {
        ...item.video,
        price: Number(item.video.price),
        width: item.video.width,
        height: item.video.height,
        duration: item.video.duration,
      },
      createdAt: item.createdAt?.toISOString() || null,
      updatedAt: item.updatedAt?.toISOString() || null,
    }));

    return NextResponse.json({
      items: serializedItems,
      subtotal,
      itemCount: cartItems.length,
    });
  } catch (error) {
    console.error("Error fetching video cart:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add video to cart
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { videoId, licenseType } = body;

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    // Check if video exists and is approved
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.status !== "APPROVED") {
      return NextResponse.json({ error: "Video is not available for purchase" }, { status: 400 });
    }

    // Check if already in cart
    const existingItem = await prisma.videoCartItem.findUnique({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json({ error: "Video is already in your cart" }, { status: 400 });
    }

    // Add to cart
    const cartItem = await prisma.videoCartItem.create({
      data: {
        userId: user.id,
        videoId,
        licenseType: licenseType || "ROYALTY_FREE",
      },
      include: {
        video: true,
      },
    });

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    console.error("Error adding video to cart:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove video from cart
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    // Verify the item belongs to the user
    const cartItem = await prisma.videoCartItem.findFirst({
      where: {
        id: itemId,
        userId: user.id,
      },
    });

    if (!cartItem) {
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
    }

    // Delete the item
    await prisma.videoCartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true, message: "Video removed from cart" });
  } catch (error) {
    console.error("Error removing video from cart:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
