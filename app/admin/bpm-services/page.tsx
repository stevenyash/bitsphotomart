'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BpmService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  link: string | null;
  cta: string | null;
  isActive: boolean;
  displayOrder: number;
}

interface ServiceOption {
  id: string;
  value: string;
  label: string;
  description: string | null;
  price: number | null;
  category: string;
  displayOrder: number;
  isActive: boolean;
  bpmServiceId: string | null;
}

const CATEGORIES = [
  { value: 'job_types', label: 'Job Types' },
  { value: 'animation_styles', label: 'Animation Styles' },
  { value: 'delivery_formats', label: 'Delivery Formats' },
  { value: 'durations', label: 'Durations' },
  { value: 'coverage_types', label: 'Coverage Types' },
  { value: 'coverage_durations', label: 'Coverage Durations' },
  { value: 'photo_editing_levels', label: 'Photo Editing Levels' },
  { value: 'add_ons', label: 'Add-ons' },
];

export default function AdminBpmServicesPage() {
  const [services, setServices] = useState<BpmService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<BpmService | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'options'>('services');
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  
  // Service modal state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '',
    link: '',
    cta: '',
    isActive: true,
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  // Option modal state
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [editingOption, setEditingOption] = useState<ServiceOption | null>(null);
  const [optionFormData, setOptionFormData] = useState({
    value: '',
    label: '',
    description: '',
    price: 0,
    category: 'job_types',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      fetchServiceOptions(selectedService.id);
    }
  }, [selectedService]);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/bpm-services');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceOptions = async (serviceId: string) => {
    try {
      const res = await fetch(`/api/admin/service-options?bpmServiceId=${serviceId}`);
      if (res.ok) {
        const data = await res.json();
        setServiceOptions(data);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  // Service handlers
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = selectedService 
        ? `/api/admin/bpm-services/${selectedService.id}` 
        : '/api/admin/bpm-services';
      const method = selectedService ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowServiceModal(false);
        setSelectedService(null);
        setFormData({
          name: '',
          slug: '',
          description: '',
          icon: '',
          color: '',
          link: '',
          cta: '',
          isActive: true,
          displayOrder: 0,
        });
        fetchServices();
      }
    } catch (error) {
      console.error('Error saving service:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const res = await fetch(`/api/admin/bpm-services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedService(null);
        fetchServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleToggleServiceActive = async (service: BpmService) => {
    try {
      const res = await fetch(`/api/admin/bpm-services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      if (res.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error('Error toggling service:', error);
    }
  };

  const openEditService = (service: BpmService) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      slug: service.slug,
      description: service.description || '',
      icon: service.icon || '',
      color: service.color || '',
      link: service.link || '',
      cta: service.cta || '',
      isActive: service.isActive,
      displayOrder: service.displayOrder,
    });
    setShowServiceModal(true);
  };

  const openNewService = () => {
    setSelectedService(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      color: '',
      link: '',
      cta: '',
      isActive: true,
      displayOrder: services.length,
    });
    setShowServiceModal(true);
  };

  const selectService = (service: BpmService) => {
    setSelectedService(service);
    setActiveTab('options');
  };

  // Option handlers
  const handleOptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...optionFormData,
        bpmServiceId: selectedService?.id,
      };

      const url = editingOption
        ? `/api/admin/service-options/${editingOption.id}`
        : '/api/admin/service-options';
      const method = editingOption ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowOptionModal(false);
        setEditingOption(null);
        setOptionFormData({
          value: '',
          label: '',
          description: '',
          price: 0,
          category: 'job_types',
          displayOrder: 0,
          isActive: true,
        });
        if (selectedService) {
          fetchServiceOptions(selectedService.id);
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save option');
      }
    } catch (error) {
      console.error('Error saving option:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditOption = (option: ServiceOption) => {
    setEditingOption(option);
    setOptionFormData({
      value: option.value,
      label: option.label,
      description: option.description || '',
      category: option.category,
      displayOrder: option.displayOrder,
      isActive: option.isActive,
    });
    setShowOptionModal(true);
  };

  const handleDeleteOption = async (id: string) => {
    if (!confirm('Are you sure you want to delete this option?')) return;

    try {
      const res = await fetch(`/api/admin/service-options/${id}`, {
        method: 'DELETE',
      });

      if (res.ok && selectedService) {
        fetchServiceOptions(selectedService.id);
      }
    } catch (error) {
      console.error('Error deleting option:', error);
    }
  };

  const openNewOption = () => {
    setEditingOption(null);
    setOptionFormData({
      value: '',
      label: '',
      description: '',
      category: 'job_types',
      displayOrder: 0,
      isActive: true,
    });
    setShowOptionModal(true);
  };

  // Group options by category
  const groupedOptions = serviceOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, ServiceOption[]>);

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">BPM Services</h1>
              <p className="text-red-100 text-lg">
                Manage BPM services and their options
              </p>
            </div>
            <Link
              href="/admin"
              className="bg-white text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-50"
            >
              Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-t-xl shadow-md border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-6 py-4 font-medium text-lg ${
                activeTab === 'services'
                  ? 'text-red-700 border-b-2 border-red-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Services
            </button>
            <button
              onClick={() => setActiveTab('options')}
              disabled={!selectedService}
              className={`px-6 py-4 font-medium text-lg ${
                activeTab === 'options'
                  ? 'text-red-700 border-b-2 border-red-700'
                  : !selectedService
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {selectedService ? `${selectedService.name} Options` : 'Select a Service'}
            </button>
          </div>
        </div>

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="bg-white rounded-b-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">BPM Services List</h2>
              <button
                onClick={openNewService}
                className="bg-red-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-800"
              >
                Add New Service
              </button>
            </div>

            {services.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No services found. Add your first service!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => selectService(service)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-500">{service.slug}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditService(service);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleServiceActive(service);
                          }}
                          className={`text-sm ${service.isActive ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          {service.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{service.description}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectService(service);
                        }}
                        className="text-sm bg-violet-100 text-violet-700 px-3 py-1 rounded hover:bg-violet-200"
                      >
                        Manage Options
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteService(service.id);
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Options Tab */}
        {activeTab === 'options' && selectedService && (
          <div className="bg-white rounded-b-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedService.name} - Options</h2>
                <p className="text-sm text-gray-500">Manage service options for this BPM service</p>
              </div>
              <button
                onClick={openNewOption}
                className="bg-red-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-800"
              >
                Add New Option
              </button>
            </div>

            {serviceOptions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No options found for this service.</p>
                <button
                  onClick={openNewOption}
                  className="text-red-700 font-medium hover:underline"
                >
                  Add your first option
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedOptions).map(([category, categoryOptions]) => (
                  <div key={category} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="font-bold text-gray-900">{getCategoryLabel(category)}</h3>
                      <p className="text-xs text-gray-500">{categoryOptions.length} option(s)</p>
                    </div>
                    <div className="divide-y">
                      {categoryOptions.map((option) => (
                        <div key={option.id} className="px-4 py-3 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.label}</span>
                              <span className="text-xs text-gray-500">({option.value})</span>
                              {!option.isActive && (
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                            {option.description && (
                              <p className="text-sm text-gray-500">{option.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditOption(option)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteOption(option.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedService ? 'Edit Service' : 'Add New Service'}
              </h2>
            </div>
            <form onSubmit={handleServiceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="camera"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="#FF0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="/services/photography"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CTA Text</label>
                <input
                  type="text"
                  value={formData.cta}
                  onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Get Started"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="serviceIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="serviceIsActive" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowServiceModal(false);
                    setSelectedService(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : selectedService ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Option Modal */}
      {showOptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingOption ? 'Edit Option' : 'Add New Option'}
              </h2>
            </div>
            <form onSubmit={handleOptionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={optionFormData.category}
                  onChange={(e) => setOptionFormData({ ...optionFormData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Value (internal) *</label>
                <input
                  type="text"
                  value={optionFormData.value}
                  onChange={(e) => setOptionFormData({ ...optionFormData, value: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., photography"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Label (display) *</label>
                <input
                  type="text"
                  value={optionFormData.label}
                  onChange={(e) => setOptionFormData({ ...optionFormData, label: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., Photography"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={optionFormData.description}
                  onChange={(e) => setOptionFormData({ ...optionFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (KES)</label>
                <input
                  type="number"
                  value={optionFormData.price}
                  onChange={(e) => setOptionFormData({ ...optionFormData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  min="0"
                  step="0.01"
                  placeholder="Price in KES (e.g., 1500)"
                />
                <p className="text-xs text-gray-500 mt-1">Leave as 0 for no additional charge</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                <input
                  type="number"
                  value={optionFormData.displayOrder}
                  onChange={(e) => setOptionFormData({ ...optionFormData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="optionIsActive"
                  checked={optionFormData.isActive}
                  onChange={(e) => setOptionFormData({ ...optionFormData, isActive: e.target.checked })}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="optionIsActive" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionModal(false);
                    setEditingOption(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingOption ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
