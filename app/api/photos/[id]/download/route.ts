import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required to download photos' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get photo details
    const photo = await prisma.photo.findUnique({
      where: { id },
      select: {
        id: true,
        originalUrl: true,
        watermarkUrl: true,
        photographerId: true,
        price: true,
        licenseType: true,
      }
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Check if user owns this photo (is the photographer)
    const photographer = await prisma.photographer.findUnique({
      where: { userId: user.id }
    });

    const isOwner = photographer?.id === photo.photographerId;

    if (isOwner) {
      // Owner can download original
      return NextResponse.redirect(photo.originalUrl);
    }

    // Check if user has purchased this photo
    const purchase = await prisma.orderItem.findFirst({
      where: {
        photoId: id,
        order: {
          userId: user.id,
          status: 'COMPLETED'
        }
      }
    });

    // If purchased, allow download
    if (purchase) {
      // Log the download
      await prisma.photo.update({
        where: { id },
        data: {
          downloadCount: { increment: 1 }
        }
      });

      // Return the original URL (could also stream it through our server for more control)
      return NextResponse.redirect(photo.originalUrl);
    }

    // User hasn't purchased - redirect to watermark version
    if (photo.watermarkUrl) {
      return NextResponse.redirect(photo.watermarkUrl);
    }

    return NextResponse.json(
      { error: 'Purchase required to download original quality' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error downloading photo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
