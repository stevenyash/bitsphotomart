import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { 
  Image, 
  Upload, 
  Eye, 
  Edit, 
  Trash2,
  Check,
  Clock,
  X,
  DollarSign,
  Download,
  Search
} from "lucide-react";

export default async function MyPhotosPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      photographer: true,
    },
  });

  if (!user?.photographer) {
    redirect("/register/photographer");
  }

  const userRole = (session.user as { role?: string })?.role || "USER";

  if (userRole !== "PHOTOGRAPHER" && userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  const photos = await prisma.photo.findMany({
    where: { photographerId: user.photographer.id },
    orderBy: { createdAt: "desc" },
  });

  // Convert Decimal to number for client components
  const photosWithNumberPrice = photos.map((photo) => ({
    ...photo,
    price: Number(photo.price),
  }));

  const totalPhotos = photos.length;
  const approvedPhotos = photosWithNumberPrice.filter((p) => p.status === "APPROVED").length;
  const pendingPhotos = photosWithNumberPrice.filter((p) => p.status === "PENDING").length;
  const totalSales = photosWithNumberPrice.reduce((sum, p) => sum + p.downloadCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">My Photos</h1>
              <p className="text-slate-400">
                Manage your uploaded photos
              </p>
            </div>
            <Link href="/photographer/upload">
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Image className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Photos</p>
                <p className="text-xl font-bold text-white">{totalPhotos}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Approved</p>
                <p className="text-xl font-bold text-white">{approvedPhotos}</p>
              </div>
            </div>

          </div>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Pending</p>
                <p className="text-xl font-bold text-white">{pendingPhotos}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Download className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Downloads</p>
                <p className="text-xl font-bold text-white">{totalSales}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <Image className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No photos yet</h2>
            <p className="text-slate-400 mb-6">Start uploading your photos to sell them on the marketplace</p>
            <Link href="/photographer/upload">
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Photo
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {photosWithNumberPrice.map((photo) => (
              <div key={photo.id} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden group">
                {/* Image */}
                <div className="relative aspect-square">
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    {photo.status === "APPROVED" && (
                      <span className="bg-green-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Approved
                      </span>
                    )}
                    {photo.status === "PENDING" && (
                      <span className="bg-yellow-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {photo.status === "REJECTED" && (
                      <span className="bg-red-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <X className="w-3 h-3" /> Rejected
                      </span>
                    )}
                  </div>

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Link href={`/photographer/photos/${photo.id}/edit`}>
                      <Button size="sm" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-medium text-white truncate">{photo.title}</h3>
                  <p className="text-sm text-slate-400 capitalize">{photo.category}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-amber-400 font-bold">KES {Number(photo.price).toLocaleString()}</span>
                    <div className="flex items-center gap-1 text-slate-400 text-sm">
                      <Download className="w-3 h-3" />
                      {photo.downloadCount}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
