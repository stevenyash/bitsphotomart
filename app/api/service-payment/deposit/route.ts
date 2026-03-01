import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { initiateStkPush } from '@/lib/mpesa';
import { calculateFeeSplitByType, FeeType } from '@/lib/settings';
import { randomBytes } from 'crypto';

/**
 * Service Deposit Payment API
 * 
 * Flow:
 * 1. Client requests a service with budget
 * 2. Photographer accepts with agreed budget
 * 3. Client pays deposit (e.g., 50%)
 * 4. Work begins
 * 5. Client pays remaining balance
 * 6. Platform takes fee, photographer gets earnings
 */

// Generate unique payment reference
function generatePaymentRef(): string {
  return `DEP-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

// POST - Pay deposit for a service request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      serviceRequestId, 
      phoneNumber, 
      paymentMethod = 'MPESA' 
    } = body;

    if (!serviceRequestId) {
      return NextResponse.json(
        { error: 'Service request ID is required' },
        { status: 400 }
      );
    }

    // Get the service request
    const serviceRequest = await prisma.jobApplication.findUnique({
      where: { id: serviceRequestId },
      include: {
        photographer: true,
      },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    // Verify the client is paying for their own request
    if (serviceRequest.clientEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'You can only pay for your own service requests' },
        { status: 403 }
      );
    }

    // Check if deposit is already paid
    if (serviceRequest.depositPaid) {
      return NextResponse.json(
        { error: 'Deposit has already been paid' },
        { status: 400 }
      );
    }

    // Check if quote has been accepted (agreedBudget set)
    if (!serviceRequest.agreedBudget) {
      return NextResponse.json(
        { error: 'Please wait for the photographer to accept and provide a quote' },
        { status: 400 }
      );
    }

    // Calculate deposit amount
    const depositPercent = serviceRequest.depositPercent || 50;
    const depositAmount = Math.round(Number(serviceRequest.agreedBudget) * (depositPercent / 100));
    const finalPaymentAmount = Number(serviceRequest.agreedBudget) - depositAmount;

    // Calculate platform fee (for when final payment is made)
    const { platformFee } = await calculateFeeSplitByType(Number(serviceRequest.agreedBudget), 'SERVICE');
    const photographerEarnings = Number(serviceRequest.agreedBudget) - platformFee;

    // Update service request with payment details
    const paymentRef = generatePaymentRef();
    
    await prisma.jobApplication.update({
      where: { id: serviceRequestId },
      data: {
        depositAmount: depositAmount,
        finalPaymentAmount: finalPaymentAmount,
        platformFee: platformFee,
        photographerEarnings: photographerEarnings,
        depositMethod: paymentMethod,
        depositRef: paymentRef,
      },
    });

    // Handle payment based on method
    if (paymentMethod === 'MPESA') {
      if (!phoneNumber) {
        return NextResponse.json(
          { error: 'Phone number is required for M-Pesa payment' },
          { status: 400 }
        );
      }

      // Format phone number
      const digits = phoneNumber.replace(/\D/g, '');
      let formattedPhone = digits;
      if (digits.startsWith('0') && digits.length === 10) {
        formattedPhone = '254' + digits.substring(1);
      } else if (digits.length === 9) {
        formattedPhone = '254' + digits;
      }

      // Initiate M-Pesa STK push
      const mpesaResponse = await initiateStkPush({
        phoneNumber: formattedPhone,
        amount: depositAmount,
        accountReference: paymentRef,
        transactionDesc: `Deposit for ${serviceRequest.jobType} service`,
      });

      if (mpesaResponse.success && mpesaResponse.checkoutRequestId) {
        // Update with M-Pesa reference
        await prisma.jobApplication.update({
          where: { id: serviceRequestId },
          data: {
            depositRef: mpesaResponse.checkoutRequestId,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Deposit payment request sent to your phone',
          depositAmount,
          finalPaymentAmount,
          depositPercent,
          checkoutRequestId: mpesaResponse.checkoutRequestId,
        });
      } else {
        return NextResponse.json(
          { error: mpesaResponse.error || 'Failed to initiate M-Pesa payment' },
          { status: 400 }
        );
      }
    } else if (paymentMethod === 'STRIPE') {
      // For Stripe, return payment link
      return NextResponse.json({
        success: true,
        message: 'Redirect to Stripe payment',
        depositAmount,
        finalPaymentAmount,
        depositPercent,
        paymentUrl: `/checkout/stripe?service=${serviceRequestId}&type=deposit`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid payment method' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Service deposit payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process deposit payment' },
      { status: 500 }
    );
  }
}

// GET - Get deposit status for a service request
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceRequestId = searchParams.get('id');

    if (!serviceRequestId) {
      return NextResponse.json(
        { error: 'Service request ID is required' },
        { status: 400 }
      );
    }

    const serviceRequest = await prisma.jobApplication.findUnique({
      where: { id: serviceRequestId },
      select: {
        id: true,
        agreedBudget: true,
        depositPercent: true,
        depositAmount: true,
        depositPaid: true,
        depositPaidAt: true,
        finalPaymentAmount: true,
        finalPaymentPaid: true,
        finalPaymentPaidAt: true,
        platformFee: true,
        photographerEarnings: true,
      },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      serviceRequestId: serviceRequest.id,
      agreedBudget: serviceRequest.agreedBudget,
      depositPercent: serviceRequest.depositPercent || 50,
      depositAmount: serviceRequest.depositAmount,
      depositPaid: serviceRequest.depositPaid,
      depositPaidAt: serviceRequest.depositPaidAt,
      finalPaymentAmount: serviceRequest.finalPaymentAmount,
      finalPaymentPaid: serviceRequest.finalPaymentPaid,
      finalPaymentPaidAt: serviceRequest.finalPaymentPaidAt,
      platformFee: serviceRequest.platformFee,
      photographerEarnings: serviceRequest.photographerEarnings,
    });
  } catch (error) {
    console.error('Get deposit status error:', error);
    return NextResponse.json(
      { error: 'Failed to get deposit status' },
      { status: 500 }
    );
  }
}
