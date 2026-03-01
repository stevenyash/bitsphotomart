import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Validate a promo code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Promo code required' }, { status: 400 });
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return NextResponse.json({ valid: false, error: 'Invalid promo code' }, { status: 404 });
    }

    // Check if active
    if (!promoCode.isActive) {
      return NextResponse.json({ valid: false, error: 'Promo code is no longer active' }, { status: 400 });
    }

    // Check validity period
    const now = new Date();
    if (promoCode.validFrom && now < promoCode.validFrom) {
      return NextResponse.json({ valid: false, error: 'Promo code is not yet valid' }, { status: 400 });
    }
    if (promoCode.validUntil && now > promoCode.validUntil) {
      return NextResponse.json({ valid: false, error: 'Promo code has expired' }, { status: 400 });
    }

    // Check usage limit
    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json({ valid: false, error: 'Promo code usage limit reached' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: promoCode,
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json({ error: 'Failed to validate promo code' }, { status: 500 });
  }
}

// POST - Create a new promo code (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, description, discountType, discountValue, maxUses, maxUsesPerUser, minOrderAmount, validFrom, validUntil, appliesTo } = body;

    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        maxUses: maxUses ? parseInt(maxUses) : null,
        maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser) : null,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        appliesTo: appliesTo || 'ALL',
      },
    });

    return NextResponse.json(promoCode, { status: 201 });
  } catch (error) {
    console.error('Error creating promo code:', error);
    return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 });
  }
}

// PUT - Update a promo code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Promo code ID required' }, { status: 400 });
    }

    // Convert numeric fields
    if (updateData.discountValue) updateData.discountValue = parseFloat(updateData.discountValue);
    if (updateData.maxUses) updateData.maxUses = parseInt(updateData.maxUses);
    if (updateData.maxUsesPerUser) updateData.maxUsesPerUser = parseInt(updateData.maxUsesPerUser);
    if (updateData.minOrderAmount) updateData.minOrderAmount = parseFloat(updateData.minOrderAmount);
    if (updateData.validFrom) updateData.validFrom = new Date(updateData.validFrom);
    if (updateData.validUntil) updateData.validUntil = new Date(updateData.validUntil);

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(promoCode);
  } catch (error) {
    console.error('Error updating promo code:', error);
    return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 });
  }
}
