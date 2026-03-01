import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PhotoUploadForm } from "./photo-upload-form";

export default async function UploadPage() {
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

  // Only allow photographers and admins
  if (userRole !== "PHOTOGRAPHER" && userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  // Check if photographer is approved
  if (user.photographer.status !== "APPROVED") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Account Pending Approval</h2>
            <p className="text-slate-400 mb-4">
              Your photographer account is still pending approval. You will be able to upload photos once approved.
            </p>
            <p className="text-slate-500 text-sm">
              Status: <span className="text-amber-400 capitalize">{user.photographer.status.toLowerCase()}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Upload Photos</h1>
          <p className="text-slate-400">
            Add new photos to your portfolio
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <PhotoUploadForm photographerId={user.photographer.id} />
      </div>
    </div>
  );
}
