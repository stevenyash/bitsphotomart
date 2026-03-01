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

    const photos = await prisma.photo.findMany({
      where: { photographerId: user.photographer.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
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
      thumbnailUrl, 
      watermarkUrl,
      width,
      height,
      price,
      licenseType,
    } = body;

    // Validate required fields
    if (!title || !category || !originalUrl || !thumbnailUrl || !price) {
      return NextResponse.json({ 
        error: "Missing required fields: title, category, originalUrl, thumbnailUrl, price" 
      }, { status: 400 });
    }

    const photo = await prisma.photo.create({
      data: {
        title,
        description,
        category,
        tags,
        originalUrl,
        thumbnailUrl,
        watermarkUrl,
        width: width || null,
        height: height || null,
        price: parseFloat(price),
        licenseType: licenseType || "STANDARD",
        photographerId: user.photographer.id,
        status: "PENDING", // Requires admin approval
        isApproved: false,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Error creating photo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
