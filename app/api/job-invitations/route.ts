import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get invitations (for photographers - their own invitations)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Filter by status
    const jobId = searchParams.get('jobId'); // Filter by job

    // Get photographer profile
    const photographer = await prisma.photographer.findUnique({
      where: { userId: session.user.id },
    });

    if (!photographer) {
      return NextResponse.json({ error: 'Photographer not found' }, { status: 404 });
    }

    const where: Record<string, unknown> = {
      photographerId: photographer.id,
    };

    if (status) {
      where.status = status;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    const invitations = await prisma.jobInvitation.findMany({
      where,
      include: {
        jobApplication: {
          include: {
            photographer: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: { invitedAt: 'desc' },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Admin sends invitations to photographers
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { jobId, photographerIds, adminMessage } = body;

    if (!jobId || !photographerIds || !Array.isArray(photographerIds)) {
      return NextResponse.json({ error: 'jobId and photographerIds array are required' }, { status: 400 });
    }

    // Check if job exists
    const job = await prisma.jobApplication.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Create invitations for each photographer
    const invitations = await Promise.all(
      photographerIds.map((photographerId: string) =>
        prisma.jobInvitation.upsert({
          where: {
            jobId_photographerId: {
              jobId,
              photographerId,
            },
          },
          update: {
            status: 'PENDING', // Re-invite if already existed
            adminMessage,
            invitedAt: new Date(),
          },
          create: {
            jobId,
            photographerId,
            adminMessage,
            status: 'PENDING',
          },
        })
      )
    );

    // Update job status to INVITATION_SENT
    await prisma.jobApplication.update({
      where: { id: jobId },
      data: { status: 'INVITATION_SENT' },
    });

    // TODO: Send email/SMS notifications to photographers

    return NextResponse.json({ 
      message: `Invitations sent to ${invitations.length} photographers`,
      invitations 
    });
  } catch (error) {
    console.error('Error sending invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Photographer responds to invitation (accept/reject)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invitationId, status, photographerResponse } = body;

    if (!invitationId || !status) {
      return NextResponse.json({ error: 'invitationId and status are required' }, { status: 400 });
    }

    if (!['ACCEPTED', 'DECLINED'].includes(status)) {
      return NextResponse.json({ error: 'Status must be ACCEPTED or DECLINED' }, { status: 400 });
    }

    // Get photographer profile
    const photographer = await prisma.photographer.findUnique({
      where: { userId: session.user.id },
    });

    if (!photographer) {
      return NextResponse.json({ error: 'Photographer not found' }, { status: 404 });
    }

    // Check if invitation belongs to this photographer
    const invitation = await prisma.jobInvitation.findFirst({
      where: {
        id: invitationId,
        photographerId: photographer.id,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Update invitation
    const updated = await prisma.jobInvitation.update({
      where: { id: invitationId },
      data: {
        status,
        photographerResponse,
        respondedAt: new Date(),
      },
    });

    // If accepted, assign the photographer to the job
    if (status === 'ACCEPTED') {
      await prisma.jobApplication.update({
        where: { id: invitation.jobId },
        data: {
          photographerId: photographer.id,
          status: 'ASSIGNED',
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error responding to invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
