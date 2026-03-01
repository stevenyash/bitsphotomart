import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { 
  Camera, 
  Video, 
  MapPin, 
  Users, 
  Shield,
  Clock,
  ArrowRight,
  Star,
  Image as ImageIcon,
  DollarSign,
  Heart,
  Briefcase,
  Globe,
  Award,
  Zap
} from "lucide-react";

async function FeaturedGallery() {
  const photos = await prisma.photo.findMany({
    where: { status: "APPROVED" },
    include: {
      photographer: {
        select: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const photosWithNumberPrice = photos.map((photo) => ({
    ...photo,
    price: Number(photo.price),
  }));

  if (photosWithNumberPrice.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No photos available yet. Be the first to upload!</p>
        <Link href="/register?role=photographer" className="mt-4 inline-block">
          <Button className="bg-amber-600 hover:bg-amber-700">
            Become a Photographer
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {photosWithNumberPrice.map((photo) => (
        <Link
          key={photo.id}
          href={`/gallery/${photo.id}`}
          className="group block relative aspect-square rounded-lg overflow-hidden"
        >
          {photo.thumbnailUrl ? (
            <img
              src={photo.thumbnailUrl}
              alt={photo.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white font-medium text-sm truncate">{photo.title}</p>
              <p className="text-white/80 text-xs">KES {photo.price.toLocaleString()}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// What We Do - 5 cards
const whatWeDoServices = [
  {
    icon: Camera,
    title: "Nationwide Photography & Videography Services",
    description: "Professional coverage for events, corporate, and personal projects across all 47 counties.",
  },
  {
    icon: Video,
    title: "Professional Documentary Production",
    description: "Powerful storytelling with our signature documentary style production.",
  },
  {
    icon: Users,
    title: "Corporate & Event Coverage",
    description: "Professional coverage for conferences, workshops, weddings, and celebrations.",
  },
  {
    icon: ImageIcon,
    title: "Stock Photography & Stock Footage Marketplace",
    description: "Access thousands of authentic African visuals for your marketing needs.",
  },
  {
    icon: Briefcase,
    title: "On-Demand Creative Teams",
    description: "Expert teams for thematic storytelling and custom creative projects.",
  },
];

// Why Choose Us - 6 features
const whyChooseUs = [
  {
    icon: MapPin,
    title: "Verified Creatives in All 47 Counties",
    description: "Our network spans the entire country, bringing professional services to your location.",
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description: "Quick delivery with professional quality guaranteed. Your content, when you need it.",
  },
  {
    icon: DollarSign,
    title: "Fair and Transparent Pricing",
    description: "No hidden costs. Clear pricing for all services and media licenses.",
  },
  {
    icon: Globe,
    title: "Authentic African Visuals",
    description: "Genuine African imagery that tells real stories from the continent.",
  },
  {
    icon: Shield,
    title: "Professional Quality Guaranteed",
    description: "Vetted photographers and videographers with proven track records.",
  },
  {
    icon: Heart,
    title: "Customer Satisfaction",
    description: "Dedicated support and 98% client satisfaction rate.",
  },
];

export const metadata = {
  title: "Bits Photo Mart - Your Nationwide Creative Media Network",
  description: "Bits Photo Mart connects organisations to a verified network of photographers, videographers, and documentary storytellers across Kenya.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', 
            backgroundSize: '50px 50px' 
          }}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Your Nationwide <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                Creative Media Network
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Bits Photo Mart connects organisations to a verified network of photographers, 
              videographers, and documentary storytellers across Kenya. From event coverage to 
              custom media production, we deliver professional creative solutions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/services">
                <Button size="lg" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-8">
                  Book a Creative Team
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-accent border-white/30 text-black hover:bg-white/10 hover:text-white hover:border-white/50 px-8">
                  Our Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section - 5 Cards */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What We Do
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Comprehensive creative media services tailored to your needs across Kenya.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            {whatWeDoServices.map((service, index) => (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <service.icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-sm text-slate-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us - 6 Features */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Choose Us
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Experience the difference with Kenya&apos;s most trusted creative media network.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {whyChooseUs.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 mb-1 md:mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Gallery Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Featured Gallery
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Explore our collection of high-quality stock photos from talented photographers across Kenya.
            </p>
          </div>
          
          <FeaturedGallery />
          
          <div className="text-center mt-10">
            <Link href="/gallery">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                View Full Gallery
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Get Started CTA */}
      <section className="py-20 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Started Today
          </h2>
          <p className="text-lg text-amber-100 max-w-2xl mx-auto mb-8">
            Ready to bring your creative vision to life? Book a professional creative team or browse our stock library.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/services">
              <Button size="lg" className="w-full sm:w-auto bg-white text-amber-600 hover:bg-amber-50 font-semibold px-8">
                Book a Creative Team
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10 px-8">
                Browse Stock Library
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Creatives Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Award className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">Join Our Network</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                For Photographers & Videographers
              </h2>
              <p className="text-lg text-blue-100 mb-8">
                Join Kenya&apos;s fastest-growing creative network. Get access to paid assignments, 
                training, and grow your photography business.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-amber-400" />
                  <span>Earn 50-60% commission per download</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-amber-400" />
                  <span>Access to premium assignments</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <span>Fast payouts via MPesa or PayPal</span>
                </div>
              </div>
              
              <Link href="/for-creatives">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                  Join as a Creative
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Camera className="h-24 w-24 text-white/50" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
