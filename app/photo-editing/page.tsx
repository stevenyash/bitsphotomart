/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PaymentModal } from '@/components/payment/payment-modal';

interface ServiceOption {
  id: string;
  value: string;
  label: string;
  description: string | null;
  category: string;
  displayOrder: number;
  isActive: boolean;
  price: number | null;
}

export default function PhotoEditingPage() {
  const { status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    originalUrl: '',
    editingType: 'BASIC',
    serviceType: [] as string[],
    instructions: '',
    basePrice: 0,
  });
  
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Payment modal state
  const [showPayment, setShowPayment] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  
  // Options fetched from database
  const [editingTypes, setEditingTypes] = useState<ServiceOption[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);

  // Fetch user's photo editing requests
  const fetchMyRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/photo-editing');
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data);
      }
    } catch (err) {
      console.error('Failed to fetch my requests:', err);
    }
    setLoading(false);
  }, []);

  const fetchServiceOptions = useCallback(async () => {
    try {
      // Use public API endpoint that doesn't require authentication
      const optionsRes = await fetch('/api/service-options?slug=photo-editing');
      if (optionsRes.ok) {
        const grouped = await optionsRes.json();
        const types = grouped['photo_editing_levels'] || [];
        const addons = grouped['add_ons'] || [];
        setEditingTypes(types);
        setServiceOptions(addons);
        
        // Set initial base price from the first editing type
        if (types.length > 0) {
          const firstType = types[0];
          setFormData(prev => ({
            ...prev,
            editingType: firstType.value,
            basePrice: firstType.price || 0,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch service options:', err);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchMyRequests();
      fetchServiceOptions();
    }
  }, [status, router, fetchMyRequests, fetchServiceOptions]);
 
  const handleServiceToggle = (serviceValue: string) => {
    setFormData(prev => {
      const newServices = prev.serviceType.includes(serviceValue)
        ? prev.serviceType.filter(id => id !== serviceValue)
        : [...prev.serviceType, serviceValue];
      
      // Calculate new base price from database prices
      const selectedServices = serviceOptions.filter(s => newServices.includes(s.value));
      const addOnPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
      const editingType = editingTypes.find(e => e.value === prev.editingType);
      const basePrice = (editingType?.price || 0) + addOnPrice;
      
      return {
        ...prev,
        serviceType: newServices,
        basePrice,
      };
    });
  };

  const handleEditingTypeChange = (newType: string) => {
    // Get price from database option
    const selectedType = editingTypes.find(e => e.value === newType);
    const typePrice = selectedType?.price || 0;
    
    // Calculate add-ons price
    const selectedServices = serviceOptions.filter(s => formData.serviceType.includes(s.value));
    const addOnPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
    
    setFormData(prev => ({
      ...prev,
      editingType: newType,
      basePrice: typePrice + addOnPrice,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before showing payment
    if (!formData.title || !formData.originalUrl || !formData.editingType) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Store form data and show payment modal
    setPendingFormData({ ...formData });
    setShowPayment(true);
    setError('');
  };
  
  // Submit the photo editing request after successful payment
  const submitAfterPayment = async (paymentId: string) => {
    setSubmitting(true);
    setError('');
    
    try {
      const res = await fetch('/api/photo-editing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pendingFormData,
          serviceType: pendingFormData.serviceType.join(','),
          paymentId,
        }),
      });

      if (res.ok) {
        setSuccess('Photo editing request submitted successfully!');
        setFormData({
          title: '',
          description: '',
          originalUrl: '',
          editingType: 'BASIC',
          serviceType: [],
          instructions: '',
          basePrice: 0,
        });
        setPendingFormData(null);
        setShowPayment(false);
        fetchMyRequests();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit request');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
    setSubmitting(false);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Photo Editing Service</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Submit your photos for professional editing by our expert team. 
            Choose from a variety of editing services to enhance your images.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Request Form */}
          <div className="bg-card rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Submit Photo for Editing</h2>
            
            {success && (
              <div className="bg-green-100 text-green-800 border border-green-200 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}
            
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Wedding Photo Editing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Photo URL
                </label>
                <input
                  type="text"
                  value={formData.originalUrl}
                  onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://example.com/photo.jpg or uploaded file URL"
                />
                <p className="text-xs text-muted-foreground mt-1">Or upload a file below</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Upload Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Upload to server
                      const formDataUpload = new FormData();
                      formDataUpload.append('file', file);
                      
                      try {
                        const res = await fetch('/api/upload', {
                          method: 'POST',
                          body: formDataUpload,
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setFormData({ ...formData, originalUrl: data.url });
                        }
                      } catch (err) {
                        console.error('Upload failed:', err);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  placeholder="Describe what you need done..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Editing Type *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {editingTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                        formData.editingType === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="editingType"
                        value={type.value}
                        checked={formData.editingType === type.value}
                        onChange={(e) => handleEditingTypeChange(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                      {type.price && (
                        <div className="text-sm font-semibold text-primary">
                          KSh {type.price.toLocaleString()}
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Additional Services
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {serviceOptions.map((service) => (
                    <label
                      key={service.value}
                      className={`flex items-start p-2 border rounded-lg cursor-pointer transition ${
                        formData.serviceType.includes(service.value)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.serviceType.includes(service.value)}
                        onChange={() => handleServiceToggle(service.value)}
                        className="mt-1 mr-2"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{service.label}</div>
                        <div className="text-xs text-muted-foreground">{service.description}</div>
                        {service.price && (
                          <div className="text-xs font-semibold text-primary mt-1">
                            +KSh {service.price.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Special Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  placeholder="Any special instructions for the editor..."
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">Total Price:</span>
                  <span className="text-2xl font-bold text-primary">
                    KSh {formData.basePrice.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit for Editing'}
              </button>
            </form>
          </div>

          {/* My Requests */}
          <div className="bg-card rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">My Editing Requests</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No editing requests yet.</p>
                <p className="text-sm">Submit your first photo for editing!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-border rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-foreground">{request.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'REVIEWING' ? 'bg-purple-100 text-purple-800' :
                        request.status === 'COMPLETED' || request.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        request.status === 'REVISION_REQUESTED' ? 'bg-orange-100 text-orange-800' :
                        request.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Type: {request.editingType} | Services: {request.serviceType || 'Basic'}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary">
                        KSh {parseFloat(request.totalPrice.toString()).toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {request.editedUrl && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <a
                          href={request.editedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View Edited Photo →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => {
          setShowPayment(false);
          setPendingFormData(null);
        }}
        amount={pendingFormData?.basePrice || 0}
        description={`Photo Editing Service - ${pendingFormData?.editingType || 'Basic'}`}
        serviceType="photo-editing"
        metadata={{
          editingType: pendingFormData?.editingType,
          serviceType: pendingFormData?.serviceType,
        }}
        onSuccess={(paymentId) => {
          submitAfterPayment(paymentId);
        }}
      />
    </div>
  );
}
