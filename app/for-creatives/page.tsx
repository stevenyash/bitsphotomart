import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, Section } from "@/components/ui/page-container";
import { 
  Camera, 
  Video, 
  MapPin, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Award, 
  Clock,
  ChevronRight,
  CheckCircle,
  Upload,
  Wallet,
  GraduationCap,
  Star,
  ArrowLeft
} from "lucide-react";

export const metadata = {
  title: "Join Our Creative Network - Bits Photo Mart",
  description: "Earn from your creative talent. Join Bits Photo Mart's network of photographers and videographers across Kenya.",
};

const BENEFITS = [
  {
    icon: DollarSign,
    title: "Earn 50-60% Commission",
    description: "Get competitive commission rates per download and project completion.",
  },
  {
    icon: Users,
    title: "Access Premium Assignments",
    description: "Get matched with high-paying clients and corporate projects.",
  },
  {
    icon: GraduationCap,
    title: "Training & Upskilling",
    description: "Access creator training resources and improve your skills.",
  },
  {
    icon: Wallet,
    title: "Fast Payouts",
    description: "Receive payments via MPesa, PayPal, or bank transfer.",
  },
  {
    icon: Star,
    title: "Get Featured",
    description: "Top performers get featured in premium collections.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Portfolio",
    description: "Build your reputation and gain visibility.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Create Your Account",
    description: "Sign up and complete your basic profile information.",
  },
  {
    step: 2,
    title: "Upload Your Portfolio",
    description: "Showcase your best work with a professional portfolio.",
  },
  {
    step: 3,
    title: "Get Verified",
    description: "Our team reviews your work for quality approval.",
  },
  {
    step: 4,
    title: "Receive Job Invitations",
    description: "Get matched with projects that fit your skills.",
  },
  {
    step: 5,
    title: "Submit & Get Paid",
    description: "Complete assignments and receive secure payments.",
  },
];

const WHAT_WE_ACCEPT = [
  {
    icon: Video,
    title: "4K & HD Video Clips",
    description: "Professional video content up to 4K resolution.",
  },
  {
    icon: Camera,
    title: "Authentic African Imagery",
    description: "Original photos capturing African culture, landscapes, and life.",
  },
  {
    icon: MapPin,
    title: "Drone Footage",
    description: "Aerial shots and drone videography.",
  },
  {
    icon: Users,
    title: "Editorial & Lifestyle",
    description: "Professional editorial and lifestyle photography.",
  },
];

export default function ForCreativesPage() {
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
      <Section className="bg-gradient-to-b from-background to-muted/30 -mx-4 px-4 pt-16 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Earn from Your Creative Talent
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            Photographers and videographers across Kenya can join our platform 
            and access real jobs, training, and income opportunities.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=photographer">
              <Button size="lg" className="w-full sm:w-auto">
                Register Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* Benefits Section */}
      <Section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">What You Get</h2>
          <p className="mt-2 text-muted-foreground">
            Join our network and unlock a world of opportunities
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((benefit, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {benefit.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* How It Works Section */}
      <Section className="bg-muted/30 -mx-4 px-4" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="mt-2 text-muted-foreground">
              Get started in 5 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {HOW_IT_WORKS.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/register?role=photographer">
              <Button size="lg">
                Start Your Application
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* What We Accept Section */}
      <Section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">What We Accept</h2>
          <p className="mt-2 text-muted-foreground">
            Quality content from verified creators
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHAT_WE_ACCEPT.map((item, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Requirements Section */}
      <Section className="bg-muted/30 -mx-4 px-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Contributor Requirements</CardTitle>
              <CardDescription>
                To maintain quality, we require all contributors to meet these standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {[
                  "Valid ID for verification",
                  "Minimum 2 years of photography/videography experience",
                  "Professional-grade equipment",
                  "Ability to meet deadlines",
                  "Excellent communication skills",
                  "Willingness to undergo verification process",
                ].map((requirement, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* CTA Section */}
      <Section>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold">Ready to Start Earning?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join Kenya&apos;s fastest-growing creative network and turn your passion into profit.
          </p>
          <div className="mt-8">
            <Link href="/register?role=photographer">
              <Button size="lg">
                Apply Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </PageContainer>
  );
}
