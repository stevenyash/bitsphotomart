import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check for users.create permission via RBAC
    const { hasPermission } = await import('@/lib/rbac');
    const hasAccess = await hasPermission('users.create');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - No access' }, { status: 403 });
    }
    
    const body = await request.json();
    const { email, message } = body;
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        error: 'User already exists with this email' 
      }, { status: 400 });
    }
    
    const existingInvitation = await prisma.marketerInvitation.findFirst({
      where: { 
        email,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });
    
    if (existingInvitation) {
      return NextResponse.json({ 
        error: 'Pending invitation already sent to this email' 
      }, { status: 400 });
    }
    
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const invitation = await prisma.marketerInvitation.create({
      data: {
        email,
        token,
        invitedBy: session.user.id,
        message,
        expiresAt,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      }
    });
    
  } catch (error) {
    console.error('Error creating marketer invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const invitations = await prisma.marketerInvitation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedByUser: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ invitations });
    
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
