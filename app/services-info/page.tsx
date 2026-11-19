import { theme } from "@/lib/admin-theme";
import Link from "next/link";
import { Camera, Film, Plane, Building2, ShoppingBag, GraduationCap, Home, Newspaper, Check, Clapperboard, ArrowLeft } from 'lucide-react';

export default function ServicesInfoPage() {
  const services = [
    {
      icon: Camera,
      title: 'Event Photography',
      description: 'Professional photography coverage for weddings, corporate events, conferences, birthdays, and all special occasions.',
      features: ['Full-day coverage', 'Multiple photographers', 'Online gallery', 'Print packages'],
      price: 'Starting from KES 50,000',
    },
    {
      icon: Clapperboard,
      title: 'Documentary Production',
      description: 'Tell your story through professionally produced documentaries. We create compelling narratives from your photos and video clips.',
      features: ['Custom storyline', 'Animation effects', 'Professional editing', 'Multiple formats'],
      price: 'Starting from KES 150,000',
    },
    {
      icon: Plane,
      title: 'Drone Services',
      description: 'Stunning aerial photography and videography for events, real estate, construction, and promotional content.',
      features: ['4K video', '360° panoramas', 'Before/after shots', 'Inspection services'],
      price: 'Starting from KES 30,000',
    },
    {
      icon: Building2,
      title: 'Corporate Photography',
      description: 'Professional business photography including headshots, team photos, office interiors, and corporate events.',
      features: ['Headshots', 'Team photos', 'Product photography', 'Brand content'],
      price: 'Starting from KES 25,000',
    },
    {
      icon: ShoppingBag,
      title: 'Product Photography',
      description: 'High-quality product images for e-commerce, catalogs, and advertising. Make your products stand out.',
      features: ['White background', 'Lifestyle shots', '360° rotation', 'Batch processing'],
      price: 'Starting from KES 5,000/day',
    },
    {
      icon: GraduationCap,
      title: 'Graduation & Portrait',
      description: 'Classic portrait photography for graduations, school events, and personal portraits.',
      features: ['Studio sessions', 'Outdoor locations', 'Group packages', 'Framed prints'],
      price: 'Starting from KES 15,000',
    },
    {
      icon: Home,
      title: 'Real Estate Photography',
      description: 'Showcase properties with professional real estate photography and virtual tours.',
      features: ['Interior & exterior', 'Virtual tours', 'Twilight shots', 'Floor plans'],
      price: 'Starting from KES 20,000',
    },
    {
      icon: Newspaper,
      title: 'Media & Press Coverage',
      description: 'News and media coverage for events, product launches, and press conferences.',
      features: ['Fast turnaround', 'High-res delivery', 'Social media ready', 'Press releases'],
      price: 'Starting from KES 35,000',
    },
  ];

  const processSteps = [
    { number: '1', title: 'Submit Request', description: 'Fill out our service request form with your requirements' },
    { number: '2', title: 'Get Quote', description: 'We\'ll provide a detailed quote within 24 hours' },
    { number: '3', title: 'Book & Pay', description: 'Confirm your booking with a deposit payment' },
    { number: '4', title: 'Shoot', description: 'Our team arrives at the scheduled time and location' },
    { number: '5', title: 'Delivery', description: 'Receive your edited photos/videos within agreed timeframe' },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">Our Services</h1>
          <p className="text-xl opacity-90">Professional photography and videography services tailored to your needs</p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What We Offer</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="mb-4"><service.icon className="w-10 h-10 text-blue-600" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="space-y-2 mb-4">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t">
                  <span className="text-blue-600 font-bold">{service.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Process */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-5 gap-4">
            {processSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step.number}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Photos & Clips */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 md:p-12 text-white">
            <div className="md:flex items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-3xl font-bold mb-4">Buy Stock Photos & Video Clips</h2>
                <p className="text-lg opacity-90">
                  Browse our extensive library of high-quality photos and videos. 
                  Purchase individual images or get bulk access with our subscription plans.
                </p>
              </div>
              <div>
                <a href="/gallery" className="inline-block bg-white text-purple-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                  Browse Gallery
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sell to BPM */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-white">
            <div className="md:flex items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-3xl font-bold mb-4">Sell Your Photos to BPM</h2>
                <p className="text-lg opacity-90">
                  Have great photos? Submit them for consideration. If we like your work, 
                  we'll purchase exclusive rights. Photos are displayed for 10 days for review.
                </p>
              </div>
              <div>
                <a href="/sell-to-bpm" className="inline-block bg-blue-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors">
                  Submit Photos
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Book a Service?</h2>
          <p className="text-gray-600 mb-8">Fill out our service request form and we'll get back to you within 24 hours.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/services" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Book Services
            </a>
            <a href="/documentary" className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2">
              <Clapperboard className="w-5 h-5" /> Documentary Production
            </a>
            <a href="/contact" className="bg-gray-200 text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
