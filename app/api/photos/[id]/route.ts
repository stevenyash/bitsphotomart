import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch photo with photographer info
    const photo = await prisma.photo.findUnique({
      where: { id },
      include: {
        photographer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Fetch reviews
    const reviews = await prisma.review.findMany({
      where: { photoId: id },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Transform data for client
    const photoData = {
      id: photo.id,
      title: photo.title,
      description: photo.description,
      category: photo.category,
      tags: photo.tags,
      thumbnailUrl: photo.thumbnailUrl,
      watermarkUrl: photo.watermarkUrl,
      width: photo.width,
      height: photo.height,
      price: Number(photo.price),
      licenseType: photo.licenseType,
      createdAt: photo.createdAt.toISOString(),
      photographer: photo.photographer ? {
        id: photo.photographer.id,
        user: {
          name: photo.photographer.user.name,
        },
        rating: photo.photographer.rating,
      } : null,
    };

    const reviewsData = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      user: {
        name: review.user.name,
        avatar: review.user.avatar,
      },
    }));

    return NextResponse.json({
      photo: photoData,
      reviews: reviewsData,
    });
  } catch (error) {
    console.error('Error fetching photo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
