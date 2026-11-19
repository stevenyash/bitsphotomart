import Link from "next/link";
import { Camera, Mail, Phone, MapPin } from "lucide-react";
import { FooterPricing } from "./footer-pricing";
import { FooterContactInfo } from "./contact-info";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50 w-full overflow-hidden">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Bits Photo Mart</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your nationwide creative media network. Connecting organizations to verified photographers and videographers across Kenya.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/gallery" className="text-muted-foreground hover:text-primary">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-muted-foreground hover:text-primary">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/photographers" className="text-muted-foreground hover:text-primary">
                  Join as Photographer
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/user-guide" className="text-muted-foreground hover:text-primary">
                  User Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/services/photography" className="text-muted-foreground hover:text-primary">
                  Photography
                </Link>
              </li>
              <li>
                <Link href="/services/videography" className="text-muted-foreground hover:text-primary">
                  Videography
                </Link>
              </li>
              <li>
                <Link href="/services/drone" className="text-muted-foreground hover:text-primary">
                  Drone Services
                </Link>
              </li>
              <li>
                <Link href="/services/documentary" className="text-muted-foreground hover:text-primary">
                  Documentary
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact</h3>
            <FooterContactInfo />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Bits Photo Mart. All rights reserved.</p>
        </div>

        <div className="mt-8 pt-8 border-t">
          <h3 className="font-semibold mb-4 text-center">Quick Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2">Book Our Services</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>1. Visit Services page</li>
                <li>2. Choose service type</li>
                <li>3. Request a quote</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Our BPM Pricing</h4>
              <FooterPricing />
            </div>
            <div>
              <h4 className="font-medium mb-2">Navigate to Gallery</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>1. Go to Gallery</li>
                <li>2. Browse photos/videos</li>
                <li>3. Click to view details</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">For Photographers</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><Link href="/register/photographer" className="hover:text-primary">Become a Photographer</Link></li>
                <li><Link href="/photographer/upload" className="hover:text-primary">Upload Photos</Link></li>
                <li><Link href="/photographer/jobs" className="hover:text-primary">View Jobs</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
