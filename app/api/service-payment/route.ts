import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      amount, 
      description, 
      serviceType,
      phoneNumber, 
      paymentMethod,
      metadata 
    } = body;

    if (!amount || !description || !serviceType || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Format phone number for M-Pesa
    let formattedPhone = phoneNumber;
    if (paymentMethod === 'MPESA' && phoneNumber) {
      const digits = phoneNumber.replace(/\D/g, '');
      if (digits.startsWith('0') && digits.length === 10) {
        formattedPhone = '254' + digits.substring(1);
      } else if (digits.length === 9) {
        formattedPhone = '254' + digits;
      } else {
        formattedPhone = digits;
      }
    }

    // Create service payment record
    const servicePayment = await prisma.servicePayment.create({
      data: {
        userId: session.user.id,
        amount: parseFloat(amount),
        description,
        serviceType,
        paymentMethod,
        status: 'PENDING',
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Handle different payment methods
    if (paymentMethod === 'MPESA') {
      // For M-Pesa, initiate STK push
      try {
        const stkResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mpesa/stk-push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: formattedPhone,
            amount: parseFloat(amount),
            accountReference: `SVC-${servicePayment.id}`,
            transactionDesc: description,
          }),
        });

        const stkData = await stkResponse.json();

        if (stkResponse.ok && stkData.success) {
          return NextResponse.json({
            success: true,
            paymentId: servicePayment.id,
            status: 'processing',
            message: 'STK push sent. Please complete payment on your phone.',
          });
        } else {
          // Mark as failed if STK push fails
          await prisma.servicePayment.update({
            where: { id: servicePayment.id },
            data: { status: 'FAILED' },
          });
          return NextResponse.json(
            { error: stkData.error || 'M-Pesa payment initiation failed' },
            { status: 400 }
          );
        }
      } catch (mpesaError) {
        console.error('M-Pesa error:', mpesaError);
        await prisma.servicePayment.update({
          where: { id: servicePayment.id },
          data: { status: 'FAILED' },
        });
        return NextResponse.json(
          { error: 'M-Pesa payment failed. Please try again.' },
          { status: 500 }
        );
      }
    } else if (paymentMethod === 'STRIPE') {
      // For Stripe, create payment session
      // This would integrate with Stripe - simplified for now
      return NextResponse.json({
        success: true,
        paymentId: servicePayment.id,
        status: 'pending',
        message: 'Stripe payment link created',
      });
    } else if (paymentMethod === 'PAYPAL') {
      // For PayPal, create order
      // This would integrate with PayPal - simplified for now
      return NextResponse.json({
        success: true,
        paymentId: servicePayment.id,
        status: 'pending',
        message: 'PayPal order created',
      });
    }

    return NextResponse.json({
      success: true,
      paymentId: servicePayment.id,
      status: 'pending',
    });
  } catch (error) {
    console.error('Service payment error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}

// Get payment status
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }

    const payment = await prisma.servicePayment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment status' },
      { status: 500 }
    );
  }
}
