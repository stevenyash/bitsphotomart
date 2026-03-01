'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SellToBpmPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    askingPrice: '',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/bpm-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Photo submitted successfully! We will review it within 10 days.' });
        setFormData({ title: '', description: '', askingPrice: '' });
        setImageUrl('');
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to submit' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sell Your Photos to BPM</h1>
          <p className="text-lg text-gray-600">
            Have great photos? Submit them for consideration. If we like your work, 
            we'll purchase exclusive rights.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Submit Your Photo</h3>
                <p className="text-gray-600 text-sm">Upload your best photos with details about each</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">We Review (10 Days)</h3>
                <p className="text-gray-600 text-sm">Our team reviews submissions within 10 days</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">We Make an Offer</h3>
                <p className="text-gray-600 text-sm">If selected, we'll make you an offer for exclusive rights</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-blue-600 font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Get Paid</h3>
                <p className="text-gray-600 text-sm">Accept the offer and receive payment via M-Pesa or bank transfer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submission Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Submit Your Photo</h2>
          
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/your-photo.jpg"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Enter the URL of your photo (must be publicly accessible)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Sunset over Nairobi"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us about this photo - location, context, etc."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Asking Price (KES) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.askingPrice}
                onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                placeholder="5000"
                min="100"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Minimum KES 100</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <h3 className="font-bold text-yellow-800 mb-2">Tips for Successful Submissions</h3>
          <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm">
            <li>High-resolution images with good lighting perform better</li>
            <li>Include unique or rare subjects that stand out</li>
            <li>Original, unedited photos are preferred</li>
            <li>Provide accurate and fair pricing</li>
            <li>Photos that tell a story or capture emotion are more likely to be selected</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
