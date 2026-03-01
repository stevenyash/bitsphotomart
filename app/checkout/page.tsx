"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  CreditCard, 
  Phone, 
  Loader2, 
  Check, 
  AlertCircle,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

interface CartItem {
  id: string;
  photo: {
    id: string;
    title: string;
    price: number;
    thumbnailUrl: string | null;
  };
  licenseType: string;
}

type PaymentMethod = "MPESA" | "STRIPE" | "PAYPAL";

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  hoverBorder: string;
  badge?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MPESA");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "success" | "failed">("pending");
  
  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{code: string; codeId?: string; discount: number; discountType: string} | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  useEffect(() => {
    fetchCartItems();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.phone) {
          setPhoneNumber(data.phone);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  const fetchCartItems = async () => {
    try {
      const response = await fetch("/api/checkout");
      if (response.status === 401) {
        router.push("/login?redirect=/checkout");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to load cart");
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      setError("Failed to load cart. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.photo.price), 0);
  const tax = 0;
  
  // Calculate discount
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === "PERCENTAGE") {
      discount = (subtotal * appliedPromo.discount) / 100;
    } else {
      discount = appliedPromo.discount;
    }
  }
  
  const total = subtotal + tax - discount;

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

  const isValidPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 12;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone for M-Pesa
    if (paymentMethod === "MPESA" && !isValidPhoneNumber(phoneNumber)) {
      setError("Please enter a valid phone number (e.g., 0712345678 or 254712345678)");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          paymentMethod: paymentMethod,
          promoCodeId: appliedPromo?.codeId || null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // For Stripe/PayPal, redirect to payment URL
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
          return;
        }

        // For M-Pesa, continue with polling
        setOrderNumber(data.orderNumber);
        setPaymentStatus("processing");
        pollPaymentStatus(data.orderId);
      } else {
        setError(data.error || "Checkout failed. Please try again.");
        setPaymentStatus("failed");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("An error occurred. Please try again.");
      setPaymentStatus("failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = async (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 24;

    const poll = async () => {
      attempts++;
      
      try {
        const response = await fetch(`/api/checkout/${orderId}/status`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === "PAID") {
            setPaymentStatus("success");
            setSuccess(true);
            return;
          } else if (data.status === "CANCELLED" || data.status === "FAILED") {
            setPaymentStatus("failed");
            setError("Payment was not completed. Please try again.");
            return;
          }
        }
      } catch (err) {
        console.error("Status poll error:", err);
      }

      if (attempts < maxAttempts && paymentStatus === "processing") {
        setTimeout(poll, 5000);
      }
    };

    setTimeout(poll, 5000);
  };

  // Apply promo code
  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }
    
    setPromoLoading(true);
    setPromoError("");
    
    try {
      const response = await fetch(`/api/promo-codes?code=${encodeURIComponent(promoCode)}`);
      const data = await response.json();
      
      if (response.ok && data.valid) {
        setAppliedPromo({
          code: data.code.code,
          codeId: data.code.id,
          discount: data.code.discountValue,
          discountType: data.code.discountType
        });
      } else {
        setPromoError(data.error || "Invalid promo code");
      }
    } catch (err) {
      console.error("Promo code error:", err);
      setPromoError("Failed to validate promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  // Remove applied promo code
  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
  };

  // Payment methods available
  const paymentMethods: PaymentMethodOption[] = [
    {
      id: "MPESA",
      name: "M-Pesa",
      description: "Pay instantly via mobile",
      icon: <Phone className="w-5 h-5" />,
      color: "bg-green-600",
      borderColor: "border-green-500",
      hoverBorder: "hover:border-green-600",
      badge: "Popular"
    },
    {
      id: "STRIPE",
      name: "Credit Card",
      description: "Visa, Mastercard, Amex",
      icon: <CreditCard className="w-5 h-5" />,
      color: "bg-indigo-600",
      borderColor: "border-indigo-500",
      hoverBorder: "hover:border-indigo-600",
      badge: "Secure"
    },
    {
      id: "PAYPAL",
      name: "PayPal",
      description: "Pay with your PayPal account",
      icon: <CreditCard className="w-5 h-5" />,
      color: "bg-blue-600",
      borderColor: "border-blue-500",
      hoverBorder: "hover:border-blue-600",
      badge: "Fast"
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Browse our collection to find photos you love!</p>
            <Link href="/gallery">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg">
                Browse Photos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="bg-green-50 -mx-8 -mt-8 px-8 py-6 mb-6 rounded-t-2xl">
              <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Check className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">Your order has been confirmed.</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="text-2xl font-bold text-gray-900">{orderNumber}</p>
            </div>
            <p className="text-sm text-gray-500 mb-8">A confirmation email has been sent to you.</p>
            <div className="space-y-3">
              <Link href="/dashboard/orders" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl">
                  View My Orders
                </Button>
              </Link>
              <Link href="/gallery" className="block">
                <Button variant="outline" className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 rounded-xl">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Cart
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-500">Complete your purchase</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              {/* Payment Method Selection */}
              <div className="mb-8 pb-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Select Payment Method</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        paymentMethod === method.id
                          ? `${method.borderColor} bg-white shadow-md`
                          : `border-gray-200 ${method.hoverBorder} hover:bg-gray-50`
                      }`}
                    >
                      {paymentMethod === method.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`w-10 h-10 ${method.color} rounded-lg flex items-center justify-center mb-3`}>
                        <div className="text-white">{method.icon}</div>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{method.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                      {method.badge && (
                        <span className="absolute top-2 left-2 text-xs font-medium text-white bg-gray-900 px-2 py-0.5 rounded-full">
                          {method.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6 flex items-start gap-4 shadow-lg shadow-red-500/10">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-red-800 font-semibold">Payment Failed</p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {paymentStatus === "processing" && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-6 shadow-lg shadow-blue-500/10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                    </div>
                    <div>
                      <p className="text-blue-900 font-bold text-lg">Waiting for Payment</p>
                      <p className="text-blue-600 text-sm mt-1">
                        {paymentMethod === "MPESA" 
                          ? "Please check your phone for the M-Pesa prompt. Enter your PIN to complete payment."
                          : "Please complete your payment in the redirected window."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleCheckout} className={paymentStatus === "processing" ? "opacity-50 pointer-events-none" : ""}>
                {/* Phone number field - only show for M-Pesa */}
                {paymentMethod === "MPESA" && (
                  <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-amber-500" />
                      Phone Number
                      {phoneNumber && (
                        <span className="ml-2 text-xs text-green-600 font-normal flex items-center gap-1 inline-flex bg-green-50 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3" /> Loaded from profile
                        </span>
                      )}
                    </label>
                    <div className="flex rounded-2xl shadow-lg overflow-hidden">
                      <div className="flex items-center justify-center px-5 py-4 bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-r-0 border-gray-200">
                        <span className="text-2xl">🇰🇪</span>
                        <span className="ml-2 text-gray-800 font-bold">+254</span>
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber.replace(/^254/, '').replace(/^0/, '')}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          setPhoneNumber(digits.length > 0 ? '254' + digits : '');
                          setError("");
                        }}
                        placeholder="712 345 678"
                        className="flex-1 px-5 py-4 bg-white border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 text-lg font-semibold text-gray-900 placeholder:text-gray-400"
                        required
                      />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Enter your M-Pesa registered phone number</span>
                    </div>
                  </div>
                )}

                {/* Payment method instructions */}
                {paymentMethod === "MPESA" && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 mb-6 border border-green-100 shadow-lg shadow-green-500/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">How it works</p>
                        <p className="text-sm text-gray-600">You'll receive an M-Pesa prompt. Enter your PIN to pay.</p>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "STRIPE" && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-5 mb-6 border border-purple-100 shadow-lg shadow-purple-500/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">Secure Card Payment</p>
                        <p className="text-sm text-gray-600">You'll be redirected to Stripe to securely enter your card details.</p>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "PAYPAL" && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-2xl p-5 mb-6 border border-blue-100 shadow-lg shadow-blue-500/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">PayPal Checkout</p>
                        <p className="text-sm text-gray-600">You'll be redirected to PayPal to complete your payment securely.</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-green-500/30 transition-all duration-200 hover:scale-[1.01] hover:shadow-2xl hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  disabled={isProcessing || paymentStatus === "processing"}
                >
                  {isProcessing || paymentStatus === "processing" ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      {paymentMethod === "MPESA" && <Phone className="w-5 h-5 mr-2" />}
                      {paymentMethod === "STRIPE" && <CreditCard className="w-5 h-5 mr-2" />}
                      {paymentMethod === "PAYPAL" && <CreditCard className="w-5 h-5 mr-2" />}
                      {paymentMethod === "MPESA" 
                        ? `Pay KES ${total.toLocaleString()} with M-Pesa`
                        : paymentMethod === "STRIPE"
                        ? `Pay KES ${total.toLocaleString()} with Card`
                        : `Pay KES ${total.toLocaleString()} with PayPal`
                      }
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span>Secure Payment</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-2 text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span>Instant Access</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-2 text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sticky top-24 border border-white/20">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
              </div>
              
              <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-2 scrollbar-thin">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 shadow-inner">
                      {item.photo.thumbnailUrl ? (
                        <img src={item.photo.thumbnailUrl} alt={item.photo.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <CreditCard className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{item.photo.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 font-medium">{item.licenseType} License</p>
                    </div>
                    <span className="text-sm font-bold text-amber-600">KES {Number(item.photo.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Promo Code Section */}
              {appliedPromo ? (
                <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">{appliedPromo.code}</span>
                      <span className="text-xs text-green-600">
                        ({appliedPromo.discountType === "PERCENTAGE" ? `${appliedPromo.discount}%` : `KES ${appliedPromo.discount}`} off)
                      </span>
                    </div>
                    <button
                      onClick={removePromoCode}
                      className="text-xs text-green-600 hover:text-green-800 underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      disabled={promoLoading}
                    />
                    <button
                      onClick={applyPromoCode}
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {promoLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {promoError && (
                    <p className="mt-2 text-xs text-red-500">{promoError}</p>
                  )}
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Subtotal ({cartItems.length} items)</span>
                  <span className="font-semibold">KES {subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Discount</span>
                    <span className="font-semibold text-green-600">-KES {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Tax</span>
                  <span className="text-gray-500">KES {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold pt-4 border-t-2 border-dashed border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-amber-600">KES {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 shadow-lg shadow-green-500/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-800">Instant Download</p>
                    <p className="text-xs text-green-600 mt-1">You'll get immediate access after payment.</p>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                <div className="p-2">
                  <ShieldCheck className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-500">Secure</span>
                </div>
                <div className="p-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-500">Verified</span>
                </div>
                <div className="p-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-500">Trusted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
