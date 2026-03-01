"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Loader2, 
  Wallet, 
  DollarSign,
  CreditCard,
  Building,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const PLATFORM_COMMISSION = 15;

interface PayoutInfo {
  availableBalance: number;
  totalEarnings: number;
  totalPaid: number;
  pendingPayouts: number;
  minPayoutAmount: number;
  recentPayouts: {
    id: string;
    amount: string;
    netAmount: string;
    method: string;
    status: string;
    createdAt: string;
    processedAt: string | null;
  }[];
}

export default function PayoutPage() {
  const router = useRouter();
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    amount: "",
    method: "MPESA",
    phoneNumber: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  useEffect(() => {
    const fetchPayoutInfo = async () => {
      try {
        const res = await fetch("/api/photographer/payout");
        if (!res.ok) throw new Error("Failed to fetch payout info");
        const data = await res.json();
        setPayoutInfo(data);
      } catch (err) {
        setError("Failed to load payout information");
      } finally {
        setLoading(false);
      }
    };
    fetchPayoutInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        amount: parseFloat(formData.amount),
        method: formData.method,
      };

      if (formData.method === "MPESA") {
        payload.phoneNumber = formData.phoneNumber;
      } else if (formData.method === "BANK") {
        payload.bankDetails = {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
        };
      }

      const res = await fetch("/api/photographer/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit payout request");
      }

      setSuccess("Payout request submitted successfully!");
      setFormData({
        amount: "",
        method: "MPESA",
        phoneNumber: "",
        bankName: "",
        accountNumber: "",
        accountName: "",
      });

      // Refresh payout info
      const infoRes = await fetch("/api/photographer/payout");
      const infoData = await infoRes.json();
      setPayoutInfo(infoData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateNetAmount = () => {
    const amount = parseFloat(formData.amount) || 0;
    const commission = (amount * PLATFORM_COMMISSION) / 100;
    return amount - commission;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!payoutInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load payout information</p>
          <Button onClick={() => router.push("/photographer")} variant="outline" className="border-slate-600 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/photographer">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Request Payout</h1>
              <p className="text-slate-400">Withdraw your earnings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Balance Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Available Balance</h3>
              <p className="text-4xl font-bold text-amber-400">
                KES {payoutInfo.availableBalance.toLocaleString()}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                Minimum payout: KES {payoutInfo.minPayoutAmount.toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Earnings Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Earnings</span>
                  <span className="text-white font-medium">KES {payoutInfo.totalEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Paid</span>
                  <span className="text-white font-medium">KES {payoutInfo.totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pending</span>
                  <span className="text-yellow-400 font-medium">KES {payoutInfo.pendingPayouts.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Recent Payouts */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Payouts</h3>
              {payoutInfo.recentPayouts.length === 0 ? (
                <p className="text-slate-400 text-sm">No payouts yet</p>
              ) : (
                <div className="space-y-3">
                  {payoutInfo.recentPayouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-white text-sm">{payout.method}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 text-sm">KES {Number(payout.netAmount).toLocaleString()}</p>
                        <span className={`text-xs ${
                          payout.status === "COMPLETED" ? "text-green-400" :
                          payout.status === "PROCESSING" ? "text-blue-400" :
                          payout.status === "FAILED" ? "text-red-400" :
                          "text-yellow-400"
                        }`}>{payout.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Request a Payout</h3>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 mb-6 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400 mb-6 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {success}
                </div>
              )}

              {/* Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount (KES)
                </label>
                <Input
                  type="number"
                  min={payoutInfo.minPayoutAmount}
                  max={payoutInfo.availableBalance}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                  className="bg-slate-700/50 border-slate-600 text-white text-lg"
                />
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-slate-400">
                    Commission ({PLATFORM_COMMISSION}%): KES {((parseFloat(formData.amount) || 0) * PLATFORM_COMMISSION / 100).toLocaleString()}
                  </span>
                  <span className="text-amber-400">
                    Net: KES {calculateNetAmount().toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payout Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Payout Method
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.method === "MPESA"
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value="MPESA"
                      checked={formData.method === "MPESA"}
                      onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                      className="sr-only"
                    />
                    <DollarSign className="w-6 h-6 text-amber-400" />
                    <span className="text-white font-medium">M-Pesa</span>
                  </label>

                  <label
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.method === "BANK"
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value="BANK"
                      checked={formData.method === "BANK"}
                      onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                      className="sr-only"
                    />
                    <Building className="w-6 h-6 text-amber-400" />
                    <span className="text-white font-medium">Bank</span>
                  </label>

                  <label
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.method === "PAYPAL"
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value="PAYPAL"
                      checked={formData.method === "PAYPAL"}
                      onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                      className="sr-only"
                    />
                    <CreditCard className="w-6 h-6 text-amber-400" />
                    <span className="text-white font-medium">PayPal</span>
                  </label>
                </div>
              </div>

              {/* M-Pesa Fields */}
              {formData.method === "MPESA" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="e.g., 254712345678"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Enter the phone number registered with M-Pesa
                  </p>
                </div>
              )}

              {/* Bank Fields */}
              {formData.method === "BANK" && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Bank Name
                    </label>
                    <Input
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="e.g., Kenya Commercial Bank"
                      required
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Account Number
                    </label>
                    <Input
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="e.g., 1234567890"
                      required
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Account Name
                    </label>
                    <Input
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      placeholder="e.g., John Doe"
                      required
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
              )}

              {/* PayPal notice */}
              {formData.method === "PAYPAL" && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-blue-400 mb-6">
                  <p>PayPal payouts will be processed manually. Our team will contact you for PayPal details.</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting || payoutInfo.availableBalance < payoutInfo.minPayoutAmount}
                className="w-full bg-amber-600 hover:bg-amber-700 h-12"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 mr-2" />
                    Request Payout
                  </>
                )}
              </Button>

              {payoutInfo.availableBalance < payoutInfo.minPayoutAmount && (
                <p className="text-sm text-yellow-400 text-center mt-3">
                  Minimum payout amount is KES {payoutInfo.minPayoutAmount.toLocaleString()}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
