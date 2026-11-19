'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, RefreshCw, CheckCircle, XCircle, Settings as SettingsIcon } from 'lucide-react';
import { theme, adminLayout } from '@/lib/admin-theme';

interface Settings {
  // Platform Settings
  platform_name?: string;
  platform_description?: string;
  platform_email?: string;
  platform_phone?: string;
  platform_address?: string;
  
  // Pricing Settings
  price_photo_from?: string;
  price_hd_clip_from?: string;
  price_4k_clip_from?: string;
  
  // Commission Settings
  photographer_commission_rate?: string;
  platform_commission_rate?: string;
  
  // Photo Settings
  auto_approve_photos?: string;
  max_photo_size_mb?: string;
  
  // Payout Settings
  payout_minimum_amount?: string;
  payout_frequency?: string;
  
  // Feature Toggles
  enable_registration?: string;
  enable_photographer_application?: string;
  enable_mpesa?: string;
  enable_stripe?: string;
}

const defaultSettings: Settings = {
  platform_name: 'BitsPhotoMart',
  platform_description: 'Premium stock photography marketplace',
  platform_email: 'support@bitsphotomart.com',
  platform_phone: '+254700000000',
  platform_address: 'Nairobi, Kenya',
  price_photo_from: '500',
  price_hd_clip_from: '1000',
  price_4k_clip_from: '2500',
  photographer_commission_rate: '70',
  platform_commission_rate: '30',
  auto_approve_photos: 'false',
  max_photo_size_mb: '10',
  payout_minimum_amount: '1000',
  payout_frequency: 'weekly',
  enable_registration: 'true',
  enable_photographer_application: 'true',
  enable_mpesa: 'true',
  enable_stripe: 'false',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        // Ensure all values are strings, handle nested objects
        const stringData: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'object' && value !== null && 'value' in value) {
            // Handle {"value": "..."} format
            stringData[key] = String((value as { value: unknown }).value || '');
          } else if (typeof value === 'object') {
            // Handle other object formats
            stringData[key] = JSON.stringify(value);
          } else {
            stringData[key] = String(value || '');
          }
        }
        // Merge with defaults to ensure all fields exist
        setSettings({ ...defaultSettings, ...stringData });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: keyof Settings) => {
    const rawValue = settings[key];
    if (rawValue === undefined || rawValue === null) return;
    
    // Ensure value is always a plain string, not an object
    let value = typeof rawValue === 'object' ? JSON.stringify(rawValue) : String(rawValue);
    
    // If it looks like JSON, extract the value
    if (value.startsWith('{"value":')) {
      try {
        const parsed = JSON.parse(value);
        value = parsed.value || '';
      } catch {
        // Keep as is
      }
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `${key.replace(/_/g, ' ')} saved successfully!` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save setting' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving setting' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const updates = Object.entries(settings).filter(([_, value]) => value !== undefined);
      
      for (const [key, value] of updates) {
        await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        });
      }

      setMessage({ type: 'success', text: 'All settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default values?')) {
      setSettings(defaultSettings);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.secondary} flex items-center justify-center`}>
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-red-700" />
          <p className={`mt-2 ${theme.mutedText}`}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.secondary}`}>
      {/* Header */}
      <div className="bg-red-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="p-2 hover:bg-red-600 rounded-lg transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <SettingsIcon className="h-8 w-8" />
                  Platform Settings
                </h1>
                <p className="text-red-100 text-lg">
                  Configure your platform settings
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Reset to Defaults
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="px-4 py-2 bg-white text-red-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Platform Information */}
          <div className={`${theme.cardStyle} p-6`}>
            <h2 className={`text-xl font-bold ${theme.heading} mb-6`}>Platform Information</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.platform_name || ''}
                  onChange={(e) => handleChange('platform_name', e.target.value)}
                  onBlur={() => handleSave('platform_name')}
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  Description
                </label>
                <textarea
                  value={settings.platform_description || ''}
                  onChange={(e) => handleChange('platform_description', e.target.value)}
                  onBlur={() => handleSave('platform_description')}
                  rows={3}
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.platform_email || ''}
                  onChange={(e) => handleChange('platform_email', e.target.value)}
                  onBlur={() => handleSave('platform_email')}
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={settings.platform_phone || ''}
                  onChange={(e) => handleChange('platform_phone', e.target.value)}
                  onBlur={() => handleSave('platform_phone')}
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  Address
                </label>
                <input
                  type="text"
                  value={settings.platform_address || ''}
                  onChange={(e) => handleChange('platform_address', e.target.value)}
                  onBlur={() => handleSave('platform_address')}
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                />
              </div>
            </div>
          </div>

          {/* Pricing Settings */}
          <div className={`${theme.cardStyle} p-6`}>
            <h2 className={`text-xl font-bold ${theme.heading} mb-6`}>Stock Library Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  Photo - From (KES)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.price_photo_from || '500'}
                  onChange={(e) => handleChange('price_photo_from', e.target.value)}
                  onBlur={() => handleSave('price_photo_from')}
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  HD Clip - From (KES)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.price_hd_clip_from || '1000'}
                  onChange={(e) => handleChange('price_hd_clip_from', e.target.value)}
                  onBlur={() => handleSave('price_hd_clip_from')}
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  4K Clip - From (KES)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.price_4k_clip_from || '2500'}
                  onChange={(e) => handleChange('price_4k_clip_from', e.target.value)}
                  onBlur={() => handleSave('price_4k_clip_from')}
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                />
              </div>
            </div>
          </div>

          {/* Commission Settings */}
          <div className={`${theme.cardStyle} p-6`}>
            <h2 className={`text-xl font-bold ${theme.heading} mb-6`}>Commission Settings</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  Photographer Commission Rate (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.photographer_commission_rate || '70'}
                    onChange={(e) => handleChange('photographer_commission_rate', e.target.value)}
                    className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  />
                  <button
                    onClick={() => handleSave('photographer_commission_rate')}
                    disabled={saving}
                    className="px-3 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
                <p className={`text-sm ${theme.mutedText} mt-1`}>Percentage photographers receive from each sale</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  Platform Commission Rate (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.platform_commission_rate || '30'}
                    onChange={(e) => handleChange('platform_commission_rate', e.target.value)}
                    className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  />
                  <button
                    onClick={() => handleSave('platform_commission_rate')}
                    disabled={saving}
                    className="px-3 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
                <p className={`text-sm ${theme.mutedText} mt-1`}>Platform takes the remaining percentage</p>
              </div>
            </div>
          </div>

          {/* Photo Settings */}
          <div className={`${theme.cardStyle} p-6`}>
            <h2 className={`text-xl font-bold ${theme.heading} mb-6`}>Photo Settings</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  Auto-approve Photos
                </label>
                <select
                  value={settings.auto_approve_photos || 'false'}
                  onChange={(e) => {
                    handleChange('auto_approve_photos', e.target.value);
                    handleSave('auto_approve_photos');
                  }}
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                >
                  <option value="true">Yes - Auto-approve</option>
                  <option value="false">No - Require approval</option>
                </select>
                <p className={`text-sm ${theme.mutedText} mt-1`}>Automatically approve photos uploaded by photographers</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  Maximum Photo Size (MB)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.max_photo_size_mb || '10'}
                    onChange={(e) => handleChange('max_photo_size_mb', e.target.value)}
                    className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  />
                  <button
                    onClick={() => handleSave('max_photo_size_mb')}
                    disabled={saving}
                    className="px-3 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Payout Settings */}
          <div className={`${theme.cardStyle} p-6`}>
            <h2 className={`text-xl font-bold ${theme.heading} mb-6`}>Payout Settings</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  Minimum Payout Amount (KES)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={settings.payout_minimum_amount || '1000'}
                    onChange={(e) => handleChange('payout_minimum_amount', e.target.value)}
                    className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  />
                  <button
                    onClick={() => handleSave('payout_minimum_amount')}
                    disabled={saving}
                    className="px-3 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
                <p className={`text-sm ${theme.mutedText} mt-1`}>Minimum amount required to request a payout</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.body} mb-1`}>
                  Payout Frequency
                </label>
                <select
                  value={settings.payout_frequency || 'weekly'}
                  onChange={(e) => {
                    handleChange('payout_frequency', e.target.value);
                    handleSave('payout_frequency');
                  }}
                  className={`w-full px-4 py-2 ${theme.input} ${theme.border} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className={`${theme.cardStyle} p-6 lg:col-span-2`}>
            <h2 className={`text-xl font-bold ${theme.heading} mb-6`}>Feature Toggles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`flex items-center justify-between p-4 ${theme.muted} rounded-lg`}>
                <div>
                  <h3 className={`font-medium ${theme.heading}`}>User Registration</h3>
                  <p className={`text-sm ${theme.mutedText}`}>Allow new users to register</p>
                </div>
                <button
                  onClick={() => {
                    const newValue = settings.enable_registration === 'true' ? 'false' : 'true';
                    handleChange('enable_registration', newValue);
                    handleSave('enable_registration');
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enable_registration === 'true' ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enable_registration === 'true' ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 ${theme.muted} rounded-lg`}>
                <div>
                  <h3 className={`font-medium ${theme.heading}`}>Photographer Applications</h3>
                  <p className={`text-sm ${theme.mutedText}`}>Allow users to apply as photographers</p>
                </div>
                <button
                  onClick={() => {
                    const newValue = settings.enable_photographer_application === 'true' ? 'false' : 'true';
                    handleChange('enable_photographer_application', newValue);
                    handleSave('enable_photographer_application');
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enable_photographer_application === 'true' ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enable_photographer_application === 'true' ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 ${theme.muted} rounded-lg`}>
                <div>
                  <h3 className={`font-medium ${theme.heading}`}>M-Pesa Payments</h3>
                  <p className={`text-sm ${theme.mutedText}`}>Enable M-Pesa as payment option</p>
                </div>
                <button
                  onClick={() => {
                    const newValue = settings.enable_mpesa === 'true' ? 'false' : 'true';
                    handleChange('enable_mpesa', newValue);
                    handleSave('enable_mpesa');
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enable_mpesa === 'true' ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enable_mpesa === 'true' ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 ${theme.muted} rounded-lg`}>
                <div>
                  <h3 className={`font-medium ${theme.heading}`}>Stripe Payments</h3>
                  <p className={`text-sm ${theme.mutedText}`}>Enable Stripe as payment option</p>
                </div>
                <button
                  onClick={() => {
                    const newValue = settings.enable_stripe === 'true' ? 'false' : 'true';
                    handleChange('enable_stripe', newValue);
                    handleSave('enable_stripe');
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enable_stripe === 'true' ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enable_stripe === 'true' ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
