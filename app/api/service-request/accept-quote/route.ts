import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Accept Quote API
 * 
 * Allows a photographer to accept a service request and provide 
 * their quoted price (agreedBudget)
 */

// POST - Photographer accepts a quote with their budget
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the photographer profile
    const photographer = await prisma.photographer.findFirst({
      where: {
        user: {
          email: session.user.email,
        },
      },
    });

    if (!photographer) {
      return NextResponse.json(
        { error: 'Photographer profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { 
      serviceRequestId, 
      agreedBudget,
      depositPercent = 50,
      notes 
    } = body;

    if (!serviceRequestId || !agreedBudget) {
      return NextResponse.json(
        { error: 'Service request ID and agreed budget are required' },
        { status: 400 }
      );
    }

    const budget = parseFloat(agreedBudget);
    if (isNaN(budget) || budget <= 0) {
      return NextResponse.json(
        { error: 'Invalid budget amount' },
        { status: 400 }
      );
    }

    // Get the service request
    const serviceRequest = await prisma.jobApplication.findUnique({
      where: { id: serviceRequestId },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    // Check if already accepted by another photographer
    if (serviceRequest.photographerId && serviceRequest.photographerId !== photographer.id) {
      return NextResponse.json(
        { error: 'This request has already been accepted by another photographer' },
        { status: 400 }
      );
    }

    // Update the service request with the quote
    const updatedRequest = await prisma.jobApplication.update({
      where: { id: serviceRequestId },
      data: {
        photographerId: photographer.id,
        agreedBudget: budget,
        depositPercent: depositPercent,
        status: 'ASSIGNED', // Quote accepted, waiting for client to pay deposit
        adminNotes: notes ? `Quote accepted: ${notes}` : 'Quote accepted by photographer',
      },
    });

    // Create notification for the client
    await prisma.notification.create({
      data: {
        user: {
          connect: {
            email: serviceRequest.clientEmail,
          },
        },
        type: 'INFO',
        title: 'Quote Accepted',
        message: `A photographer has accepted your ${serviceRequest.jobType} request with a quote of KES ${budget.toLocaleString()}. Please pay the deposit to proceed.`,
        link: `/services/${serviceRequestId}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Quote accepted successfully',
      serviceRequest: {
        id: updatedRequest.id,
        agreedBudget: updatedRequest.agreedBudget,
        depositPercent: updatedRequest.depositPercent,
        status: updatedRequest.status,
      },
    });
  } catch (error) {
    console.error('Accept quote error:', error);
    return NextResponse.json(
      { error: 'Failed to accept quote' },
      { status: 500 }
    );
  }
}

// GET - Get quote details for a service request
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceRequestId = searchParams.get('id');

    if (!serviceRequestId) {
      return NextResponse.json(
        { error: 'Service request ID is required' },
        { status: 400 }
      );
    }

    const serviceRequest = await prisma.jobApplication.findUnique({
      where: { id: serviceRequestId },
      select: {
        id: true,
        agreedBudget: true,
        depositPercent: true,
        depositAmount: true,
        depositPaid: true,
        finalPaymentAmount: true,
        finalPaymentPaid: true,
        platformFee: true,
        photographerEarnings: true,
        status: true,
      },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serviceRequest);
  } catch (error) {
    console.error('Get quote details error:', error);
    return NextResponse.json(
      { error: 'Failed to get quote details' },
      { status: 500 }
    );
  }
}
