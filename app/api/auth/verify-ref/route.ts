import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 });
    }

    const marketer = await prisma.marketerProfile.findUnique({
      where: { referralCode: code },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!marketer || marketer.status !== 'ACTIVE') {
      return NextResponse.json({ valid: false, error: 'Invalid or expired referral code' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      marketer: {
        id: marketer.id,
        user: marketer.user,
        commissionRate: marketer.commissionRate,
      },
    });

  } catch (error) {
    console.error('Error verifying referral code:', error);
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}
