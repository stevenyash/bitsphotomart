import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { PageContainer, PageHeader, Section } from "@/components/ui/page-container";

export const metadata = {
  title: "Contact Us - Bits Photo Mart",
  description: "Get in touch with Bits Photo Mart. We're here to help with your photography, videography, and creative media needs across Kenya.",
};

export default function ContactPage() {
  return (
    <PageContainer>
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <Section className="bg-gradient-to-b from-background to-muted/30 -mx-4 px-4 pt-16 pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Have a project in mind? Want to join our network of creatives? 
            We&apos;d love to hear from you.
          </p>
        </div>
      </Section>
      
      {/* Contact Form Section */}
      <Section className="-mt-8">
        <ContactForm />
      </Section>
      
      {/* Additional Info Section */}
      <Section className="bg-muted/30 -mx-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Ready to Start Your Project?</h2>
            <p className="text-muted-foreground mt-2">
              Whether you need professional photography, video production, or want to join our creative network, we&apos;re here to help.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-background p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">For Clients</h3>
              <p className="text-sm text-muted-foreground">
                Request a quote for photography, videography, or documentary production services.
              </p>
            </div>
            
            <div className="bg-background p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">For Creatives</h3>
              <p className="text-sm text-muted-foreground">
                Join our network of photographers and videographers across Kenya.
              </p>
            </div>
            
            <div className="bg-background p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Stock Media</h3>
              <p className="text-sm text-muted-foreground">
                Browse our library of authentic African photos and footage.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </PageContainer>
  );
}
