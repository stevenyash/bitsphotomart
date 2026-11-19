'use client';

import { useState, useEffect } from 'react';
import { theme } from "@/lib/admin-theme";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: string;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number | null;
  minOrderAmount: string | null;
  validFrom: string | null;
  validUntil: string | null;
  appliesTo: string;
  isActive: boolean;
  createdAt: string;
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxUses: '',
    maxUsesPerUser: '',
    minOrderAmount: '',
    validFrom: '',
    validUntil: '',
    appliesTo: 'ALL',
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const res = await fetch('/api/admin/promo-codes');
      const data = await res.json();
      setPromoCodes(data);
    } catch (error) {
      console.error('Failed to fetch promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        fetchPromoCodes();
        setShowForm(false);
        setFormData({
          code: '',
          description: '',
          discountType: 'PERCENTAGE',
          discountValue: '',
          maxUses: '',
          maxUsesPerUser: '',
          minOrderAmount: '',
          validFrom: '',
          validUntil: '',
          appliesTo: 'ALL',
        });
      }
    } catch (error) {
      console.error('Failed to create promo code:', error);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch('/api/promo-codes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      fetchPromoCodes();
    } catch (error) {
      console.error('Failed to toggle promo code:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className={`min-h-screen ${theme.secondary} p-8`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${theme.heading}`}>Promo Codes</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
          >
            {showForm ? 'Cancel' : 'Create Promo Code'}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className={`${theme.cardStyle} mb-8 p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${theme.heading}`}>Create New Promo Code</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Code</label>
                <input
                  type="text"
                  name="code"
                  required
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 ${theme.input} ${theme.border} rounded-lg uppercase`}
                  placeholder="SUMMER20"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Discount Type</label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 ${theme.input} ${theme.border} rounded-lg`}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (KES)</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Discount Value</label>
                <input
                  type="number"
                  name="discountValue"
                  required
                  value={formData.discountValue}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 ${theme.input} ${theme.border} rounded-lg`}
                  placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '500'}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Max Uses</label>
                <input
                  type="number"
                  name="maxUses"
                  value={formData.maxUses}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 ${theme.input} ${theme.border} rounded-lg`}
                  placeholder="100"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Max Per User</label>
                <input
                  type="number"
                  name="maxUsesPerUser"
                  value={formData.maxUsesPerUser}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 ${theme.input} ${theme.border} rounded-lg`}
                  placeholder="1"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Min Order (KES)</label>
                <input
                  type="number"
                  name="minOrderAmount"
                  value={formData.minOrderAmount}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 ${theme.input} ${theme.border} rounded-lg`}
                  placeholder="1000"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Valid From</label>
                <input
                  type="date"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 ${theme.input} ${theme.border} rounded-lg`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Valid Until</label>
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 ${theme.input} ${theme.border} rounded-lg`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Applies To</label>
                <select
                  name="appliesTo"
                  value={formData.appliesTo}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 ${theme.input} ${theme.border} rounded-lg`}
                >
                  <option value="ALL">All</option>
                  <option value="PHOTOS">Photos Only</option>
                  <option value="VIDEOS">Videos Only</option>
                  <option value="SUBSCRIPTIONS">Subscriptions</option>
                  <option value="SERVICES">Services</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 ${theme.input} ${theme.border} rounded-lg`}
                  placeholder="Summer sale discount"
                />
              </div>
              <div className="col-span-3">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                  Create Promo Code
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Promo Codes List */}
        {loading ? (
          <div className={`text-center py-12 ${theme.mutedText}`}>Loading...</div>
        ) : (
          <div className={`${theme.cardStyle} overflow-hidden`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={theme.secondary}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${theme.mutedText} uppercase`}>Code</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${theme.mutedText} uppercase`}>Discount</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${theme.mutedText} uppercase`}>Usage</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${theme.mutedText} uppercase`}>Validity</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${theme.mutedText} uppercase`}>Applies To</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${theme.mutedText} uppercase`}>Status</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${theme.mutedText} uppercase`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-200 ${theme.body}`}>
                {promoCodes.map((promo) => (
                  <tr key={promo.id} className={`${theme.tableRowHover}`}>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-lg">{promo.code}</span>
                      {promo.description && <p className={`text-sm ${theme.mutedText}`}>{promo.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      {promo.discountType === 'PERCENTAGE' ? (
                        <span className="text-green-600 font-semibold">{promo.discountValue}% OFF</span>
                      ) : (
                        <span className="text-green-600 font-semibold">KES {promo.discountValue} OFF</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme.heading}`}>
                      {promo.usedCount} / {promo.maxUses || '∞'}
                      {promo.maxUsesPerUser && <span className={theme.mutedText}> (max {promo.maxUsesPerUser}/user)</span>}
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme.heading}`}>
                      {promo.validFrom && <div>From: {new Date(promo.validFrom).toLocaleDateString()}</div>}
                      {promo.validUntil && <div>Until: {new Date(promo.validUntil).toLocaleDateString()}</div>}
                      {!promo.validFrom && !promo.validUntil && <span className={theme.mutedText}>No expiry</span>}
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme.heading}`}>{promo.appliesTo}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${promo.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(promo.id, promo.isActive)}
                        className={`text-sm ${promo.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                      >
                        {promo.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {promoCodes.length === 0 && (
              <div className={`text-center py-12 ${theme.mutedText}`}>No promo codes found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
