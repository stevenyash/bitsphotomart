import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

// POST - Create a new service request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      clientName, 
      clientEmail, 
      clientPhone, 
      clientAddress, 
      jobType, 
      description, 
      location, 
      eventDate, 
      budget,
      // Documentary specific fields
      storyDetails,
      animationStyle,
      artworkRequired,
      artworkDetails,
      clientMediaUrl,
      duration,
      voiceover,
      musicTrack,
      subtitles,
      deliveryFormat,
      // Videographer coverage fields
      videographerCoverage,
      coverageType,
      coverageLocation,
      coverageDate,
      coverageDuration
    } = body;

    // Validation
    if (!clientName || !clientEmail || !clientPhone || !jobType || !description || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate job type
    const validJobTypes = ['PHOTOGRAPHY', 'VIDEOGRAPHY', 'DRONE', 'DOCUMENTARY', 'EVENT_COVERAGE', 'PRODUCT_SHOOT', 'CUSTOM'];
    if (!validJobTypes.includes(jobType)) {
      return NextResponse.json(
        { error: 'Invalid job type' },
        { status: 400 }
      );
    }

    // Validate animation style if provided
    const validAnimationStyles = ['NONE', 'HAND_DRAWN', 'MOTION_GRAPHICS', 'WHITEBOARD', 'INFOGRAPHIC', 'STOP_MOTION', 'ANIMATION_3D', 'MR_SMART_STYLE'];
    if (animationStyle && !validAnimationStyles.includes(animationStyle)) {
      return NextResponse.json(
        { error: 'Invalid animation style' },
        { status: 400 }
      );
    }

    // Validate delivery format if provided
    const validDeliveryFormats = ['MP4', 'MOV', 'AVI', 'MKV', 'DVD', 'BLU_RAY', 'RAW'];
    if (deliveryFormat && !validDeliveryFormats.includes(deliveryFormat)) {
      return NextResponse.json(
        { error: 'Invalid delivery format' },
        { status: 400 }
      );
    }

    // Create service request
    const serviceRequest = await prisma.jobApplication.create({
      data: {
        clientName,
        clientEmail,
        clientPhone,
        clientAddress: clientAddress || null,
        jobType,
        description,
        location,
        eventDate: eventDate ? new Date(eventDate) : null,
        budget: budget ? parseFloat(budget) : null,
        status: 'PENDING',
        // Documentary specific fields
        storyDetails: storyDetails || null,
        animationStyle: animationStyle || null,
        artworkRequired: artworkRequired || false,
        artworkDetails: artworkDetails || null,
        clientMediaUrl: clientMediaUrl || null,
        duration: duration ? parseInt(duration) : null,
        voiceover: voiceover || false,
        musicTrack: musicTrack || false,
        subtitles: subtitles || false,
        deliveryFormat: deliveryFormat || null,
        // Videographer coverage fields
        videographerCoverage: videographerCoverage || false,
        coverageType: coverageType || null,
        coverageLocation: coverageLocation || null,
        coverageDate: coverageDate ? new Date(coverageDate) : null,
        coverageDuration: coverageDuration ? parseInt(coverageDuration) : null,
      },
    });

    return NextResponse.json(serviceRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating service request:', error);
    return NextResponse.json(
      { error: 'Failed to create service request' },
      { status: 500 }
    );
  }
}

// GET - Get all service requests (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const jobType = searchParams.get('jobType');

    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    if (jobType) {
      where.jobType = jobType;
    }

    const requests = await prisma.jobApplication.findMany({
      where,
      include: {
        photographer: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service requests' },
      { status: 500 }
    );
  }
}
