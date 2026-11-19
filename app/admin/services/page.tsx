'use client';

import { useState, useEffect } from 'react';
import { theme } from "@/lib/admin-theme";

interface Photographer {
  id: string;
  user: {
    name: string | null;
    email: string | null;
  };
  specialty: string | null;
  location: string | null;
  rating: number;
}

// Helper function to check if two locations match (case-insensitive partial match)
const isLocationMatch = (photographerLoc: string | null, jobLoc: string): boolean => {
  if (!photographerLoc || !jobLoc) return false;
  const pLoc = photographerLoc.toLowerCase();
  const jLoc = jobLoc.toLowerCase();
  return pLoc.includes(jLoc) || jLoc.includes(pLoc);
};

interface ServiceRequest {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string | null;
  jobType: string;
  description: string;
  location: string;
  eventDate: string | null;
  budget: string | null;
  status: string;
  photographerId: string | null;
  adminNotes: string | null;
  createdAt: string;
  // Documentary specific fields
  storyDetails: string | null;
  animationStyle: string | null;
  artworkRequired: boolean;
  artworkDetails: string | null;
  clientMediaUrl: string | null;
  duration: number | null;
  voiceover: boolean;
  musicTrack: boolean;
  subtitles: boolean;
  deliveryFormat: string | null;
  // Videographer coverage fields
  videographerCoverage: boolean;
  coverageType: string | null;
  coverageLocation: string | null;
  coverageDate: string | null;
  coverageDuration: number | null;
  photographer?: {
    id: string;
    user: { name: string | null; email: string | null };
  } | null;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  REVIEWING: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  ASSIGNED: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
  IN_PROGRESS: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
  COMPLETED: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  CANCELLED: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  REJECTED: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
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

const animationStyleLabels: Record<string, string> = {
  NONE: 'No Animation',
  HAND_DRAWN: 'Hand Drawn',
  MOTION_GRAPHICS: 'Motion Graphics',
  WHITEBOARD: 'Whiteboard',
  INFOGRAPHIC: 'Infographic',
  STOP_MOTION: 'Stop Motion',
  ANIMATION_3D: '3D Animation',
  MR_SMART_STYLE: 'Mr Smart Style',
};

const deliveryFormatLabels: Record<string, string> = {
  MP4: 'MP4',
  MOV: 'MOV',
  AVI: 'AVI',
  MKV: 'MKV',
  DVD: 'DVD',
  BLU_RAY: 'Blu-Ray',
  RAW: 'RAW',
};

const coverageTypeLabels: Record<string, string> = {
  EVENT_COVERAGE: 'Event Coverage',
  INTERVIEW: 'Interview',
  B_ROLL: 'B-Roll Footage',
  LOCATION_SHOOT: 'Location Shoot',
  PRODUCT_SHOT: 'Product/Service Shoot',
  PROMOTIONAL: 'Promotional Video',
  MEMORIAL: 'Memorial/Tribute',
  CORPO_RATE: 'Corporate Documentary',
};

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [assigningPhotographer, setAssigningPhotographer] = useState(false);
  const [promptingPhotographers, setPromptingPhotographers] = useState(false);
  const [invitationsSentForSelected, setInvitationsSentForSelected] = useState(false);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  const [promptMessage, setPromptMessage] = useState('');
  const [sendingInvites, setSendingInvites] = useState(false);

  // Filter photographers based on job type and location
  const getMatchingPhotographers = (jobType: string, jobLocation: string): Photographer[] => {
    return photographers.filter(p => {
      // Match job type with photographer specialty
      const specialty = p.specialty?.toLowerCase() || '';
      const jobTypeLower = jobType.toLowerCase();
      
      // If job is DOCUMENTARY or VIDEOGRAPHY, prefer videographers
      if (jobType === 'DOCUMENTARY' || jobType === 'VIDEOGRAPHY') {
        return specialty.includes('video') || specialty.includes('cinema') || specialty.includes('documentary');
      }
      // For photography jobs
      if (jobType === 'PHOTOGRAPHY' || jobType === 'EVENT_COVERAGE') {
        return specialty.includes('photo') || specialty.includes('event') || specialty.includes('wedding');
      }
      return true; // Show all if no specific match
    });
  };

