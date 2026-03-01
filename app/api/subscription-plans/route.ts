import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get all active subscription plans (public)
export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription plans' }, { status: 500 });
  }
}

// POST - Create a new subscription plan (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, monthlyPrice, annualPrice, features, maxDownloads, maxPhotos, displayOrder, isPopular } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        slug,
        description,
        monthlyPrice: monthlyPrice ? parseFloat(monthlyPrice) : null,
        annualPrice: annualPrice ? parseFloat(annualPrice) : null,
        features,
        maxDownloads: maxDownloads ? parseInt(maxDownloads) : null,
        maxPhotos: maxPhotos ? parseInt(maxPhotos) : null,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        isPopular: isPopular || false,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json({ error: 'Failed to create subscription plan' }, { status: 500 });
  }
}

// PUT - Update a subscription plan
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    // Convert numeric fields
    if (updateData.monthlyPrice) updateData.monthlyPrice = parseFloat(updateData.monthlyPrice);
    if (updateData.annualPrice) updateData.annualPrice = parseFloat(updateData.annualPrice);
    if (updateData.maxDownloads) updateData.maxDownloads = parseInt(updateData.maxDownloads);
    if (updateData.maxPhotos) updateData.maxPhotos = parseInt(updateData.maxPhotos);
    if (updateData.displayOrder) updateData.displayOrder = parseInt(updateData.displayOrder);

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json({ error: 'Failed to update subscription plan' }, { status: 500 });
  }
}
