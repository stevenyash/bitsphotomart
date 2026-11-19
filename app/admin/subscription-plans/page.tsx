'use client';

import { useState, useEffect } from 'react';
import { theme } from "@/lib/admin-theme";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPrice: string | null;
  annualPrice: string | null;
  features: string | null;
  maxDownloads: number | null;
  maxPhotos: number | null;
  isActive: boolean;
  isPopular: boolean;
  displayOrder: number;
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    monthlyPrice: '',
    annualPrice: '',
    features: '',
    maxDownloads: '',
    maxPhotos: '',
    displayOrder: '0',
    isPopular: false,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/subscription-plans');
      const data = await res.json();
      setPlans(data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/subscription-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      fetchPlans();
      setShowForm(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        monthlyPrice: '',
        annualPrice: '',
        features: '',
        maxDownloads: '',
        maxPhotos: '',
        displayOrder: '0',
        isPopular: false,
      });
    } catch (error) {
      console.error('Failed to create plan:', error);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch('/api/subscription-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      fetchPlans();
    } catch (error) {
      console.error('Failed to toggle plan:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className={`min-h-screen ${theme.secondary} p-8`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${theme.heading}`}>Subscription Plans</h1>
          <button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
            {showForm ? 'Cancel' : 'Create Plan'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow mb-8 p-6">
            <h2 className="text-xl font-semibold mb-4">Create Subscription Plan</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Premium" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input type="text" name="slug" required value={formData.slug} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="premium" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price (KES)</label>
                <input type="number" name="monthlyPrice" value={formData.monthlyPrice} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="2999" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Price (KES)</label>
                <input type="number" name="annualPrice" value={formData.annualPrice} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="29990" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Downloads/Month</label>
                <input type="number" name="maxDownloads" value={formData.maxDownloads} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Photos in Cart</label>
                <input type="number" name="maxPhotos" value={formData.maxPhotos} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input type="number" name="displayOrder" value={formData.displayOrder} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex items-center mt-6">
                <input type="checkbox" name="isPopular" checked={formData.isPopular} onChange={handleChange} className="mr-2" />
                <label className="text-sm font-medium text-gray-700">Mark as Popular</label>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" rows={2} />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma separated)</label>
                <input type="text" name="features" value={formData.features} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Premium discounts,Priority support,Early access" />
              </div>
              <div className="col-span-3">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Create Plan</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className={`bg-white rounded-lg shadow p-6 ${plan.isPopular ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-xl font-bold ${theme.heading}`}>{plan.name}</h3>
                    {plan.isPopular && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Popular</span>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {plan.description && <p className="text-gray-600 mb-4">{plan.description}</p>}
                <div className="space-y-2 mb-4">
                  {plan.monthlyPrice && <div className="flex justify-between"><span className="text-gray-500">Monthly:</span><span className="font-semibold">KES {parseFloat(plan.monthlyPrice).toLocaleString()}</span></div>}
                  {plan.annualPrice && <div className="flex justify-between"><span className="text-gray-500">Annual:</span><span className="font-semibold">KES {parseFloat(plan.annualPrice).toLocaleString()}</span></div>}
                  {plan.maxDownloads && <div className="flex justify-between"><span className="text-gray-500">Downloads:</span><span>{plan.maxDownloads}/month</span></div>}
                  {plan.maxPhotos && <div className="flex justify-between"><span className="text-gray-500">Cart Limit:</span><span>{plan.maxPhotos} photos</span></div>}
                </div>
                <button onClick={() => toggleActive(plan.id, plan.isActive)} className={`w-full py-2 rounded-lg text-sm ${plan.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        )}
        {plans.length === 0 && !loading && <div className="text-center py-12 text-gray-500">No subscription plans found</div>}
      </div>
    </div>
  );
}