  useEffect(() => {
    fetchRequests();
    fetchPhotographers();
  }, [filter]);

  const fetchPhotographers = async () => {
    try {
      // Fetch only APPROVED photographers for job assignment
      const res = await fetch('/api/admin/photographers?status=APPROVED');
      if (res.ok) {
        const data = await res.json();
        console.log('Photographers fetched:', data);
        // Handle both array and object response formats
        const photographersList = Array.isArray(data) ? data : (data.photographers || []);
        setPhotographers(photographersList);
      } else {
        console.error('Failed to fetch photographers, status:', res.status);
      }
    } catch (error) {
      console.error('Failed to fetch photographers:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const url = filter ? `/api/service-request?status=${filter}` : '/api/service-request';
      const res = await fetch(url);
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/service-request/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchRequests();
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const assignPhotographer = async (photographerId: string) => {
    if (!selectedRequest) return;
    try {
      const res = await fetch(`/api/service-request/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          photographerId: photographerId || null,
          status: photographerId ? 'ASSIGNED' : 'PENDING'
        }),
      });
      if (res.ok) {
        fetchRequests();
        setAssigningPhotographer(false);
        // Refresh the selected request
        const updated = await fetch(`/api/service-request/${selectedRequest.id}`);
        const data = await updated.json();
        setSelectedRequest(data);
      }
    } catch (error) {
      console.error('Failed to assign photographer:', error);
    }
  };

  const sendInvitations = async () => {
    if (!selectedRequest || selectedPhotographers.length === 0) return;
    setSendingInvites(true);
    try {
      const res = await fetch('/api/job-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedRequest.id,
          photographerIds: selectedPhotographers,
          adminMessage: promptMessage,
        }),
      });
      if (res.ok) {
        alert(`Invitations sent to ${selectedPhotographers.length} photographers!`);
        setPromptingPhotographers(false);
        setSelectedPhotographers([]);
        setPromptMessage('');
        setInvitationsSentForSelected(true); // Mark that invitations have been sent
        fetchRequests();
        // Refresh the selected request
        const updated = await fetch(`/api/service-request/${selectedRequest.id}`);
        const data = await updated.json();
        setSelectedRequest(data);
      }
    } catch (error) {
      console.error('Failed to send invitations:', error);
    } finally {
      setSendingInvites(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.secondary} p-8`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${theme.heading}`}>Service Requests</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Requests</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className={`font-medium ${theme.heading}`}>{req.clientName}</div>
                      <div className="text-sm text-gray-500">{req.clientEmail}</div>
                      <div className="text-sm text-gray-500">{req.clientPhone}</div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme.heading}`}>{jobTypeLabels[req.jobType] || req.jobType}</td>
                    <td className={`px-6 py-4 text-sm ${theme.heading}`}>{req.location}</td>
                    <td className={`px-6 py-4 text-sm ${theme.heading}`}>{req.eventDate ? new Date(req.eventDate).toLocaleDateString() : '-'}</td>
                    <td className={`px-6 py-4 text-sm ${theme.heading}`}>{req.budget ? `KES ${parseFloat(req.budget).toLocaleString()}` : '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-gray-100'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => { setSelectedRequest(req); setInvitationsSentForSelected(false); }} className="text-primary hover:opacity-80 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && <div className="text-center py-12 text-gray-500">No service requests found</div>}
          </div>
        )}

        {/* Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className={`text-2xl font-bold ${theme.heading}`}>Service Request Details</h2>
                  <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Client Name</label>
                      <p className="font-medium">{selectedRequest.clientName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="font-medium">{selectedRequest.clientEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <p className="font-medium">{selectedRequest.clientPhone}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Location</label>
                      <p className="font-medium">{selectedRequest.location}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Service Type</label>
                      <p className="font-medium">{jobTypeLabels[selectedRequest.jobType] || selectedRequest.jobType}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Event Date</label>
                      <p className="font-medium">{selectedRequest.eventDate ? new Date(selectedRequest.eventDate).toLocaleDateString() : 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Budget</label>
                      <p className="font-medium">{selectedRequest.budget ? `KES ${parseFloat(selectedRequest.budget).toLocaleString()}` : 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Status</label>
                      <p className="font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedRequest.status]}`}>
                          {selectedRequest.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Documentary-specific fields */}
                  {selectedRequest.jobType === 'DOCUMENTARY' && (
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-purple-900 mb-3">📹 Documentary Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedRequest.duration && (
                          <div>
                            <label className="text-sm text-gray-500">Duration</label>
                            <p className="font-medium">{selectedRequest.duration} minutes</p>
                          </div>
                        )}
                        {selectedRequest.deliveryFormat && (
                          <div>
                            <label className="text-sm text-gray-500">Delivery Format</label>
                            <p className="font-medium">{deliveryFormatLabels[selectedRequest.deliveryFormat] || selectedRequest.deliveryFormat}</p>
                          </div>
                        )}
                        {/* Videographer Coverage Section */}
                        {selectedRequest.videographerCoverage && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="font-semibold text-purple-600 mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Videographer Coverage Required
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              {selectedRequest.coverageType && (
                                <div>
                                  <label className="text-sm text-gray-500">Coverage Type</label>
                                  <p className="font-medium">{coverageTypeLabels[selectedRequest.coverageType] || selectedRequest.coverageType}</p>
                                </div>
                              )}
                              {selectedRequest.coverageLocation && (
                                <div>
                                  <label className="text-sm text-gray-500">Coverage Location</label>
                                  <p className="font-medium">{selectedRequest.coverageLocation}</p>
                                </div>
                              )}
                              {selectedRequest.coverageDate && (
                                <div>
                                  <label className="text-sm text-gray-500">Coverage Date</label>
                                  <p className="font-medium">{new Date(selectedRequest.coverageDate).toLocaleDateString()}</p>
                                </div>
                              )}
                              {selectedRequest.coverageDuration && (
                                <div>
                                  <label className="text-sm text-gray-500">Coverage Duration</label>
                                  <p className="font-medium">{selectedRequest.coverageDuration} hour(s)</p>
                                </div>
                              )}
                            </div>
                            <p className="mt-3 text-sm text-purple-600 bg-purple-50 p-2 rounded">
                              ⚠️ Action needed: Engage a verified videographer from the network to cover this event.
                            </p>
                          </div>
                        )}
                        {selectedRequest.animationStyle && selectedRequest.animationStyle !== 'NONE' && (
                          <div>
                            <label className="text-sm text-gray-500">Animation Style</label>
                            <p className="font-medium">{animationStyleLabels[selectedRequest.animationStyle] || selectedRequest.animationStyle}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm text-gray-500">Production Elements</label>
                          <p className="font-medium">
                            {[selectedRequest.voiceover && 'Voiceover', selectedRequest.musicTrack && 'Music', selectedRequest.subtitles && 'Subtitles'].filter(Boolean).join(', ') || 'None'}
                          </p>
                        </div>
                        {selectedRequest.artworkRequired && (
                          <div className="col-span-2">
                            <label className="text-sm text-gray-500">Artwork Required</label>
                            <p className="font-medium text-purple-600">✓ Yes - {(selectedRequest.animationStyle && animationStyleLabels[selectedRequest.animationStyle]) || 'Animation'} Style</p>
                            {selectedRequest.artworkDetails && (
                              <p className="text-sm text-gray-600 mt-1">{selectedRequest.artworkDetails}</p>
                            )}
                          </div>
                        )}
                        {selectedRequest.storyDetails && (
                          <div className="col-span-2">
                            <label className="text-sm text-gray-500">Story Development</label>
                            <p className="text-sm text-gray-700">{selectedRequest.storyDetails}</p>
                          </div>
                        )}
                        {selectedRequest.clientMediaUrl && (
                          <div className="col-span-2">
                            <label className="text-sm text-gray-500">Client Media</label>
                            <a href={selectedRequest.clientMediaUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                              View Attached Media →
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm text-gray-500">Description</label>
                    <p className={`mt-1 ${theme.heading} whitespace-pre-wrap`}>{selectedRequest.description}</p>
                  </div>

                  {selectedRequest.clientAddress && (
                    <div>
                      <label className="text-sm text-gray-500">Address</label>
                      <p className="font-medium">{selectedRequest.clientAddress}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm text-gray-500">Assigned Photographer</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-medium">{selectedRequest.photographer?.user.name || 'Not assigned'}</p>
                      <button
                        onClick={() => setAssigningPhotographer(!assigningPhotographer)}
                        disabled={!invitationsSentForSelected && !selectedRequest.photographer}
                        className={`text-sm font-medium ${
                          !invitationsSentForSelected && !selectedRequest.photographer
                            ? 'text-muted-foreground cursor-not-allowed'
                            : 'text-primary hover:opacity-80'
                        }`}
                        title={!invitationsSentForSelected && !selectedRequest.photographer ? 'Please send invitations to photographers first' : ''}
                      >
                        {assigningPhotographer ? 'Cancel' : selectedRequest.photographer ? 'Change' : 'Assign'}
                      </button>
                    </div>
                    {!invitationsSentForSelected && !selectedRequest.photographer && (
                      <p className="text-xs text-orange-500 mt-1">
                        💡 Send invitations to photographers first to assign them
                      </p>
                    )}
                    {assigningPhotographer && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <label className="text-sm text-gray-600 mb-2 block">
                          {selectedRequest.jobType === 'DOCUMENTARY' || selectedRequest.jobType === 'VIDEOGRAPHY' 
                            ? 'Select Photographer/Videographer' 
                            : 'Select Photographer'}
                        </label>
                        <select
                          value={selectedRequest.photographerId || ''}
                          onChange={(e) => assignPhotographer(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Select --</option>
                          {photographers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.user?.name || p.user?.email || 'Unknown'} {p.specialty ? `(${p.specialty})` : ''} {p.location ? `- ${p.location}` : ''}
                            </option>
                          ))}
                        </select>
                        {photographers.length === 0 && (
                          <p className="text-xs text-red-500 mt-2">No APPROVED photographers found. Approve photographers first.</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          ★ = Expert match (specialty matches job type) | 📍 = Nearby (matching location) | Photographers sorted by best match first.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Prompt Photographers Section */}
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm text-purple-600 font-medium">Prompt Photographers</label>
                        <p className="text-xs text-purple-500 mt-1">
                          Send job invitations to multiple photographers based on criteria
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setPromptingPhotographers(!promptingPhotographers);
                          setSelectedPhotographers([]);
                          setPromptMessage('');
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        {promptingPhotographers ? 'Cancel' : 'Send Invitations'}
                      </button>
                    </div>
                    
                    {promptingPhotographers && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
                        <div className="mb-3">
                          <label className="text-sm text-gray-600 mb-2 block">
                            Select photographers to invite ({selectedPhotographers.length} selected)
                          </label>
                          <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                            {photographers.map((p) => (
                              <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedPhotographers.includes(p.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPhotographers([...selectedPhotographers, p.id]);
                                    } else {
                                      setSelectedPhotographers(selectedPhotographers.filter(id => id !== p.id));
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">
                                  {p.user?.name || p.user?.email || 'Unknown'}
                                  {p.specialty && <span className="text-gray-500"> ({p.specialty})</span>}
                                  {p.location && <span className="text-gray-400"> - {p.location}</span>}
                                  {p.rating > 0 && <span className="text-yellow-500 ml-2">★ {p.rating.toFixed(1)}</span>}
                                </span>
                              </label>
                            ))}

                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="text-sm text-gray-600 mb-2 block">Message (optional)</label>
                          <textarea
                            value={promptMessage}
                            onChange={(e) => setPromptMessage(e.target.value)}
                            placeholder="Explain why you're inviting these photographers..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                            rows={2}
                          />
                        </div>
                        
                        <button
                          onClick={sendInvitations}
                          disabled={selectedPhotographers.length === 0 || sendingInvites}
                          className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendingInvites ? 'Sending...' : `Send Invitations to ${selectedPhotographers.length} Photographers`}
                        </button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Selected photographers will receive email/SMS notifications and see this job in their dashboard
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Admin Notes</label>
                    <p className="font-medium">{selectedRequest.adminNotes || 'No notes'}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-sm text-gray-500 mb-2 block">Update Status</label>
                    <div className="flex flex-wrap gap-2">
                      {['PENDING', 'REVIEWING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(selectedRequest.id, status)}
                          className={`px-3 py-1 rounded text-sm ${selectedRequest.status === status ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
