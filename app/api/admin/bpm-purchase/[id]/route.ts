import { NextRequest, NextResponse } from 'next/server';

import { auth} from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action, offeredPrice, adminNotes } = await req.json();

    const offer = await prisma.bpmPurchaseOffer.findUnique({
      where: { id },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    let updateData: any = {};

    switch (action) {
      case 'OFFER':
        if (!offeredPrice) {
          return NextResponse.json({ error: 'Offer price required' }, { status: 400 });
        }
        updateData = {
          status: 'OFFERED',
          offeredPrice,
          adminNotes,
        };
        break;

      case 'ACCEPT':
        updateData = {
          status: 'ACCEPTED',
        };
        break;

      case 'REJECT':
        updateData = {
          status: 'REJECTED',
          adminNotes,
        };
        break;

      case 'PURCHASE':
        updateData = {
          status: 'PURCHASED',
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updated = await prisma.bpmPurchaseOffer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating BPM purchase:', error);
    return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 });
  }
}
