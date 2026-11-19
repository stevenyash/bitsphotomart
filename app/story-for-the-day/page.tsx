import { Metadata } from 'next';
import { theme } from "@/lib/admin-theme";

export const metadata: Metadata = {
  title: 'Story for the Day - Bits Photo Mart',
  description: 'Book space to have your tale or business featured as a top story on Bits Photo Mart',
};

export default function StoryForTheDayPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            📖 Story for the Day
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto">
            Have your tale or business featured as a top story on Bits Photo Mart
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Get Featured</h3>
            <p className="text-gray-600">
              Your story appears prominently on our homepage and gets maximum visibility
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📈</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Boost Your Brand</h3>
            <p className="text-gray-600">
              Showcase your business or personal story to thousands of potential customers
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💼</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Professional Features</h3>
            <p className="text-gray-600">
              Include photos, videos, and detailed descriptions to tell your complete story
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Simple Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Daily Feature */}
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Daily Feature</h3>
                <p className="text-gray-600 mb-4">Perfect for individuals</p>
                <div className="text-4xl font-bold text-blue-600 mb-6">KSh 2,500</div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Featured for 24 hours
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Homepage banner spot
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Up to 5 photos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 300-word story
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Social media share
                  </li>
                </ul>
                <a
                  href="#book"
                  className="block w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                >
                  Book Now
                </a>
              </div>
            </div>

            {/* Weekly Feature */}
            <div className="bg-white border-2 border-purple-200 rounded-2xl p-8 relative">
              <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
                Popular
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Weekly Feature</h3>
                <p className="text-gray-600 mb-4">Best for businesses</p>
                <div className="text-4xl font-bold text-purple-600 mb-6">KSh 15,000</div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Featured for 7 days
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Premium homepage spot
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Up to 15 photos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 500-word story
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Social media promotion
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Newsletter feature
                  </li>
                </ul>
                <a
                  href="#book"
                  className="block w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-center"
                >
                  Book Now
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div id="book" className="max-w-2xl mx-auto mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Book Your Story</h2>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+254 XXX XXX XXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business/Organization Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your business name (if applicable)"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select package</option>
                    <option value="daily">Daily Feature - KSh 2,500</option>
                    <option value="weekly">Weekly Feature - KSh 15,000</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Story *
                </label>
                <textarea
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us your story... What makes your business unique? What would you like people to know?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photos to Include
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload up to 5 photos (Daily) or 15 photos (Weekly)
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Submit Booking Request
              </button>
            </form>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">What People Say</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <p className="text-gray-600 italic mb-4">
                "Our story was featured for a week and we saw a 40% increase in website traffic. Highly recommend!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <p className="font-semibold">Sarah Wanjiku</p>
                  <p className="text-sm text-gray-500">Wanjiku Photography</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <p className="text-gray-600 italic mb-4">
                "Great exposure for our startup. The Story for the Day feature helped us reach many potential customers."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <p className="font-semibold">James Ochieng</p>
                  <p className="text-sm text-gray-500">TechStart Kenya</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
