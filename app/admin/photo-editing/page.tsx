'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminPhotoEditingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      fetchRequests();
    }
  }, [status, session, router]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'ALL' 
        ? '/api/photo-editing' 
        : `/api/photo-editing?status=${filterStatus}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchRequests();
    }
  }, [filterStatus, session]);

  const updateStatus = async (id: string, status: string, editedUrl?: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/photo-editing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, editedUrl }),
      });

      if (res.ok) {
        fetchRequests();
        setSelectedRequest(null);
      } else {
        alert('Failed to update request');
      }
    } catch (err) {
      console.error('Failed to update request:', err);
      alert('Failed to update request');
    }
    setUpdating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'REVIEWING': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'REVISION_REQUESTED': return 'bg-orange-100 text-orange-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusOptions = [
    'PENDING',
    'IN_PROGRESS',
    'REVIEWING',
    'COMPLETED',
    'DELIVERED',
    'REVISION_REQUESTED',
    'CANCELLED',
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Photo Editing Requests</h1>
            <p className="mt-1 text-gray-600">Manage photo editing service requests from customers</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Requests</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No photo editing requests found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.user?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.title}</div>
                      {request.originalUrl && (
                        <a
                          href={request.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View Original
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.editingType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      KSh {parseFloat(request.totalPrice.toString()).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for managing request */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Manage Request</h2>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Customer</label>
                      <p className="text-gray-900">{selectedRequest.user?.name}</p>
                      <p className="text-sm text-gray-500">{selectedRequest.user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date Submitted</label>
                      <p className="text-gray-900">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <p className="text-gray-900">{selectedRequest.title}</p>
                  </div>

                  {selectedRequest.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-600">{selectedRequest.description}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Original Photo</label>
                    {selectedRequest.originalUrl && (
                      <a
                        href={selectedRequest.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Original Photo →
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Editing Type</label>
                      <p className="text-gray-900">{selectedRequest.editingType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Services</label>
                      <p className="text-gray-600">{selectedRequest.serviceType || 'Basic'}</p>
                    </div>
                  </div>

                  {selectedRequest.instructions && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
                      <p className="text-gray-600">{selectedRequest.instructions}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <p className="text-xl font-bold text-blue-600">
                      KSh {parseFloat(selectedRequest.totalPrice.toString()).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(selectedRequest.id, status)}
                          disabled={updating || selectedRequest.status === status}
                          className={`px-3 py-2 rounded text-sm font-medium transition ${
                            selectedRequest.status === status
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : getStatusColor(status) + ' hover:opacity-80'
                          }`}
                        >
                          {status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Edited Photo (for COMPLETED status)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        id="editedUrl"
                        placeholder="https://example.com/edited-photo.jpg"
                        className="flex-1 border border-gray-300 rounded px-3 py-2"
                      />
                      <button
                        onClick={() => {
                          const url = (document.getElementById('editedUrl') as HTMLInputElement).value;
                          if (url) {
                            updateStatus(selectedRequest.id, 'COMPLETED', url);
                          }
                        }}
                        disabled={updating}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Mark Complete
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                    <textarea
                      id="adminNotes"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows={3}
                      placeholder="Add notes about this request..."
                      defaultValue={selectedRequest.adminNotes || ''}
                    />
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
