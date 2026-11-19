import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Package, Download, Printer, Mail } from "lucide-react";
import { theme } from "@/lib/admin-theme";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect("/login");
  }

  // Get order details
  const order = await prisma.order.findFirst({
    where: { 
      id,
      userId: user.id,
    },
    include: {
      items: {
        include: {
          photo: {
            include: {
              photographer: {
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "PROCESSING":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className={`${theme.card} border-b`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Order #{order.orderNumber}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className={`${theme.card} rounded-xl shadow-sm p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Order Status</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--muted-foreground)]">Order Date</p>
                  <p className="font-medium text-[var(--foreground)]">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {order.paidAt && (
                  <div>
                    <p className="text-[var(--muted-foreground)]">Payment Date</p>
                    <p className="font-medium text-[var(--foreground)]">
                      {new Date(order.paidAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[var(--muted-foreground)]">Payment Method</p>
                  <p className="font-medium text-[var(--foreground)]">{order.paymentMethod || "M-Pesa"}</p>
                </div>
                {order.mpesaReceipt && (
                  <div>
                    <p className="text-[var(--muted-foreground)]">M-Pesa Receipt</p>
                    <p className="font-medium text-[var(--foreground)]">{order.mpesaReceipt}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items Card */}
            <div className={`${theme.card} rounded-xl shadow-sm p-6`}>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Ordered Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b border-[var(--border)] pb-4 last:border-0">
                    {/* Photo */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.photo.thumbnailUrl ? (
                        <img
                          src={item.photo.thumbnailUrl}
                          alt={item.photo.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <h3 className="font-medium text-[var(--foreground)]">
                        {item.photo.title}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        by {item.photo.photographer?.user?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {item.licenseType} License
                      </p>
                    </div>

                    {/* Price & Download */}
                    <div className="flex flex-col items-end justify-between">
                      <span className="font-medium text-[var(--foreground)]">
                        KES {Number(item.price).toLocaleString()}
                      </span>
                      {order.status === "PAID" && item.downloadKey && (
                        <Link href={`/dashboard/orders/${order.id}/download/${item.id}`}>
                          <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className={`${theme.card} rounded-xl shadow-sm p-6 sticky top-4`}>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Order Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Subtotal ({order.items.length} items)</span>
                  <span className="font-medium text-[var(--foreground)]">KES {Number(order.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Tax</span>
                  <span className="font-medium text-[var(--foreground)]">KES {Number(order.tax).toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-[var(--foreground)]">Total</span>
                  <span className="text-amber-600">KES {Number(order.total).toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <Button variant="outline" className="w-full">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Invoice
                </Button>
                <Button variant="outline" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Invoice
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
