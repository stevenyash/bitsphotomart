"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  CreditCard, 
  Phone, 
  Loader2, 
  Check,
  AlertCircle,
  X
} from "lucide-react";

type PaymentMethod = "MPESA" | "STRIPE" | "PAYPAL";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  serviceType: string;
  metadata?: Record<string, any>;
  onSuccess: (paymentId: string) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  description,
  serviceType,
  metadata,
  onSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MPESA");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState("");

  const formatPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length === 10) {
      return '254' + digits.substring(1);
    }
    if (digits.startsWith('254') && digits.length === 12) {
      return digits;
    }
    if (digits.length === 9) {
      return '254' + digits;
    }
    return digits;
  };

  const handlePayment = async () => {
    if (paymentMethod === "MPESA" && !phoneNumber) {
      setError("Please enter your phone number");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch('/api/service-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description,
          serviceType,
          paymentMethod,
          phoneNumber: paymentMethod === "MPESA" ? formatPhoneNumber(phoneNumber) : undefined,
          metadata,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      // For M-Pesa, we need to wait for callback - simulate success for demo
      if (paymentMethod === "MPESA") {
        setSuccess(true);
        setPaymentId(data.paymentId || `MPE-${Date.now()}`);
        setTimeout(() => {
          onSuccess(data.paymentId || `MPE-${Date.now()}`);
        }, 2000);
      } else {
        // For Stripe/PayPal, redirect or handle accordingly
        setSuccess(true);
        setPaymentId(data.paymentId || `PAY-${Date.now()}`);
        onSuccess(data.paymentId || `PAY-${Date.now()}`);
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Complete Payment</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Amount Display */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-2xl font-bold text-blue-600">
              KSh {amount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">{description}</div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("MPESA")}
                className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition ${
                  paymentMethod === "MPESA" 
                    ? 'border-blue-500 bg-blue-50 text-blue-600' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Phone className="w-5 h-5" />
                <span className="text-xs">M-Pesa</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("STRIPE")}
                className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition ${
                  paymentMethod === "STRIPE" 
                    ? 'border-blue-500 bg-blue-50 text-blue-600' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("PAYPAL")}
                className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition ${
                  paymentMethod === "PAYPAL" 
                    ? 'border-blue-500 bg-blue-50 text-blue-600' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">PayPal</span>
              </button>
            </div>
          </div>

          {/* Phone Number Input (for M-Pesa) */}
          {paymentMethod === "MPESA" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (M-Pesa)
              </label>
              <Input
                type="tel"
                placeholder="07XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the phone number registered with M-Pesa
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Payment successful! Processing your request...</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing || success}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Paid
              </>
            ) : (
              <>Pay KSh {amount.toLocaleString()}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
