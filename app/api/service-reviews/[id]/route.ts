import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { response, isPublic } = body;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { photographer: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the review
    const review = await prisma.serviceReview.findUnique({
      where: { id },
      include: { photographer: true }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only the photographer can respond to reviews
    if (!user.photographer || user.photographer.id !== review.photographerId) {
      return NextResponse.json(
        { error: 'Only the photographer can respond to reviews' },
        { status: 403 }
      );
    }

    // Update the review
    const updatedReview = await prisma.serviceReview.update({
      where: { id },
      data: {
        response,
        respondedAt: new Date(),
        ...(isPublic !== undefined && { isPublic })
      }
    });

    return NextResponse.json({
      success: true,
      review: updatedReview
    });
  } catch (error) {
    console.error('Error updating service review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const review = await prisma.serviceReview.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        photographer: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error fetching service review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
