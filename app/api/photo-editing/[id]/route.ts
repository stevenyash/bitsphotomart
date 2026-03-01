import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, editedUrl, adminNotes } = body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (editedUrl !== undefined) {
      updateData.editedUrl = editedUrl;
      if (editedUrl) {
        updateData.deliveredAt = new Date();
      }
    }
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const photoEditingRequest = await prisma.photoEditingRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(photoEditingRequest);
  } catch (error) {
    console.error('Error updating photo editing request:', error);
    return NextResponse.json(
      { error: 'Failed to update photo editing request' }, 
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const photoEditingRequest = await prisma.photoEditingRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!photoEditingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Check ownership for non-admin users
    if (session.user.role !== 'ADMIN' && photoEditingRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(photoEditingRequest);
  } catch (error) {
    console.error('Error fetching photo editing request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo editing request' }, 
      { status: 500 }
    );
  }
}
