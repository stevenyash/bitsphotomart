import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      serviceRequestId, 
      photographerId,
      rating,
      ratingQuality,
      ratingCommunication,
      ratingProfessionalism,
      ratingValue,
      ratingTimeliness,
      title,
      comment,
      clientPhotos
    } = body;

    // Validate required fields
    if (!serviceRequestId || !photographerId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceRequestId, photographerId, rating' },
        { status: 400 }
      );
    }

    // Validate rating is 1-5
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate specific ratings if provided
    const ratings = [ratingQuality, ratingCommunication, ratingProfessionalism, ratingValue, ratingTimeliness];
    for (const r of ratings) {
      if (r !== undefined && (r < 1 || r > 5)) {
        return NextResponse.json(
          { error: 'Specific ratings must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if service request exists and is completed
    const serviceRequest = await prisma.jobApplication.findUnique({
      where: { id: serviceRequestId }
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    // Only allow reviews for COMPLETED or FINAL_PAID services
    if (!['COMPLETED', 'FINAL_PAID'].includes(serviceRequest.status)) {
      return NextResponse.json(
        { error: 'Can only review completed services' },
        { status: 400 }
      );
    }

    // Check if the user is the client of this service
    if (serviceRequest.clientEmail.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'You can only review services you hired' },
        { status: 403 }
      );
    }

    // Check if photographer exists
    const photographer = await prisma.photographer.findUnique({
      where: { id: photographerId }
    });

    if (!photographer) {
      return NextResponse.json({ error: 'Photographer not found' }, { status: 404 });
    }

    // Check if photographer is the one assigned to this service
    if (serviceRequest.photographerId !== photographerId) {
      return NextResponse.json(
        { error: 'Photographer not assigned to this service' },
        { status: 400 }
      );
    }

    // Check if user already reviewed this service
    const existingReview = await prisma.serviceReview.findUnique({
      where: {
        userId_serviceRequestId: {
          userId: user.id,
          serviceRequestId
        }
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this service' },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.serviceReview.create({
      data: {
        userId: user.id,
        serviceRequestId,
        photographerId,
        rating,
        ratingQuality,
        ratingCommunication,
        ratingProfessionalism,
        ratingValue,
        ratingTimeliness,
        title,
        comment,
        clientPhotos
      }
    });

    // Update photographer's average rating
    const allReviews = await prisma.serviceReview.findMany({
      where: { photographerId }
    });

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allReviews.length;

    await prisma.photographer.update({
      where: { id: photographerId },
      data: { rating: averageRating }
    });

    return NextResponse.json({
      success: true,
      review,
      newRating: averageRating
    });
  } catch (error) {
    console.error('Error creating service review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photographerId = searchParams.get('photographerId');
    const serviceRequestId = searchParams.get('serviceRequestId');

    // Get reviews for a photographer
    if (photographerId) {
      const reviews = await prisma.serviceReview.findMany({
        where: {
          photographerId,
          isPublic: true
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate rating breakdown
      const ratingBreakdown = {
        quality: 0,
        communication: 0,
        professionalism: 0,
        value: 0,
        timeliness: 0
      };

      const reviewsWithRatings = reviews.filter(r => 
        r.ratingQuality || r.ratingCommunication || r.ratingProfessionalism || 
        r.ratingValue || r.ratingTimeliness
      );

      if (reviewsWithRatings.length > 0) {
        ratingBreakdown.quality = reviewsWithRatings.reduce((sum, r) => sum + (r.ratingQuality || 0), 0) / reviewsWithRatings.length;
        ratingBreakdown.communication = reviewsWithRatings.reduce((sum, r) => sum + (r.ratingCommunication || 0), 0) / reviewsWithRatings.length;
        ratingBreakdown.professionalism = reviewsWithRatings.reduce((sum, r) => sum + (r.ratingProfessionalism || 0), 0) / reviewsWithRatings.length;
        ratingBreakdown.value = reviewsWithRatings.reduce((sum, r) => sum + (r.ratingValue || 0), 0) / reviewsWithRatings.length;
        ratingBreakdown.timeliness = reviewsWithRatings.reduce((sum, r) => sum + (r.ratingTimeliness || 0), 0) / reviewsWithRatings.length;
      }

      return NextResponse.json({
        reviews,
        ratingBreakdown,
        totalReviews: reviews.length
      });
    }

    // Get reviews for a specific service request
    if (serviceRequestId) {
      const reviews = await prisma.serviceReview.findMany({
        where: { serviceRequestId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      return NextResponse.json({ reviews });
    }

    return NextResponse.json(
      { error: 'photographerId or serviceRequestId required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching service reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
