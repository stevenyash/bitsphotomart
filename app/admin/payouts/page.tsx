"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft,
  Loader2,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard
} from "lucide-react";

interface Payout {
  id: string;
  amount: number;
  status: string;
  notes: string | null;
  paymentMethod: string;
  transactionId: string | null;
  createdAt: string;
  processedAt: string | null;
  photographer: {
    id: string;
    user: {
      id: string;
      email: string;
      name: string | null;
      phone: string | null;
    };
  };
}

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
  APPROVED: { bg: "bg-blue-100", text: "text-blue-800", icon: CheckCircle },
  COMPLETED: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
  REJECTED: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
};

const statusOptions = ["PENDING", "APPROVED", "COMPLETED", "REJECTED"];

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState({ totalPending: 0, totalPaid: 0 });
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    fetchPayouts();
  }, [filter, pagination.page]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) {
        params.set("status", filter);
      }
      params.set("page", pagination.page.toString());
      params.set("limit", "20");
      
      const res = await fetch(`/api/admin/payouts?${params.toString()}`);
      const data = await res.json();
      
      setPayouts(data.payouts || []);
      setStats(data.stats || { totalPending: 0, totalPaid: 0 });
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error("Error fetching payouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async (payoutId: string, action: string) => {
    try {
      setProcessingId(payoutId);
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          payoutId, 
          action,
          notes: actionNotes,
          transactionId: action === "COMPLETE" ? transactionId : undefined
        }),
      });

      if (res.ok) {
        fetchPayouts();
        setSelectedPayout(null);
        setActionNotes("");
        setTransactionId("");
      }
    } catch (error) {
      console.error("Error processing payout:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-red-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/admin'}
              className="text-white hover:bg-red-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Payout Management</h1>
              <p className="text-red-100 text-lg">Manage photographer payout requests</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-yellow-100 rounded-xl">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Payouts</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalPending)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-100 rounded-xl">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalPaid)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === "" ? "default" : "outline"}
              onClick={() => { setFilter(""); setPagination({ ...pagination, page: 1 }); }}
              className={filter === "" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              All
            </Button>
            {statusOptions.map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                onClick={() => { setFilter(status); setPagination({ ...pagination, page: 1 }); }}
                className={filter === status ? "bg-red-600 hover:bg-red-700" : ""}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Payouts List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payout requests found</h3>
            <p className="text-gray-600">
              {filter ? "Try a different filter." : "No payout requests in the system yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((payout) => {
              const statusStyle = statusColors[payout.status] || statusColors.PENDING;
              const StatusIcon = statusStyle.icon;
              
              return (
                <div 
                  key={payout.id} 
                  className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Payout Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-gray-500">#{payout.id.slice(-8).toUpperCase()}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          <StatusIcon className="h-3 w-3 inline mr-1" />
                          {payout.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{payout.photographer.user.name || "N/A"}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {payout.photographer.user.email}
                        </p>
                        {payout.photographer.user.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {payout.photographer.user.phone}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Requested: {formatDate(payout.createdAt)}
                        </p>
                        <p className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Method: {payout.paymentMethod}
                        </p>
                        {payout.transactionId && (
                          <p className="text-xs text-gray-500">Transaction: {payout.transactionId}</p>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-center md:text-right">
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(payout.amount)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedPayout(payout)}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                      
                      {payout.status === "PENDING" && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleProcessPayout(payout.id, "APPROVE")}
                            disabled={processingId === payout.id}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            {processingId === payout.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleProcessPayout(payout.id, "REJECT")}
                            disabled={processingId === payout.id}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            {processingId === payout.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </>
                            )}
                          </Button>
                        </>
                      )}
                      
                      {payout.status === "APPROVED" && (
                        <Button
                          variant="outline"
                          onClick={() => setSelectedPayout(payout)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Mark as Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Payout Details Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payout Request</h2>
                  <p className="text-sm text-gray-500">#{selectedPayout.id.slice(-8).toUpperCase()}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => { setSelectedPayout(null); setActionNotes(""); setTransactionId(""); }}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              {/* Payout Info */}
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedPayout.amount)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Photographer</p>
                  <p className="font-medium">{selectedPayout.photographer.user.name || "N/A"}</p>
                  <p className="text-sm text-gray-600">{selectedPayout.photographer.user.email}</p>
                  {selectedPayout.photographer.user.phone && (
                    <p className="text-sm text-gray-600">{selectedPayout.photographer.user.phone}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">{selectedPayout.paymentMethod}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Requested</p>
                  <p className="font-medium">{formatDate(selectedPayout.createdAt)}</p>
                </div>

                {selectedPayout.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="font-medium">{selectedPayout.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions for Pending Payouts */}
              {selectedPayout.status === "PENDING" && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <Input
                      placeholder="Add notes for this payout..."
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleProcessPayout(selectedPayout.id, "APPROVE")}
                      disabled={processingId === selectedPayout.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processingId === selectedPayout.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Approve Request"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleProcessPayout(selectedPayout.id, "REJECT")}
                      disabled={processingId === selectedPayout.id}
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    >
                      {processingId === selectedPayout.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Reject"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions for Approved Payouts */}
              {selectedPayout.status === "APPROVED" && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID
                    </label>
                    <Input
                      placeholder="Enter transaction ID..."
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => handleProcessPayout(selectedPayout.id, "COMPLETE")}
                    disabled={processingId === selectedPayout.id}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {processingId === selectedPayout.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Mark as Paid"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
