'use client';

import { useState, useEffect } from 'react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: string | null;
  annualPrice: string | null;
  features: string | null;
  maxDownloads: number | null;
  maxPhotos: number | null;
  isPopular: boolean;
}

export default function SubscribePage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    fetch('/api/subscription-plans')
      .then(res => res.json())
      .then(data => setPlans(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getPrice = (plan: SubscriptionPlan) => {
    if (billingPeriod === 'monthly') {
      return plan.monthlyPrice ? parseFloat(plan.monthlyPrice) : 0;
    }
    return plan.annualPrice ? parseFloat(plan.annualPrice) : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-600 mb-8">Get premium discounts on photos and videos</p>
          
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md ${billingPeriod === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-md ${billingPeriod === 'annual' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
            >
              Annual <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.id} className={`relative bg-white rounded-2xl shadow-lg p-8 ${plan.isPopular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 text-sm font-medium rounded-t-2xl">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                {plan.description && <p className="text-gray-600 mb-4">{plan.description}</p>}
                
                <div className="mb-6">
                  <span className="text-4xl font-bold">KES {getPrice(plan).toLocaleString()}</span>
                  <span className="text-gray-500">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                </div>
                
                {plan.maxDownloads && (
                  <p className="text-sm text-gray-600 mb-2">{plan.maxDownloads} downloads/month</p>
                )}
                {plan.maxPhotos && (
                  <p className="text-sm text-gray-600 mb-4">Up to {plan.maxPhotos} photos in cart</p>
                )}
                
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium">
                  Subscribe Now
                </button>
              </div>
            ))}
          </div>
        )}
        
        {plans.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            No subscription plans available yet. Check back soon!
          </div>
        )}
      </div>
    </div>
  );
}
