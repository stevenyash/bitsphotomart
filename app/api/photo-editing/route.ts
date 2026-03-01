import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      originalUrl, 
      editingType, 
      serviceType, 
      instructions,
      basePrice 
    } = body;

    // Validate required fields (serviceType can be empty if no add-ons selected)
    if (!title || !originalUrl || !editingType || basePrice === undefined || basePrice === null) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    const totalPrice = parseFloat(basePrice);
    
    // Handle empty serviceType (when no add-ons selected)
    const serviceTypeValue = serviceType && serviceType.trim() ? serviceType : '';

    const photoEditingRequest = await prisma.photoEditingRequest.create({
      data: {
        userId: session.user.id,
        title,
        description,
        originalUrl,
        editingType,
        serviceType: serviceTypeValue,
        instructions,
        basePrice,
        totalPrice,
        status: 'PENDING',
      },
    });

    return NextResponse.json(photoEditingRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating photo editing request:', error);
    return NextResponse.json(
      { error: 'Failed to create photo editing request' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = session.user.role === 'ADMIN' 
      ? (status ? { status: status as any } : {})
      : { userId: session.user.id };

    const requests = await prisma.photoEditingRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching photo editing requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo editing requests' }, 
      { status: 500 }
    );
  }
}
