'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Rocket, Clapperboard } from 'lucide-react';

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

export default function DroneServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showQuote, setShowQuote] = useState(false);

  // Database-driven options
  const [droneTypes, setDroneTypes] = useState<ServiceOption[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceOption[]>([]);
  const [locations, setLocations] = useState<ServiceOption[]>([]);
  const [durations, setDurations] = useState<ServiceOption[]>([]);
  const [addOns, setAddOns] = useState<ServiceOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Fetch service options from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // First get the drone service
        const serviceRes = await fetch('/api/bpm-services');
        const services = await serviceRes.json();
        const droneService = services.find((s: any) => s.slug === 'drone');
        
        if (droneService) {
          const optionsRes = await fetch(`/api/admin/service-options?bpmServiceId=${droneService.id}`);
          const options = await optionsRes.json();
          
          setDroneTypes(options.filter((o: ServiceOption) => o.category === 'drone_types' && o.isActive));
          setServiceTypes(options.filter((o: ServiceOption) => o.category === 'service_types' && o.isActive));
          setLocations(options.filter((o: ServiceOption) => o.category === 'locations' && o.isActive));
          setDurations(options.filter((o: ServiceOption) => o.category === 'durations' && o.isActive));
          setAddOns(options.filter((o: ServiceOption) => o.category === 'add_ons' && o.isActive));
        }
      } catch (err) {
        console.error('Failed to fetch service options:', err);
      } finally {
        setOptionsLoading(false);
      }
    };
    
    fetchOptions();
  }, []);

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    companyName: '',
    droneType: 'PRO',
    serviceType: 'AERIAL_PHOTO',
    location: 'NAIROBI',
    eventDate: '',
    duration: 2,
    specificLocation: '',
    projectDescription: '',
    addOns: [] as string[],
    agreeToTerms: false,
  });

  // Calculate quote
  const calculateQuote = () => {
    const service = serviceTypes.find(s => s.value === formData.serviceType);
    const drone = droneTypes.find(d => d.value === formData.droneType);
    const loc = locations.find(l => l.value === formData.location);
    const dur = durations.find(d => d.value === String(formData.duration));

    if (!service || !drone || !loc || !dur) return null;

    // Base prices (these would come from DB in a real implementation)
    const servicePrices: { [key: string]: number } = {
      'AERIAL_PHOTO': 10000,
      'AERIAL_VIDEO': 15000,
      'PROPERTY_INSPECTION': 12000,
      'SURVEY_MAPPING': 20000,
      'EVENT_COVERAGE': 18000,
      'LIVE_STREAM': 22000,
    };
    
    const dronePrices: { [key: string]: number } = {
      'CONSUMER': 15000,
      'PRO': 25000,
      'CINEMA': 45000,
    };

    const addOnPrices: { [key: string]: number } = {
      'PROFESSIONAL_EDITING': 5000,
      'RUSH_DELIVERY': 8000,
      'DRONE_INSURANCE': 3000,
      'SECOND_OPERATOR': 10000,
    };

    const locationMultipliers: { [key: string]: number } = {
      'NAIROBI': 1.0,
      'CENTRAL': 1.2,
      'COAST': 1.5,
      'WESTERN': 1.4,
      'REMOTE': 1.8,
    };

    const durationDiscounts: { [key: string]: number } = {
      '1': 0,
      '2': 0.05,
      '4': 0.10,
      '8': 0.15,
    };

    const baseServicePrice = (servicePrices[formData.serviceType] || 10000) * formData.duration;
    const dronePrice = dronePrices[formData.droneType] || 25000;
    const locMultiplier = locationMultipliers[formData.location] || 1.0;
    const subTotal = (baseServicePrice + dronePrice) * locMultiplier;
    const discount = subTotal * (durationDiscounts[String(formData.duration)] || 0);
    
    // Add-ons
    const addOnsTotal = formData.addOns.reduce((sum, addOn) => {
      return sum + (addOnPrices[addOn] || 0);
    }, 0);

    return {
      service: service?.label || 'Unknown',
      drone: drone?.label || 'Unknown',
      location: loc?.label || 'Unknown',
      duration: dur?.label || 'Unknown',
      baseServicePrice,
      dronePrice,
      locationMultiplier: locMultiplier,
      subTotal,
      discount,
      addOnsTotal,
      total: subTotal - discount + addOnsTotal,
    };
  };

  const quote = calculateQuote();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'DRONE',
          title: `${formData.serviceType} - ${formData.clientName}`,
          description: formData.projectDescription,
          eventDate: formData.eventDate,
          location: formData.specificLocation,
          metadata: {
            droneType: formData.droneType,
            serviceType: formData.serviceType,
            location: formData.location,
            duration: formData.duration,
            addOns: formData.addOns,
            companyName: formData.companyName,
            estimatedPrice: quote?.total,
          },
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({
          clientName: '',
          clientEmail: '',
          clientPhone: '',
          companyName: '',
          droneType: 'PRO',
          serviceType: 'AERIAL_PHOTO',
          location: 'NAIROBI',
          eventDate: '',
          duration: 2,
          specificLocation: '',
          projectDescription: '',
          addOns: [],
          agreeToTerms: false,
        });
        setShowQuote(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit request');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOnToggle = (addOnValue: string) => {
    setFormData(prev => ({
      ...prev,
      addOns: prev.addOns.includes(addOnValue)
        ? prev.addOns.filter(a => a !== addOnValue)
        : [...prev.addOns, addOnValue],
    }));
  };

  if (optionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Drone & Aerial Services</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional aerial photography and videography with real-time pricing. 
            Get instant quotes and book your drone session today.
          </p>
        </div>

        {success && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-green-800 font-semibold mb-2">Request Submitted Successfully!</h3>
            <p className="text-green-700">
              We'll review your request and get back to you within 24 hours.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-2 text-green-600 underline"
            >
              Submit another request
            </button>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Book Your Drone Session</h2>
              
              {/* Client Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Drone Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drone Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {droneTypes.map((drone) => (
                    <label
                      key={drone.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                        formData.droneType === drone.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="droneType"
                        value={drone.value}
                        checked={formData.droneType === drone.value}
                        onChange={(e) => setFormData({ ...formData, droneType: e.target.value })}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{drone.label}</div>
                        <div className="text-xs text-gray-500">{drone.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Service Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {serviceTypes.map((service) => (
                    <label
                      key={service.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                        formData.serviceType === service.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="serviceType"
                        value={service.value}
                        checked={formData.serviceType === service.value}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{service.label}</div>
                        <div className="text-xs text-gray-500">{service.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {locations.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label} - {loc.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration *
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {durations.map((dur) => (
                      <option key={dur.value} value={dur.value}>
                        {dur.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specific Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specific Location / Venue
                </label>
                <input
                  type="text"
                  value={formData.specificLocation}
                  onChange={(e) => setFormData({ ...formData, specificLocation: e.target.value })}
                  placeholder="Enter specific address or venue name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Add-ons */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add-on Services
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {addOns.map((addOn) => (
                    <label
                      key={addOn.value}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition ${
                        formData.addOns.includes(addOn.value)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.addOns.includes(addOn.value)}
                        onChange={() => handleAddOnToggle(addOn.value)}
                        className="mt-1 mr-2"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{addOn.label}</div>
                        <div className="text-xs text-gray-500">{addOn.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Project Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Description
                </label>
                <textarea
                  value={formData.projectDescription}
                  onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                  rows={4}
                  placeholder="Describe your project requirements..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Terms */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    required
                    checked={formData.agreeToTerms}
                    onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the terms and conditions and privacy policy
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>

          {/* Quote Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Quote Summary</h3>
              
              {quote && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{quote.service}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Drone:</span>
                    <span className="font-medium">{quote.drone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{quote.location}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{quote.duration}</span>
                  </div>
                  <hr className="my-3" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service Price:</span>
                    <span>KSh {quote.baseServicePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Drone Base:</span>
                    <span>KSh {quote.dronePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Location Multiplier:</span>
                    <span>{quote.locationMultiplier}x</span>
                  </div>
                  {quote.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Duration Discount:</span>
                      <span>-KSh {quote.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {quote.addOnsTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Add-ons:</span>
                      <span>KSh {quote.addOnsTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <hr className="my-3" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">KSh {quote.total.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * Final price may vary based on specific requirements
                  </p>
                </div>
              )}

              {!quote && (
                <p className="text-gray-500 text-sm">
                  Fill out the form to see your custom quote
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
