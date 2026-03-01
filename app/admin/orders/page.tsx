"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart,
  ArrowLeft,
  Loader2,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Package,
  Image as ImageIcon
} from "lucide-react";

interface OrderItem {
  id: string;
  photoId: string;
  quantity: number;
  price: number;
  photo: {
    id: string;
    title: string;
    imageUrl: string;
    price: number;
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  items: OrderItem[];
}

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
  PAID: { bg: "bg-blue-100", text: "text-blue-800", icon: DollarSign },
  PROCESSING: { bg: "bg-purple-100", text: "text-purple-800", icon: Package },
  COMPLETED: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
  CANCELLED: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
  REFUNDED: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircle },
};

const statusOptions = ["PENDING", "PAID", "PROCESSING", "COMPLETED", "CANCELLED", "REFUNDED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0 });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [filter, pagination.page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) {
        params.set("status", filter);
      }
      params.set("page", pagination.page.toString());
      params.set("limit", "20");
      
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      
      setOrders(data.orders || []);
      setStats(data.stats || { totalOrders: 0, totalRevenue: 0 });
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setProcessingId(orderId);
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (res.ok) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (error) {
      console.error("Error updating order:", error);
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
              <h1 className="text-3xl font-bold">Order Management</h1>
              <p className="text-red-100 text-lg">View and manage all orders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-100 rounded-xl">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-100 rounded-xl">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
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

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {filter ? "Try a different filter." : "No orders in the system yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusStyle = statusColors[order.status] || statusColors.PENDING;
              const StatusIcon = statusStyle.icon;
              
              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-gray-500">#{order.id.slice(-8).toUpperCase()}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          <StatusIcon className="h-3 w-3 inline mr-1" />
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Customer:</span> {order.user.name || "N/A"} ({order.user.email})</p>
                        <p><span className="font-medium">Date:</span> {formatDate(order.createdAt)}</p>
                        <p><span className="font-medium">Items:</span> {order.items.length} item(s)</p>
                        <p className="text-lg font-bold text-gray-900">
                          Total: {formatCurrency(order.totalAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      
                      {order.status === "PENDING" && (
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateStatus(order.id, "PAID")}
                          disabled={processingId === order.id}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          {processingId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Paid
                            </>
                          )}
                        </Button>
                      )}
                      
                      {order.status === "PAID" && (
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateStatus(order.id, "PROCESSING")}
                          disabled={processingId === order.id}
                          className="text-purple-600 border-purple-600 hover:bg-purple-50"
                        >
                          {processingId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Package className="h-4 w-4 mr-1" />
                              Process
                            </>
                          )}
                        </Button>
                      )}
                      
                      {order.status === "PROCESSING" && (
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                          disabled={processingId === order.id}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          {processingId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </>
                          )}
                        </Button>
                      )}
                      
                      {["PENDING", "PAID"].includes(order.status) && (
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                          disabled={processingId === order.id}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          {processingId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </>
                          )}
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                  <p className="text-sm text-gray-500">Order #{selectedOrder.id.slice(-8).toUpperCase()}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedOrder(null)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              {/* Status Update */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <div className="flex gap-2 flex-wrap">
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      variant={selectedOrder.status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                      disabled={selectedOrder.status === status || processingId === selectedOrder.id}
                      className={selectedOrder.status === status ? "bg-green-600" : ""}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedOrder.user.name || "N/A"}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-20 h-20 relative flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                        {item.photo.imageUrl ? (
                          <img
                            src={item.photo.imageUrl}
                            alt={item.photo.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.photo.title}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
