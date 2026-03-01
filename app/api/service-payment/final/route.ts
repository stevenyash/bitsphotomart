import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { initiateStkPush } from '@/lib/mpesa';
import { calculateFeeSplitByType } from '@/lib/settings';
import { randomBytes } from 'crypto';

/**
 * Service Final Payment API
 * 
 * Flow:
 * 1. Client paid deposit
 * 2. Work is completed by photographer
 * 3. Client pays remaining balance
 * 4. Platform takes fee, photographer gets earnings
 */

// Generate unique payment reference
function generatePaymentRef(): string {
  return `FIN-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

// POST - Pay final balance for a service request
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

    // Check if deposit is paid
    if (!serviceRequest.depositPaid) {
      return NextResponse.json(
        { error: 'Please pay the deposit first' },
        { status: 400 }
      );
    }

    // Check if final payment is already paid
    if (serviceRequest.finalPaymentPaid) {
      return NextResponse.json(
        { error: 'Final payment has already been completed' },
        { status: 400 }
      );
    }

    // Get final payment amount
    const finalPaymentAmount = serviceRequest.finalPaymentAmount;
    
    if (!finalPaymentAmount || Number(finalPaymentAmount) <= 0) {
      return NextResponse.json(
        { error: 'No final payment required' },
        { status: 400 }
      );
    }

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

      const paymentRef = generatePaymentRef();

      // Initiate M-Pesa STK push
      const mpesaResponse = await initiateStkPush({
        phoneNumber: formattedPhone,
        amount: Number(finalPaymentAmount),
        accountReference: paymentRef,
        transactionDesc: `Final payment for ${serviceRequest.jobType} service`,
      });

      if (mpesaResponse.success && mpesaResponse.checkoutRequestId) {
        // Update with M-Pesa reference
        await prisma.jobApplication.update({
          where: { id: serviceRequestId },
          data: {
            finalPaymentMethod: paymentMethod,
            finalPaymentRef: mpesaResponse.checkoutRequestId,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Final payment request sent to your phone',
          finalPaymentAmount,
          checkoutRequestId: mpesaResponse.checkoutRequestId,
        });
      } else {
        return NextResponse.json(
          { error: mpesaResponse.error || 'Failed to initiate M-Pesa payment' },
          { status: 400 }
        );
      }
    } else if (paymentMethod === 'STRIPE') {
      return NextResponse.json({
        success: true,
        message: 'Redirect to Stripe payment',
        finalPaymentAmount,
        paymentUrl: `/checkout/stripe?service=${serviceRequestId}&type=final`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid payment method' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Service final payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process final payment' },
      { status: 500 }
    );
  }
}

// Callback for final payment (to be called by payment webhook)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceRequestId, paymentStatus, paymentRef } = body;

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

    // Mark final payment as paid
    await prisma.jobApplication.update({
      where: { id: serviceRequestId },
      data: {
        finalPaymentPaid: true,
        finalPaymentPaidAt: new Date(),
        status: 'COMPLETED', // Job is complete after final payment
      },
    });

    // Credit photographer earnings
    if (serviceRequest.photographer && serviceRequest.photographerEarnings) {
      await prisma.photographer.update({
        where: { id: serviceRequest.photographer.id },
        data: {
          totalEarnings: { 
            increment: Number(serviceRequest.photographerEarnings) 
          },
          totalSales: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Final payment completed and photographer credited',
    });
  } catch (error) {
    console.error('Final payment callback error:', error);
    return NextResponse.json(
      { error: 'Failed to process final payment callback' },
      { status: 500 }
    );
  }
}
