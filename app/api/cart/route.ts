import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get user's cart items
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

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        photo: {
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
      return sum + Number(item.photo.price);
    }, 0);

    // Convert Decimal fields to numbers for serialization
    const serializedItems = cartItems.map((item) => ({
      ...item,
      photo: {
        ...item.photo,
        price: Number(item.photo.price),
        width: item.photo.width,
        height: item.photo.height,
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
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add item to cart
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
    const { photoId, licenseType } = body;

    if (!photoId) {
      return NextResponse.json({ error: "Photo ID is required" }, { status: 400 });
    }

    // Check if photo exists and is approved
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    if (photo.status !== "APPROVED") {
      return NextResponse.json({ error: "Photo is not available for purchase" }, { status: 400 });
    }

    // Check if already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_photoId: {
          userId: user.id,
          photoId,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json({ error: "Photo is already in your cart" }, { status: 400 });
    }

    // Add to cart
    const cartItem = await prisma.cartItem.create({
      data: {
        userId: user.id,
        photoId,
        licenseType: licenseType || "STANDARD",
      },
      include: {
        photo: true,
      },
    });

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
