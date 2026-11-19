import { Metadata } from 'next';
import { theme } from "@/lib/admin-theme";
import { Link2, Camera, Clapperboard, Plane, BarChart3, Building2, Hotel, Construction, Tv, Landmark, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'BPM Linkages - Corporate Partners | Bits Photo Mart',
  description: 'Authorized access for BPM corporate partners and clients',
};

export default function BpmLinkagesPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero */}
      <div className="bg-linear-to-r from-blue-700 to-blue-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <Link2 className="w-10 h-10" /> BPM Linkages
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto">
            Partner with Bits Photo Mart - Corporate & Business Solutions
          </p>
        </div>
      </div>

      {/* Partner Benefits */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Why Partner With Us?</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Bulk Photo Licensing</h3>
                  <p className="text-gray-600 text-sm">
                    Get exclusive access to our entire photo library for your marketing, advertising, and internal use at special corporate rates.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clapperboard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Custom Content Creation</h3>
                  <p className="text-gray-600 text-sm">
                    Our team can create custom photo and video content tailored to your brand&apos;s specific needs and campaigns.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plane className="w-6 h-6 text-purple-600" />
                </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Drone Services</h3>
                  <p className="text-gray-600 text-sm">
                    Aerial photography and videography services for real estate, events, and corporate projects.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-yellow-600" />
                </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Analytics & Reports</h3>
                  <p className="text-gray-600 text-sm">
                    Get detailed reports on content usage, engagement metrics, and ROI for your visual media investments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Partner Types */}
          <h2 className="text-3xl font-bold text-center mb-8">Our Partner Categories</h2>
          
          <div className="space-y-4 mb-12">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2"><Building2 className="w-5 h-5" /> Corporate Enterprises</h3>
                  <p className="text-gray-600">Large corporations needing ongoing visual content solutions</p>
                </div>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  Starting KSh 50,000/mo
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2"><Hotel className="w-5 h-5" /> Hospitality & Tourism</h3>
                  <p className="text-gray-600">Hotels, resorts, travel agencies, and tourism boards</p>
                </div>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  Starting KSh 35,000/mo
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2"><Construction className="w-5 h-5" /> Real Estate & Construction</h3>
                  <p className="text-gray-600">Property developers, real estate agencies, construction companies</p>
                </div>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                  Starting KSh 40,000/mo
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2"><Tv className="w-5 h-5" /> Media & Advertising Agencies</h3>
                  <p className="text-gray-600">Agencies needing high-quality visual content for clients</p>
                </div>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                  Starting KSh 75,000/mo
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2"><Landmark className="w-5 h-5" /> Government & NGOs</h3>
                  <p className="text-gray-600">Government agencies and non-governmental organizations</p>
                </div>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  Custom Pricing
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Educational Institutions</h3>
                  <p className="text-gray-600">Schools, universities, and training institutions</p>
                </div>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  Starting KSh 20,000/mo
                </span>
              </div>
            </div>
          </div>

          {/* Become a Partner */}
          <div className="bg-blue-600 text-white rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Become a Corporate Partner</h2>
            <p className="mb-6 max-w-xl mx-auto">
              Join our growing network of corporate partners and get exclusive access to premium visual content, 
              custom solutions, and dedicated support.
            </p>
            <a
              href="#partner-form"
              className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Apply Now
            </a>
          </div>

          {/* Partner Form */}
          <div id="partner-form" className="mt-12 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Corporate Partnership Application</h2>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry Sector *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select industry</option>
                    <option value="corporate">Corporate Enterprise</option>
                    <option value="hospitality">Hospitality & Tourism</option>
                    <option value="realestate">Real Estate & Construction</option>
                    <option value="media">Media & Advertising</option>
                    <option value="government">Government & NGO</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Your position"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="work@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+254 XXX XXX XXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Website
                </label>
                <input
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partnership Interest *
                </label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your interest</option>
                  <option value="bulk-licensing">Bulk Photo Licensing</option>
                  <option value="custom-content">Custom Content Creation</option>
                  <option value="drone-services">Drone Services</option>
                  <option value="all">All Services</option>
                  <option value="other">Other (specify below)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Information
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us more about your needs and how we can help..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Submit Application
              </button>
            </form>
          </div>

          {/* Current Partners */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">Our Trusted Partners</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {['Kenya Tourism Board', 'Safaricom', 'Kenya Power', 'Nairobi County', 'Kenyatta University', 'Kenya Airways', 'EABL', 'KRA'].map((partner) => (
                <div key={partner} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center">
                  <span className="font-semibold text-gray-600">{partner}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      
  );
}
