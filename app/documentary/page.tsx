/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ServiceOption {
  id: string;
  value: string;
  label: string;
  description: string | null;
  category: string;
  displayOrder: number;
  isActive: boolean;
}


export default function DocumentaryRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showAnimationDetails, setShowAnimationDetails] = useState(false);
  const [showCoverageDetails, setShowCoverageDetails] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);

  // Database-driven options
  const [animationStyles, setAnimationStyles] = useState<ServiceOption[]>([]);
  const [deliveryFormats, setDeliveryFormats] = useState<ServiceOption[]>([]);
  const [durations, setDurations] = useState<ServiceOption[]>([]);
  const [coverageTypes, setCoverageTypes] = useState<ServiceOption[]>([]);
  const [coverageDurations, setCoverageDurations] = useState<ServiceOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Fetch service options from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // First get the documentary service
        const serviceRes = await fetch('/api/bpm-services');
        const services = await serviceRes.json();
        const documentaryService = services.find((s: any) => s.slug === 'documentary');
        
        if (documentaryService) {
          const optionsRes = await fetch(`/api/admin/service-options?bpmServiceId=${documentaryService.id}`);
          const options = await optionsRes.json();
          
          setAnimationStyles(options.filter((o: ServiceOption) => o.category === 'animation_styles' && o.isActive));
          setDeliveryFormats(options.filter((o: ServiceOption) => o.category === 'delivery_formats' && o.isActive));
          setDurations(options.filter((o: ServiceOption) => o.category === 'durations' && o.isActive));
          setCoverageTypes(options.filter((o: ServiceOption) => o.category === 'coverage_types' && o.isActive));
          setCoverageDurations(options.filter((o: ServiceOption) => o.category === 'coverage_durations' && o.isActive));
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
    clientAddress: '',
    jobType: 'DOCUMENTARY',
    description: '',
    location: '',
    eventDate: '',
    budget: '',
    // Documentary specific fields
    storyDetails: '',
    animationStyle: 'NONE',
    artworkRequired: false,
    artworkDetails: '',
    clientMediaUrl: '',
    duration: '',
    voiceover: false,
    musicTrack: false,
    subtitles: false,
    deliveryFormat: 'MP4',
    // New fields for videographer coverage
    videographerCoverage: false,
    coverageType: '',
    coverageLocation: '',
    coverageDate: '',
    coverageDuration: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name === 'artworkRequired') {
      setShowAnimationDetails(checked);
    }
    
    if (name === 'videographerCoverage') {
      setShowCoverageDetails(checked);
    }
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
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
      setTimeout(() => router.push('/'), 3000);
    } catch (err) {
      setError('Failed to submit documentary request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setUploadedFile({ name: file.name, url: data.url });
      setFormData(prev => ({ ...prev, clientMediaUrl: data.url }));
    } catch (err) {
      setError('Failed to upload file. Please try again or use a URL instead.');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Documentary Request Submitted!</h2>
          <p className="text-muted-foreground mb-4">Thank you for your documentary request. Our production team will review your story details and contact you within 24-48 hours.</p>
          <p className="text-sm text-muted-foreground">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Documentary Production</h1>
          <p className="text-lg text-muted-foreground">Tell us your story. We&apos;ll bring it to life with professional animation and production.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow-lg p-8 space-y-8">
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                <input
                  type="text"
                  name="clientName"
                  required
                  value={formData.clientName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email Address *</label>
                <input
                  type="email"
                  name="clientEmail"
                  required
                  value={formData.clientEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="clientPhone"
                  required
                  value={formData.clientPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+254..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                <input
                  type="text"
                  name="clientAddress"
                  value={formData.clientAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your address"
                />
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Project Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Describe Your Story/Project *</label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Tell us about your documentary story, subject matter, target audience, and desired outcome..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Story Development Details</label>
                <textarea
                  name="storyDetails"
                  rows={3}
                  value={formData.storyDetails}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Key themes, narrative structure, characters, locations, and any specific story arcs..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Production Location *</label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Where will filming take place?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Preferred Start Date</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Budget Range (KES)</label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., 50,000 - 100,000"
                />
              </div>
            </div>
          </div>

          {/* Documentary Specifications */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Documentary Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Documentary Duration</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select duration</option>
                  {durations.map(d => (
                    <option key={d.value} value={d.value}>{d.label} - {d.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Delivery Format</label>
                <select
                  name="deliveryFormat"
                  value={formData.deliveryFormat}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {deliveryFormats.map(f => (
                    <option key={f.value} value={f.value}>{f.label} - {f.description}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Animation & Artwork */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Animation & Artwork (Mr Smart Style)
            </h2>
            
            <div className="bg-accent rounded-lg p-4 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="artworkRequired"
                  checked={formData.artworkRequired}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
                <span className="font-medium text-foreground">Add Animation & Artwork</span>
                <span className="text-sm text-muted-foreground">(Mr Smart Style animated storytelling)</span>
              </label>
            </div>

            {showAnimationDetails && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Animation Style</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {animationStyles.map(style => (
                      <label
                        key={style.value}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.animationStyle === style.value 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="animationStyle"
                          value={style.value}
                          checked={formData.animationStyle === style.value}
                          onChange={handleChange}
                          className="mt-1 text-primary focus:ring-primary"
                        />
                        <div>
                          <span className="font-medium text-foreground">{style.label}</span>
                          <p className="text-sm text-muted-foreground">{style.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Artwork Requirements</label>
                  <textarea
                    name="artworkDetails"
                    rows={3}
                    value={formData.artworkDetails}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Describe any specific artwork, illustrations, graphics, or visual elements you want included..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Production Elements */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              Production Elements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted">
                <input
                  type="checkbox"
                  name="voiceover"
                  checked={formData.voiceover}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
                <div>
                  <span className="font-medium text-foreground">Voiceover</span>
                  <p className="text-sm text-muted-foreground">Professional narration</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted">
                <input
                  type="checkbox"
                  name="musicTrack"
                  checked={formData.musicTrack}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
                <div>
                  <span className="font-medium text-foreground">Background Music</span>
                  <p className="text-sm text-muted-foreground">Licensed music tracks</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted">
                <input
                  type="checkbox"
                  name="subtitles"
                  checked={formData.subtitles}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
                <div>
                  <span className="font-medium text-foreground">Subtitles</span>
                  <p className="text-sm text-muted-foreground">Multi-language support</p>
                </div>
              </label>
            </div>
          </div>

          {/* Client Media */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Client Media (Optional)
            </h2>
            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1">Upload Your Videos/Photos</label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="client-media-upload"
                />
                <label htmlFor="client-media-upload" className="cursor-pointer">
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-muted-foreground">Uploading...</span>
                    </div>
                  ) : uploadedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-600 font-medium">{uploadedFile.name}</span>
                    </div>
                  ) : (
                    <div>
                      <svg className="mx-auto h-12 w-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium text-primary">Click to upload</span> or drag and drop
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">MP4, MOV, AVI, MKV, PNG, JPG (max 100MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Or Link to Existing Photos/Video Clips</label>
              <input
                type="url"
                name="clientMediaUrl"
                value={formData.clientMediaUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Google Drive, Dropbox, or other link to your existing media"
              />
              <p className="mt-1 text-sm text-muted-foreground">Share any existing photos, video clips, or footage you&apos;d like us to incorporate</p>
            </div>
          </div>

          {/* Videographer Coverage */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Videographer Coverage
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Need a professional videographer to capture your event? We&apos;ll engage one of our verified videographers to cover your documentary.</p>
            
            {/* Coverage Toggle */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="videographerCoverage"
                  checked={formData.videographerCoverage}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary border-border rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">Yes, I need a videographer to cover my event</span>
              </label>
            </div>

            {/* Coverage Details */}
            {showCoverageDetails && (
              <div className="bg-accent rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Coverage Type *</label>
                  <select
                    name="coverageType"
                    required={showCoverageDetails}
                    value={formData.coverageType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select coverage type</option>
                    {coverageTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Coverage Location *</label>
                  <input
                    type="text"
                    name="coverageLocation"
                    required={showCoverageDetails}
                    value={formData.coverageLocation}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Where should the videographer meet you?"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Coverage Date *</label>
                    <input
                      type="date"
                      name="coverageDate"
                      required={showCoverageDetails}
                      value={formData.coverageDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Coverage Duration *</label>
                    <select
                      name="coverageDuration"
                      required={showCoverageDetails}
                      value={formData.coverageDuration}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select duration</option>
                      {coverageDurations.map((dur) => (
                        <option key={dur.value} value={dur.value}>
                          {dur.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Our team will engage a verified videographer from our network. You&apos;ll receive a call to confirm the coverage details and pricing before the assignment is finalized.
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting Request...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Documentary Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
