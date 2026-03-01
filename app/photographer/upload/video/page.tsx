import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VideoUploadForm } from "../video-upload-form";

export default async function UploadVideoPage() {
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

  if (user.photographer.status !== "APPROVED") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Account Pending Approval</h1>
          <p className="text-slate-400 mb-6">
            Your photographer account is currently pending approval. 
            You will be able to upload videos once your account is approved by an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Upload Video</h1>
          <p className="text-slate-400 mt-2">
            Share your stock footage with the marketplace
          </p>
        </div>

        <VideoUploadForm photographerId={user.photographer.id} />
      </div>
    </div>
  );
}
