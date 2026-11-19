'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { theme } from "@/lib/admin-theme";

interface JobInvitation {
  id: string;
  jobId: string;
  status: string;
  adminMessage: string | null;
  photographerResponse: string | null;
  invitedAt: string;
  respondedAt: string | null;
  jobApplication: {
    id: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    jobType: string;
    description: string;
    location: string;
    eventDate: string | null;
    budget: string | null;
    status: string;
  };
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
};

const jobTypeLabels: Record<string, string> = {
  PHOTOGRAPHY: 'Photography',
  VIDEOGRAPHY: 'Videography',
  DRONE: 'Drone/Aerial',
  DOCUMENTARY: 'Documentary',
  EVENT_COVERAGE: 'Event Coverage',
  PRODUCT_SHOOT: 'Product Shoot',
  CUSTOM: 'Custom Request',
};

export default function PhotographerInvitationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invitations, setInvitations] = useState<JobInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedInvitation, setSelectedInvitation] = useState<JobInvitation | null>(null);
  const [responding, setResponding] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchInvitations();
    }
  }, [status, router, filter]);

  const fetchInvitations = async () => {
    try {
      const url = filter ? `/api/job-invitations?status=${filter}` : '/api/job-invitations';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId: string, action: 'ACCEPTED' | 'DECLINED') => {
    setResponding(true);
    try {
      const res = await fetch('/api/job-invitations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          status: action,
          photographerResponse: responseMessage,
        }),
      });

      if (res.ok) {
        fetchInvitations();
        setSelectedInvitation(null);
        setResponseMessage('');
      }
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
    } finally {
      setResponding(false);
    }
  };

  const pendingCount = invitations.filter(i => i.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Job Invitations</h1>
          <p className="text-blue-100 text-lg">
            Respond to job opportunities from clients
            {pendingCount > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-sm px-3 py-1 rounded-full">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">All Invitations</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`px-4 py-2 border border-[var(--border)] rounded-lg ${theme.card}`}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="DECLINED">Declined</option>
          </select>
        </div>

        {invitations.length === 0 ? (
          <div className={`${theme.card} p-12 text-center`}>
            <div className="text-6xl mb-4">📬</div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No Invitations Yet</h3>
            <p className="text-[var(--muted-foreground)]">
              You haven't received any job invitations yet. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className={`${theme.card} p-6 hover:shadow-lg transition`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[invitation.status]}`}>
                        {invitation.status}
                      </span>
                      <span className="text-[var(--muted-foreground)] text-sm">
                        {jobTypeLabels[invitation.jobApplication.jobType] || invitation.jobApplication.jobType}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">
                      {invitation.jobApplication.clientName}'s {jobTypeLabels[invitation.jobApplication.jobType] || 'Job'}
                    </h3>
                    <div className="mt-2 space-y-1 text-[var(--muted-foreground)]">
                      <p>📍 {invitation.jobApplication.location}</p>
                      {invitation.jobApplication.eventDate && (
                        <p>📅 {new Date(invitation.jobApplication.eventDate).toLocaleDateString()}</p>
                      )}
                      {invitation.jobApplication.budget && (
                        <p className="font-medium text-green-600">
                          Budget: KES {parseFloat(invitation.jobApplication.budget).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {invitation.adminMessage && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Admin Note:</strong> {invitation.adminMessage}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setSelectedInvitation(invitation)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-sm text-[var(--muted-foreground)]">
                  Invited: {new Date(invitation.invitedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for invitation details */}
      {selectedInvitation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.card} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">Job Invitation</h2>
                <button
                  onClick={() => {
                    setSelectedInvitation(null);
                    setResponseMessage('');
                  }}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[var(--muted-foreground)]">Client Name</label>
                    <p className="font-medium text-[var(--foreground)]">{selectedInvitation.jobApplication.clientName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--muted-foreground)]">Contact</label>
                    <p className="font-medium text-[var(--foreground)]">{selectedInvitation.jobApplication.clientPhone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--muted-foreground)]">Job Type</label>
                    <p className="font-medium text-[var(--foreground)]">
                      {jobTypeLabels[selectedInvitation.jobApplication.jobType] || selectedInvitation.jobApplication.jobType}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--muted-foreground)]">Location</label>
                    <p className="font-medium text-[var(--foreground)]">{selectedInvitation.jobApplication.location}</p>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--muted-foreground)]">Event Date</label>
                    <p className="font-medium text-[var(--foreground)]">
                      {selectedInvitation.jobApplication.eventDate
                        ? new Date(selectedInvitation.jobApplication.eventDate).toLocaleDateString()
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--muted-foreground)]">Budget</label>
                    <p className="font-medium text-green-600">
                      {selectedInvitation.jobApplication.budget
                        ? `KES ${parseFloat(selectedInvitation.jobApplication.budget).toLocaleString()}`
                        : 'Not specified'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[var(--muted-foreground)]">Job Description</label>
                  <p className="mt-1 text-[var(--foreground)] whitespace-pre-wrap">
                    {selectedInvitation.jobApplication.description}
                  </p>
                </div>

                {selectedInvitation.adminMessage && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <label className="text-sm text-blue-600 font-medium">Message from Admin:</label>
                    <p className="text-blue-800 mt-1">{selectedInvitation.adminMessage}</p>
                  </div>
                )}

                <div className={`p-4 rounded-lg ${statusColors[selectedInvitation.status]} bg-opacity-20`}>
                  <label className="text-sm font-medium">Status:</label>
                  <p className="font-bold">{selectedInvitation.status}</p>
                </div>

                {/* Response section for pending invitations */}
                {selectedInvitation.status === 'PENDING' && (
                  <div className="pt-4 border-t border-[var(--border)]">
                    <label className="text-sm text-[var(--muted-foreground)] mb-2 block">
                      Your Response (optional message)
                    </label>
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="Add a message to your response..."
                      className={`w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 ${theme.input}`}
                      rows={3}
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleRespond(selectedInvitation.id, 'ACCEPTED')}
                        disabled={responding}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {responding ? 'Processing...' : '✓ Accept Job'}
                      </button>
                      <button
                        onClick={() => handleRespond(selectedInvitation.id, 'DECLINED')}
                        disabled={responding}
                        className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                      >
                        {responding ? 'Processing...' : '✗ Decline'}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-2">
                      By accepting, you agree to take on this job. The client will be notified.
                    </p>
                  </div>
                )}

                {selectedInvitation.status === 'ACCEPTED' && (
                  <div className="pt-4 border-t border-[var(--border)] bg-green-50 p-4 rounded-lg">
                    <p className="text-green-800 font-medium">
                      ✓ You have accepted this job. Check your dashboard for details.
                    </p>
                  </div>
                )}

                {selectedInvitation.status === 'DECLINED' && selectedInvitation.photographerResponse && (
                  <div className="pt-4 border-t border-[var(--border)]">
                    <label className="text-sm text-[var(--muted-foreground)]">Your Response:</label>
                    <p className="text-[var(--foreground)]">{selectedInvitation.photographerResponse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
