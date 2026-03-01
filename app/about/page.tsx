import { Target, Search, Star, HandHeart, Lightbulb, Globe, User, Users, Zap, Sparkles } from 'lucide-react';

export const metadata = {
  title: "About Us - Bits Photo Mart",
  description: "Learn about Bits Photo Mart, Kenya's premier creative media network connecting photographers, videographers, and documentary storytellers.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">About Bits Photo Mart</h1>
          <p className="text-xl opacity-90">Your Nationwide Creative Media Network</p>
        </div>
      </div>

      {/* Who We Are - From Brief */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Who We Are</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              Bits Photo Mart is a digital media marketplace and production network designed to make it easier 
              for organisations to access reliable photographers, videographers, and documentary producers across Kenya. 
              We connect organizations to a verified network of creative professionals in all 47 counties, ensuring 
              quality work and transparent pricing.
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Vision - From Brief */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-8 border border-amber-100">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed text-center">
                &quot;To build Africa&apos;s most trusted creative network, events coverage services and house 
                the largest library of authentic African visuals; all in one stop.&quot;
              </p>
            </div>

            {/* Vision */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 border border-blue-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Our Vision</h2>
              <p className="text-gray-700 leading-relaxed text-center">
                &quot;A continent where creatives thrive, organisations tell better stories, and African imagery 
                becomes globally accessible.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Values - From Brief: Convenience, Innovativeness, Excellence, Fun */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Our Core Values</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            The principles that guide everything we do at Bits Photo Mart
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            {/* Convenience */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Convenience</h3>
              <p className="text-gray-600 text-sm">Making it easy to access professional creative services across Kenya</p>
            </div>

            {/* Innovativeness */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Innovativeness</h3>
              <p className="text-gray-600 text-sm">Continuously improving our platform with cutting-edge solutions</p>
            </div>

            {/* Excellence */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Excellence</h3>
              <p className="text-gray-600 text-sm">Upholding the highest standards in every project we undertake</p>
            </div>

            {/* Fun */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Fun</h3>
              <p className="text-gray-600 text-sm">Making the creative process enjoyable and memorable</p>
            </div>
          </div>
        </div>
      </div>

      {/* Network Stats - From Brief */}
      <div className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-200">Verified Photographers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">47</div>
              <div className="text-blue-200">Counties Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-200">Projects Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-blue-200">Stock Photos & Videos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Bits Photo Mart</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Verified Creatives</h3>
              <p className="text-gray-600">All our photographers and videographers are vetted professionals</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Fast Turnaround</h3>
              <p className="text-gray-600">Quick delivery times to meet your project deadlines</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Transparent Pricing</h3>
              <p className="text-gray-600">Fair and clear pricing with no hidden fees</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-4 bg-amber-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Work With Us?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Whether you need professional photography services or want to join our network of creatives, 
            we&apos;re here to help you capture your story.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/services"
              className="px-8 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              Our Services
            </a>
            <a
              href="/contact"
              className="px-8 py-3 bg-white text-amber-600 border-2 border-amber-600 rounded-lg font-medium hover:bg-amber-50 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
