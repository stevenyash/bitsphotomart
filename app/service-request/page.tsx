'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, Video, Plane, Film, Users, Clock, Check, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';

function ServiceRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceType = searchParams.get('type') || '';

  const [contactInfo, setContactInfo] = useState<{email: string; phone: string; address: string} | null>(null);

  useEffect(() => {
    fetch('/api/pricing/contact')
      .then(res => res.json())
      .then(data => {
        if (data.platform_email) {
          setContactInfo({
            email: data.platform_email,
            phone: data.platform_phone,
            address: data.platform_address,
          });
        }
      })
      .catch((err) => console.error('Error fetching contact:', err));
  }, []);

  const [formData, setFormData] = useState({
    serviceType: serviceType,
    fullName: '',
    email: '',
    phone: '',
    company: '',
    eventDate: '',
    eventLocation: '',
    eventType: '',
    description: '',
    budget: '',
    attendees: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const serviceTypes = [
    { value: 'photography', label: 'Photography', icon: Camera },
    { value: 'videography', label: 'Videography', icon: Video },
    { value: 'drone', label: 'Drone Services', icon: Plane },
    { value: 'documentary', label: 'Documentary', icon: Film },
    { value: 'event', label: 'Event Team', icon: Users },
  ];

  const eventTypes = [
    'Wedding',
    'Corporate Event',
    'Conference',
    'Workshop',
    'Product Launch',
    'Brand Activation',
    'Sports Event',
    'Concert/Festival',
    'Portrait/Headshots',
    'Real Estate',
    'Other',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit request');
      setSuccess(true);
    } catch (err) {
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Request Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for your request. Our team will contact you within 24 hours with a quote.
          </p>
          <Link href="/" className="text-primary hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <Link href="/services" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Request a Quote</h1>
            <p className="text-muted-foreground mb-8">
              Fill in your details and we&apos;ll get back to you with a customized quote.
            </p>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Service Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {serviceTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, serviceType: type.value })}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          formData.serviceType === type.value
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${formData.serviceType === type.value ? 'text-amber-600' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${formData.serviceType === type.value ? 'text-amber-600' : 'text-foreground'}`}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-foreground focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-foreground focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-foreground focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="+254 700 000 000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-foreground focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Your Company Ltd"
                  />
                </div>
              </div>

              {/* Event Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-foreground focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Event Type *
                  </label>
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-foreground focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Select event type</option>
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="eventLocation"
                    value={formData.eventLocation}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-foreground focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Nairobi, Kenya"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Expected Attendees
                  </label>
                  <input
                    type="text"
                    name="attendees"
                    value={formData.attendees}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-foreground focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="50-100"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Project Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-foreground focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Tell us about your project, specific requirements, deliverables expected..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Budget Range (KES)
                </label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-foreground focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g., 50,000 - 100,000"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="mt-8 text-center text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              {contactInfo?.email || 'Loading...'}
            </p>
            <p className="flex items-center justify-center gap-2 mt-2">
              <Phone className="w-4 h-4" />
              {contactInfo?.phone || 'Loading...'}
            </p>
            <p className="flex items-center justify-center gap-2 mt-2">
              <MapPin className="w-4 h-4" />
              {contactInfo?.address || 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceRequestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ServiceRequestForm />
    </Suspense>
  );
}
