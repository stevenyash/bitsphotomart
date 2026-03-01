'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface PaymentStatusCheckProps {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  onStatusUpdate?: () => void;
}

export function PaymentStatusCheck({
  orderId,
  orderNumber,
  currentStatus,
  onStatusUpdate,
}: PaymentStatusCheckProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isRequestingVerification, setIsRequestingVerification] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const checkPaymentStatus = async () => {
    setIsChecking(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/payments/verify?orderId=${orderId}`);
      const data = await response.json();

      if (response.ok) {
        if (data.status === 'PAID' || data.status === 'COMPLETED') {
          setMessage({
            type: 'success',
            text: 'Payment confirmed! You can now access your downloads.',
          });
          onStatusUpdate?.();
        } else if (data.verificationStatus === 'NEEDS_REVIEW') {
          setMessage({
            type: 'info',
            text: 'Your payment is being reviewed by our finance team.',
          });
        } else if (data.verificationStatus === 'VERIFIED') {
          setMessage({
            type: 'success',
            text: 'Payment verified successfully!',
          });
          onStatusUpdate?.();
        } else {
          setMessage({
            type: 'info',
            text: `Payment status: ${data.status}. If you have made payment, please request manual verification below.`,
          });
        }
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to check payment status',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while checking payment status',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const requestManualVerification = async () => {
    setIsRequestingVerification(true);
    setMessage(null);

    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Verification request submitted! Our finance team will review your payment within 24 hours.',
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to submit verification request',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while submitting verification request',
      });
    } finally {
      setIsRequestingVerification(false);
    }
  };

  // Don't show if order is already completed/paid
  if (currentStatus === 'PAID' || currentStatus === 'COMPLETED') {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">Payment Complete</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={checkPaymentStatus}
          disabled={isChecking}
        >
          {isChecking ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Clock className="h-4 w-4 mr-2" />
          )}
          Check Payment Status
        </Button>

        {currentStatus === 'PENDING' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={requestManualVerification}
            disabled={isRequestingVerification}
          >
            {isRequestingVerification ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <AlertCircle className="h-4 w-4 mr-2" />
            )}
            Request Manual Verification
          </Button>
        )}
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg flex items-start gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : message.type === 'error'
              ? 'bg-red-50 text-red-800'
              : 'bg-blue-50 text-blue-800'
          }`}
        >
          {message.type === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
          {message.type === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          {message.type === 'info' && <Clock className="h-5 w-5 flex-shrink-0" />}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Having trouble with M-Pesa payment? If you&apos;ve made payment but haven&apos;t received confirmation, 
        click &quot;Request Manual Verification&quot; and our finance team will check and verify your payment.
      </p>
    </div>
  );
}
