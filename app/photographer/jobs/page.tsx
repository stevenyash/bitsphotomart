import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { theme } from "@/lib/admin-theme";
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign
} from "lucide-react";

const jobTypeLabels: Record<string, string> = {
  PHOTOGRAPHY: 'Photography',
  VIDEOGRAPHY: 'Videography',
  DOCUMENTARY: 'Documentary',
  PHOTO_EDITING: 'Photo Editing',
  EVENT_COVERAGE: 'Event Coverage',
  PRODUCT_PHOTOGRAPHY: 'Product Photography',
  PORTRAIT: 'Portrait Photography',
  COMMERCIAL: 'Commercial Photography',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  REVIEWING: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-purple-100 text-purple-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

async function getPhotographerJobs(userId: string) {
  // Get photographer profile
  const photographer = await prisma.photographer.findUnique({
    where: { userId },
  });

  if (!photographer) return null;

  // Get jobs assigned to this photographer - JobApplication has all job fields directly
  const jobs = await prisma.jobApplication.findMany({
    where: {
      photographerId: photographer.id,
      status: { in: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return { photographer, jobs };
}

export default async function PhotographerJobsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  if ((session.user as { role?: string })?.role !== "PHOTOGRAPHER") {
    redirect("/dashboard");
  }

  const data = await getPhotographerJobs(session.user.id);

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--card)] rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">No Profile Found</h1>
            <p className="text-[var(--muted-foreground)] mb-6">You need to complete your photographer profile to access your jobs.</p>
            <Link href="/register/photographer">
              <Button className="bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)]">Complete Profile</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { jobs } = data;

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/photographer">
            <Button variant="ghost" size="icon" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">My Jobs</h1>
            <p className="text-[var(--muted-foreground)]">View and manage your assigned service jobs</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/photographer/invitations">
            <Button variant="outline" className={`w-full h-16 border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] flex flex-col items-center justify-center gap-1`}>
              <Briefcase className="h-5 w-5" />
              <span>Job Invitations</span>
            </Button>
          </Link>
          <Link href="/photographer/orders">
            <Button variant="outline" className={`w-full h-16 border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] flex flex-col items-center justify-center gap-1`}>
              <CheckCircle className="h-5 w-5" />
              <span>Completed Jobs</span>
            </Button>
          </Link>
          <Link href="/photographer/payout">
            <Button variant="outline" className={`w-full h-16 border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] flex flex-col items-center justify-center gap-1`}>
              <DollarSign className="h-5 w-5" />
              <span>Payouts</span>
            </Button>
          </Link>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className={`${theme.card} p-12 text-center`}>
            <Briefcase className="h-16 w-16 text-[var(--muted-foreground)] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">No Jobs Yet</h2>
            <p className="text-[var(--muted-foreground)] mb-6">
              You don't have any assigned jobs yet. Check your invitations to accept job offers.
            </p>
            <Link href="/photographer/invitations">
              <Button className="bg-amber-600 hover:bg-amber-700">
                View Invitations
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={`${theme.card} p-4`}>
                <div className="flex items-center gap-2 text-[var(--muted-foreground)] mb-1">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-sm">Total Jobs</span>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">{jobs.length}</p>
              </div>
              <div className={`${theme.card} p-4`}>
                <div className="flex items-center gap-2 text-[var(--muted-foreground)] mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">In Progress</span>
                </div>
                <p className="text-2xl font-bold text-indigo-400">
                  {jobs.filter(j => j.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <div className={`${theme.card} p-4`}>
                <div className="flex items-center gap-2 text-[var(--muted-foreground)] mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Completed</span>
                </div>
                <p className="text-2xl font-bold text-green-400">
                  {jobs.filter(j => j.status === 'COMPLETED').length}
                </p>
              </div>
              <div className={`${theme.card} p-4`}>
                <div className="flex items-center gap-2 text-[var(--muted-foreground)] mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Assigned</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">
                  {jobs.filter(j => j.status === 'ASSIGNED').length}
                </p>
              </div>
            </div>

            {/* Job Cards */}
            {jobs.map((job) => (
              <div key={job.id} className={`${theme.card} p-6`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Job Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${theme.muted} text-[var(--muted-foreground)]`}>
                        {jobTypeLabels[job.jobType] || job.jobType}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                      {job.clientName || `${jobTypeLabels[job.jobType]} Service`}
                    </h3>
                    
                    <p className="text-[var(--muted-foreground)] text-sm mb-3">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {job.eventDate 
                            ? new Date(job.eventDate).toLocaleDateString()
                            : 'Flexible'}
                        </span>
                      </div>
                      {job.budget && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>KSh {Number(job.budget).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Client Info & Actions */}
                  <div className="md:w-64">
                    <div className={`${theme.muted} p-4 rounded-lg mb-4`}>
                      <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Client</h4>
                      <p className="text-[var(--foreground)] font-medium">{job.clientName || 'Client'}</p>
                      <p className="text-[var(--muted-foreground)] text-sm">{job.clientEmail}</p>
                      {job.clientPhone && (
                        <p className="text-[var(--muted-foreground)] text-sm">{job.clientPhone}</p>
                      )}
                    </div>

                    {/* Status-specific actions */}
                    {/* Status display only - contact admin to change status */}
                    {job.status === 'ASSIGNED' && (
                      <div className="w-full bg-indigo-600/20 text-indigo-400 text-center py-2 rounded-lg text-sm">
                        Waiting to start - Contact admin if ready
                      </div>
                    )}

                    {job.status === 'IN_PROGRESS' && (
                      <div className="w-full bg-yellow-600/20 text-yellow-400 text-center py-2 rounded-lg text-sm">
                        Job in progress
                      </div>
                    )}

                    {job.status === 'COMPLETED' && (
                      <div className="text-center text-green-400 text-sm">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Job Completed</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between text-xs text-[var(--muted-foreground)]">
                  <span>Updated: {new Date(job.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
