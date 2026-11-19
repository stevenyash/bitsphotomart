import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./profile-form";
import { AddressList } from "./address-list";
import { theme } from "@/lib/admin-theme";

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatar: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: { isDefault: "desc" },
  });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className={`${theme.card} border-b`}>
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">My Profile</h1>
          <p className="text-[var(--muted-foreground)]">
            Manage your account settings and addresses
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <div className={`${theme.card} rounded-xl shadow-sm p-6`}>
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">Profile Information</h2>
            <ProfileForm user={user} />
          </div>

          {/* Account Details */}
          <div className="space-y-8">
            <div className={`${theme.card} rounded-xl shadow-sm p-6`}>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Account Details</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-[var(--muted-foreground)]">Email</dt>
                  <dd className="text-sm text-[var(--foreground)]">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--muted-foreground)]">Account Type</dt>
                  <dd className="text-sm text-[var(--foreground)] capitalize">{user.role.toLowerCase()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--muted-foreground)]">Account Status</dt>
                  <dd className="text-sm">
                    {user.isVerified ? (
                      <span className="text-green-600">Verified</span>
                    ) : (
                      <span className="text-yellow-600">Pending Verification</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--muted-foreground)]">Member Since</dt>
                  <dd className="text-sm text-[var(--foreground)]">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Addresses */}
            <div className={`${theme.card} rounded-xl shadow-sm p-6`}>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">My Addresses</h2>
              <AddressList addresses={addresses} userId={user.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
