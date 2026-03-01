import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get reviews for a photo
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");
    const photographerId = searchParams.get("photographerId");

    if (!photoId && !photographerId) {
      return NextResponse.json({ error: "photoId or photographerId required" }, { status: 400 });
    }

    const where = photoId 
      ? { photoId, photographerId: null }
      : photographerId ? { photographerId, photoId: undefined } : {};

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      reviews,
      averageRating: avgRating,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a review
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { photoId, photographerId, rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (!photoId && !photographerId) {
      return NextResponse.json({ error: "photoId or photographerId required" }, { status: 400 });
    }

    // Check if user has purchased the photo (for photo reviews)
    if (photoId) {
      const hasPurchased = await prisma.orderItem.findFirst({
        where: {
          photoId,
          order: {
            userId: user.id,
            status: "PAID",
          },
        },
      });

      if (!hasPurchased) {
        return NextResponse.json(
          { error: "You must purchase this photo to leave a review" },
          { status: 403 }
        );
      }

      // Check if already reviewed
      const existingReview = await prisma.review.findUnique({
        where: {
          userId_photoId: {
            userId: user.id,
            photoId,
          },
        },
      });

      if (existingReview) {
        return NextResponse.json(
          { error: "You have already reviewed this photo" },
          { status: 400 }
        );
      }
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        photoId: photoId || null,
        photographerId: photographerId || null,
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update photo or photographer rating
    if (photoId) {
      const photoReviews = await prisma.review.findMany({
        where: { photoId },
      });
      const avgRating = photoReviews.reduce((sum, r) => sum + r.rating, 0) / photoReviews.length;
      
      await prisma.photo.update({
        where: { id: photoId },
        data: { 
          // Could add a rating field to Photo model
        },
      });
    }

    if (photographerId) {
      const photographerReviews = await prisma.review.findMany({
        where: { photographerId },
      });
      const avgRating = photographerReviews.reduce((sum, r) => sum + r.rating, 0) / photographerReviews.length;
      
      await prisma.photographer.update({
        where: { id: photographerId },
        data: { rating: avgRating },
      });
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
