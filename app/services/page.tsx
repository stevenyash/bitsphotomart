/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { Camera, Video, Film, Building, Users, MapPin, Clock, Award, DollarSign, Wrench, ArrowLeft } from 'lucide-react';

// Helper function to get Lucide icon component by name
const getIconComponent = (iconName: string | null) => {
  if (!iconName) return Wrench;
  const iconKey = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<any>>)[iconKey];
  return IconComponent || Wrench;
};

interface BpmService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  link: string | null;
  cta: string | null;
}

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<BpmService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/bpm-services');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      } else {
        console.error('Failed to fetch services');
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (serviceId: string, link: string) => {
    router.push(link);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Creative Services</h1>
          <p className="text-xl max-w-2xl mx-auto opacity-90">
            Professional photography, videography, and documentary production services across Kenya
          </p>
        </div>
      </section>

      {/* Photography & Videography Section - From Brief */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Photography & Videography (Nationwide)</h2>
              </div>
              <p className="text-muted-foreground mb-6 text-lg">
                We provide professional coverage for:
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="text-foreground">Corporate events</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="text-foreground">NGO fieldwork</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="text-foreground">Conferences & workshops</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="text-foreground">Community programmes</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="text-foreground">Events - Weddings & celebrations</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="text-foreground">Product & brand shoots</span>
                </li>
              </ul>
              <div className="flex items-center gap-2 text-primary mb-6">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">Our vetted creatives are available in all 47 counties</span>
              </div>
              <Link
                href="/service-request"
                className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Request Coverage
              </Link>
            </div>
            <div>
              <p className="font-semibold text-lg text-foreground mb-4">Offering</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-xl p-6 text-center">
                  <Camera className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-foreground">Photo Coverage</p>
                </div>
                <div className="bg-muted rounded-xl p-6 text-center">
                  <Video className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-foreground">Video Production</p>
                </div>
                <div className="bg-muted rounded-xl p-6 text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-foreground">Event Teams</p>
                </div>
                <div className="bg-muted rounded-xl p-6 text-center">
                  <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-foreground">Fast Delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Documentary Production Section - From Brief */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="order-2 md:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-xl p-4 shadow-md">
                  <Building className="w-6 h-6 text-primary mb-2" />
                  <p className="font-semibold text-foreground">NGOs</p>
                </div>
                <div className="bg-card rounded-xl p-4 shadow-md">
                  <Award className="w-6 h-6 text-primary mb-2" />
                  <p className="font-semibold text-foreground">Government</p>
                </div>
                <div className="bg-card rounded-xl p-4 shadow-md">
                  <DollarSign className="w-6 h-6 text-primary mb-2" />
                  <p className="font-semibold text-foreground">Foundations</p>
                </div>
                <div className="bg-card rounded-xl p-4 shadow-md">
                  <Building className="w-6 h-6 text-primary mb-2" />
                  <p className="font-semibold text-foreground">Corporates</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <Film className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Documentary Production</h2>
              </div>
              <p className="text-muted-foreground mb-6 text-lg">
                We produce powerful documentaries and thematic stories for:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-foreground">NGOs</li>
                <li className="text-foreground">Government agencies</li>
                <li className="text-foreground">Foundations</li>
                <li className="text-foreground">Corporates</li>
                <li className="text-foreground">Individuals</li>
              </ul>
              <p className="text-muted-foreground mb-6">
                From concept development to filming, editing, and delivery - our team manages the entire production spectrum.
              </p>
              <Link
                href="/service-request?type=documentary"
                className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Start Your Documentary
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* African Stock Photos & Footage Section - From Brief */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">African Stock Photos & Footage</h2>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Access a growing library of:
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { name: "Landscapes", color: "bg-accent" },
              { name: "Wildlife", color: "bg-accent" },
              { name: "Culture & people", color: "bg-accent" },
              { name: "Cities & urban life", color: "bg-accent" },
              { name: "Agriculture & tourism", color: "bg-accent" },
              { name: "Events & celebrations", color: "bg-accent" },
            ].map((category) => (
              <div key={category.name} className={`${category.color} rounded-xl p-4 text-center`}>
                <p className="font-medium text-accent-foreground">{category.name}</p>
              </div>
            ))}
          </div>

          <div className="bg-muted rounded-2xl p-8 text-center">
            <p className="text-foreground mb-2">Options: &quot;Buy single clips/photos or complete themed collections&quot;</p>
            <Link
              href="/gallery"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Browse Library
            </Link>
          </div>
        </div>
      </section>

      {/* Corporate Media Packages Section - From Brief */}
      <section className="py-16 px-4 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Corporate Media Packages</h2>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We offer retainer packages for organisations that need consistent content.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-muted rounded-xl p-6 text-center">
              <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Monthly Media Support</h3>
              <p className="text-muted-foreground text-sm">Regular photo and video coverage for your organization</p>
            </div>
            <div className="bg-muted rounded-xl p-6 text-center">
              <Video className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Social Media Content</h3>
              <p className="text-muted-foreground text-sm">Engaging content for your social media platforms</p>
            </div>
            <div className="bg-muted rounded-xl p-6 text-center">
              <Camera className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Project Documentation</h3>
              <p className="text-muted-foreground text-sm">Document your projects with professional visuals</p>
            </div>
            <div className="bg-muted rounded-xl p-6 text-center">
              <Film className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Editing & Post-Production</h3>
              <p className="text-muted-foreground text-sm">Professional editing and color grading</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/contact?interest=retainer"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Inquire About Retainers
            </Link>
          </div>
        </div>
      </section>

      {/* Additional BPM Services from Database */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">Additional Services</h2>
          {!loading && services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => {
                const IconComponent = getIconComponent(service.icon);
                return (
                  <div
                    key={service.id}
                    className="bg-card rounded-xl p-6 transition-all duration-300 hover:shadow-lg cursor-pointer border border-border"
                    onClick={() => handleServiceClick(service.id, service.link || '#')}
                  >
                    <div className="mb-4">
                      <IconComponent className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{service.name}</h3>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    {service.cta && (
                      <span className="inline-block bg-accent px-4 py-2 rounded-full text-sm font-medium text-accent-foreground shadow-sm">
                        {service.cta} →
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <p>Additional services coming soon...</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-accent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-accent-foreground mb-4">Need Something Custom?</h2>
          <p className="text-accent-foreground mb-8 max-w-2xl mx-auto">
            Can&apos;t find what you&apos;re looking for? Contact us and we&apos;ll create a custom package for your specific needs.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-card text-foreground px-8 py-3 rounded-lg font-medium hover:bg-card/90 transition-colors"
          >
            Request a Quote
          </Link>
        </div>
      </section>
    </div>
  );
}
