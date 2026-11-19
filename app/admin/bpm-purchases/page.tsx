'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from "@/lib/admin-theme";

interface BpmPurchaseOffer {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  userId: string;
  user: {
    name: string | null;
    email: string;
  };
  askingPrice: string;
  offeredPrice: string | null;
  status: string;
  expiresAt: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBpmPurchasesPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<BpmPurchaseOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedOffer, setSelectedOffer] = useState<BpmPurchaseOffer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [offeredPrice, setOfferedPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, [filter]);

  const fetchOffers = async () => {
    try {
      const res = await fetch(`/api/admin/bpm-purchase?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setOffers(data);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/bpm-purchase/${selectedOffer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'OFFER',
          offeredPrice: parseFloat(offeredPrice),
          adminNotes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setSelectedOffer(null);
        setOfferedPrice('');
        setAdminNotes('');
        fetchOffers();
      }
    } catch (error) {
      console.error('Error making offer:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (offerId: string) => {
    if (!confirm('Are you sure you want to accept this offer and purchase the photo?')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/bpm-purchase/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT' }),
      });

      if (res.ok) {
        fetchOffers();
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (offerId: string) => {
    if (!confirm('Are you sure you want to reject this photo?')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/bpm-purchase/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT' }),
      });

      if (res.ok) {
        fetchOffers();
      }
    } catch (error) {
      console.error('Error rejecting offer:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatPrice = (price: string) => {
    return `KES ${parseFloat(price).toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'OFFERED': return 'bg-purple-100 text-purple-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800';
      case 'PURCHASED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.secondary} py-8 px-4`}>
      <div className="container mx-auto">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${theme.heading}`}>BPM Photo Purchases</h1>
          <p className={theme.mutedText}>Manage photo submissions for BPM to consider and purchase</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {['ALL', 'PENDING', 'UNDER_REVIEW', 'OFFERED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'PURCHASED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card text-foreground hover:bg-muted border border-border'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">
              {offers.filter(o => o.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Under Review</p>
            <p className="text-2xl font-bold text-primary">
              {offers.filter(o => o.status === 'UNDER_REVIEW').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Offered</p>
            <p className="text-2xl font-bold text-purple-600">
              {offers.filter(o => o.status === 'OFFERED').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Purchased</p>
            <p className="text-2xl font-bold text-green-600">
              {offers.filter(o => o.status === 'PURCHASED').length}
            </p>
          </div>
        </div>

        {/* Offers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photographer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asking Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No photo submissions found
                  </td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img 
                            src={offer.thumbnailUrl || offer.imageUrl} 
                            alt={offer.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <p className={`font-medium ${theme.heading}`}>{offer.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{offer.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className={theme.heading}>{offer.user.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{offer.user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`font-medium ${theme.heading}`}>{formatPrice(offer.askingPrice)}</p>
                      {offer.offeredPrice && (
                        <p className="text-sm text-green-600">Offered: {formatPrice(offer.offeredPrice)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                        {offer.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{formatDate(offer.expiresAt)}</p>
                      <p className={`text-xs ${getDaysRemaining(offer.expiresAt) <= 2 ? 'text-red-600' : 'text-gray-400'}`}>
                        {getDaysRemaining(offer.expiresAt)} days left
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {offer.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedOffer(offer);
                                setShowModal(true);
                              }}
                              className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:opacity-90"
                            >
                              Make Offer
                            </button>
                            <button
                              onClick={() => handleReject(offer.id)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {offer.status === 'OFFERED' && (
                          <>
                            <button
                              onClick={() => handleAccept(offer.id)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(offer.id)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {offer.status === 'ACCEPTED' && (
                          <span className="text-sm text-green-600 font-medium">Awaiting Purchase</span>
                        )}
                        {offer.status === 'REJECTED' && (
                          <span className="text-sm text-gray-500">No action</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Make Offer Modal */}
      {showModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className={`text-lg font-bold ${theme.heading} mb-4`}>Make an Offer</h3>
              
              <div className="flex gap-4 mb-6">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={selectedOffer.thumbnailUrl || selectedOffer.imageUrl} 
                    alt={selectedOffer.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className={`font-medium ${theme.heading}`}>{selectedOffer.title}</p>
                  <p className="text-sm text-gray-500">Asking: {formatPrice(selectedOffer.askingPrice)}</p>
                  <p className="text-sm text-gray-500">By: {selectedOffer.user.name || selectedOffer.user.email}</p>
                </div>
              </div>

              <form onSubmit={handleOffer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Offer (KES)
                  </label>
                  <input
                    type="number"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                    placeholder="Enter your offer amount"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes about your offer..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {actionLoading ? 'Sending...' : 'Send Offer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
