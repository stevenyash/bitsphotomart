import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const offers = await prisma.bpmPurchaseOffer.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error('Error fetching BPM offers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, imageUrl, askingPrice } = body;

    if (!title || !imageUrl || !askingPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10);

    const offer = await prisma.bpmPurchaseOffer.create({
      data: {
        title,
        description,
        imageUrl,
        askingPrice: parseFloat(askingPrice),
        userId: user.id,
        expiresAt,
        status: 'PENDING',
      },
    });

    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    console.error('Error creating BPM offer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
