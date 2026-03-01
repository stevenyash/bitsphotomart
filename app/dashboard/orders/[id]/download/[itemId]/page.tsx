import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Download, CheckCircle, Image, FileImage } from "lucide-react";

interface DownloadPageProps {
  params: Promise<{ id: string; itemId: string }>;
}

export default async function DownloadPage({ params }: DownloadPageProps) {
  const { id, itemId } = await params;
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

  // Get order and verify ownership
  const order = await prisma.order.findFirst({
    where: { 
      id,
      userId: user.id,
      status: "PAID",
    },
    include: {
      items: {
        where: { id: itemId },
        include: {
          photo: true,
        },
      },
    },
  });

  if (!order || order.items.length === 0) {
    notFound();
  }

  const orderItem = order.items[0];

  // Mark as downloaded if not already
  if (!orderItem.downloaded) {
    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        downloaded: true,
        downloadedAt: new Date(),
      },
    });
  }

  const photo = orderItem.photo;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/orders/${id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Order
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Download Photo</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="font-semibold text-green-800">Ready for Download</h2>
                <p className="text-sm text-green-600">
                  Your download is ready. Click the button below to download your photo.
                </p>
              </div>
            </div>
          </div>

          {/* Photo Preview */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="aspect-video bg-gray-100 relative">
              {photo.originalUrl ? (
                <img
                  src={photo.originalUrl}
                  alt={photo.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Image className="w-16 h-16" />
                </div>
              )}
            </div>
            
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{photo.title}</h2>
              {photo.description && (
                <p className="text-gray-600 mb-4">{photo.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">License Type</p>
                  <p className="font-medium">{orderItem.licenseType}</p>
                </div>
                <div>
                  <p className="text-gray-500">Price Paid</p>
                  <p className="font-medium">KES {Number(orderItem.price).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Resolution</p>
                  <p className="font-medium">{photo.width}x{photo.height}</p>
                </div>
                <div>
                  <p className="text-gray-500">Format</p>
                  <p className="font-medium">JPEG</p>
                </div>
              </div>
            </div>
          </div>

          {/* Download Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileImage className="w-8 h-8 text-amber-600" />
                  <div>
                    <p className="font-medium">High Resolution</p>
                    <p className="text-sm text-gray-500">
                      {photo.width}x{photo.height} • JPEG
                    </p>
                  </div>
                </div>
                <a 
                  href={photo.originalUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download Photo
                  </Button>
                </a>
              </div>
            </div>

            {/* License Info */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-2">License Information</h3>
              <div className="text-sm text-gray-600 space-y-2">
                {orderItem.licenseType === "STANDARD" ? (
                  <p>
                    <strong>Standard License</strong> - Use for personal, non-commercial projects. 
                    Up to 500,000 impressions or views. No resale rights.
                  </p>
                ) : (
                  <p>
                    <strong>Extended License</strong> - Use for commercial, personal, and resale purposes. 
                    Unlimited impressions. Includes merchandise rights.
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  By downloading this photo, you agree to the Terms of Service.
                </p>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Having trouble downloading?{" "}
              <Link href="/contact" className="text-amber-600 hover:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
