import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PhotoCard } from "@/components/gallery/photo-card";
import { AISearchWrapper } from "@/components/gallery/ai-search-wrapper";
import { 
  Image as ImageIcon,
  Video,
} from "lucide-react";

// Categories from brief
const CATEGORIES = [
  { id: "all", name: "All Photos" },
  { id: "business", name: "Business & Workspaces" },
  { id: "urban", name: "African Urban Life" },
  { id: "rural", name: "Rural Life & Culture" },
  { id: "families", name: "Families & People" },
  { id: "agriculture", name: "Agriculture & Food Production" },
  { id: "travel", name: "Travel, Nature & Wildlife" },
  { id: "aerial", name: "Aerial/Drone Footage" },
  { id: "events", name: "Events, Celebrations & Community" },
  { id: "technology", name: "Technology & Innovation" },
  { id: "education", name: "Education & Learning" },
];

// Perfect For tags from brief
const PERFECT_FOR = [
  { id: "documentaries", name: "Documentaries" },
  { id: "advertisements", name: "Advertisements" },
  { id: "tourism", name: "Tourism Campaigns" },
  { id: "social", name: "Social Media Content" },
  { id: "corporate", name: "Corporate Storytelling" },
  { id: "education", name: "Education & Research" },
  { id: "personal", name: "Personal Collections" },
];

export const metadata = {
  title: "Stock Library - Authentic African Visuals, Ready to Use | Bits Photo Mart",
  description: "Discover thousands of high-quality African photos and videos curated from Kenya's landscapes, cultures, cities, people, wildlife and everyday life.",
};

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || "all";
  const search = params.search || "";

  // Build where clause for filtering
  const where: Record<string, unknown> = {
    status: "APPROVED",
  };

  if (category !== "all") {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { category: { contains: search.toLowerCase() } },
      { tags: { contains: search.toLowerCase() } },
    ];
  }

  // Fetch approved photos
  const photos = await prisma.photo.findMany({
    where,
    include: {
      photographer: {
        select: {
          id: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  // Convert Decimal to number for client components
  const photosWithNumberPrice = photos.map((photo) => ({
    ...photo,
    price: Number(photo.price),
    width: photo.width ?? undefined,
    height: photo.height ?? undefined,
    viewCount: photo.viewCount ?? 0,
    downloadCount: photo.downloadCount ?? 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50">
      {/* Hero/Header Section - From Brief */}
      <section className="bg-white border-b border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Authentic African Visuals, Ready to Use
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Discover thousands of high-quality African photos and videos curated from Kenya&apos;s 
            landscapes, cultures, cities, people, wildlife and everyday life.
          </p>
        </div>
      </section>

      {/* Perfect For Section - From Brief */}
      <section className="bg-white py-6 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Perfect For:</span>
            {PERFECT_FOR.map((tag) => (
              <Link
                key={tag.id}
                href={`/gallery?search=${tag.name}`}
                className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium hover:bg-amber-200 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filters - From Brief */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Stock Library</h1>
            
            {/* AI-Powered Search Bar */}
            <AISearchWrapper initialQuery={search} />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {CATEGORIES.map((cat) => {
              const isActive = category === cat.id;
              return (
                <Link
                  key={cat.id}
                  href={`/gallery?category=${cat.id}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
            <Link
              href="/gallery/videos"
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              <Video className="inline-block h-4 w-4 mr-1" />
              Videos
            </Link>
          </div>
        </div>
      </div>

      {/* Pricing Display - From Brief */}
      <section className="bg-slate-900 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-amber-400 font-bold text-lg">HD Clips</p>
              <p className="text-white">From KES1,000 – 3,000</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-amber-400 font-bold text-lg">4K Clips</p>
              <p className="text-white">From KES2,500 – 10,000</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-amber-400 font-bold text-lg">Photos</p>
              <p className="text-white">KES500 – 1,500</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-amber-400 font-bold text-lg">Extended Licenses</p>
              <p className="text-white">Request a quote</p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Count */}
      <div className="container mx-auto px-4 py-4">
        <p className="text-gray-600">
          {photos.length} photo{photos.length !== 1 ? "s" : ""} found
          {category !== "all" && ` in ${CATEGORIES.find(c => c.id === category)?.name}`}
          {search && ` matching "${search}"`}
        </p>
      </div>

      {/* Photo Grid */}
      {photosWithNumberPrice.length > 0 ? (
        <div className="container mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photosWithNumberPrice.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No photos found
            </h2>
            <p className="text-gray-500 mb-6">
              {search
                ? `No results for "${search}". Try a different search term.`
                : category !== "all"
                ? "No photos in this category yet."
                : "No photos available yet. Check back soon!"}
            </p>
            <Link href="/gallery">
              <Button className="bg-amber-600 hover:bg-amber-700">
                View All Photos
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Call to Action for Photographers */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Are you a photographer?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Join our community of photographers and start selling your photos today.
            Upload your best shots and earn money from every download.
          </p>
          <Link href="/for-creatives">
            <Button
              size="lg"
              className="bg-white text-amber-700 hover:bg-gray-100"
            >
              Become a Photographer
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
