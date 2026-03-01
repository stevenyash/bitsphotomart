import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Image as ImageIcon,
  Video,
  Camera,
  User,
  Play,
  Clock,
  Monitor,
  Film
} from "lucide-react";

// Video categories for filtering
const VIDEO_CATEGORIES = [
  { id: "all", name: "All Videos", icon: Video },
  { id: "drone", name: "Drone/Aerial", icon: Film },
  { id: "wildlife", name: "Wildlife", icon: Camera },
  { id: "urban", name: "Urban/City", icon: Monitor },
  { id: "culture", name: "Culture & People", icon: User },
  { id: "nature", name: "Nature/Landscapes", icon: Camera },
  { id: "business", name: "Business/Corporate", icon: Monitor },
  { id: "events", name: "Events/Celebrations", icon: Camera },
  { id: "lifestyle", name: "Lifestyle", icon: User },
];

// Video quality labels
const QUALITY_LABELS: Record<string, string> = {
  SD: "SD (480p)",
  HD: "HD (720p)",
  FULL_HD: "Full HD (1080p)",
  UHD_4K: "4K Ultra HD",
  UHD_8K: "8K Ultra HD",
};

// Format duration in seconds to MM:SS or HH:MM:SS
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default async function VideoGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; quality?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || "all";
  const search = params.search || "";
  const quality = params.quality || "all";

  // Build where clause for filtering
  const where: Record<string, unknown> = {
    status: "APPROVED",
  };

  if (category !== "all") {
    where.category = category;
  }

  if (quality !== "all") {
    where.quality = quality;
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { tags: { has: search.toLowerCase() } },
    ];
  }

  // Fetch approved videos
  const videos = await prisma.video.findMany({
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
  const videosWithNumberPrice = videos.map((video) => ({
    ...video,
    price: Number(video.price),
    width: video.width ?? undefined,
    height: video.height ?? undefined,
    duration: video.duration ?? 0,
    viewCount: video.viewCount ?? 0,
    downloadCount: video.downloadCount ?? 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Video Library</h1>
              <span className="text-sm text-gray-500">Stock Footage</span>
            </div>
            
            {/* Search Bar */}
            <form className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search videos..."
                  defaultValue={search}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {VIDEO_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = category === cat.id;
              return (
                <Link
                  key={cat.id}
                  href={`/gallery/videos?category=${cat.id}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {cat.name}
                </Link>
              );
            })}
          </div>

          {/* Quality Filter */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-gray-600">Quality:</span>
            {["all", "HD", "FULL_HD", "UHD_4K"].map((q) => (
              <Link
                key={q}
                href={`/gallery/videos?category=${category}&quality=${q}`}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  quality === q
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {q === "all" ? "All" : QUALITY_LABELS[q] || q}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="container mx-auto px-4 py-4">
        <p className="text-gray-600">
          {videos.length} video{videos.length !== 1 ? "s" : ""} found
          {category !== "all" && ` in ${VIDEO_CATEGORIES.find(c => c.id === category)?.name}`}
          {quality !== "all" && ` in ${QUALITY_LABELS[quality] || quality}`}
          {search && ` matching "${search}"`}
        </p>
      </div>

      {/* Video Grid */}
      {videosWithNumberPrice.length > 0 ? (
        <div className="container mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videosWithNumberPrice.map((video) => (
              <Link
                key={video.id}
                href={`/gallery/videos/${video.id}`}
                className="group block"
              >
                <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-gray-900">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-6 w-6 text-blue-600 ml-1" />
                      </div>
                    </div>
                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(video.duration)}
                    </div>
                    {/* Quality Badge */}
                    {video.quality && video.quality !== "HD" && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        {video.quality}
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {video.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-gray-500">
                        by {video.photographer?.user?.name || "Unknown"}
                      </span>
                      <span className="font-bold text-blue-600">
                        KES {video.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No videos found
            </h2>
            <p className="text-gray-500 mb-6">
              {search
                ? `No results for "${search}". Try a different search term.`
                : category !== "all"
                ? "No videos in this category yet."
                : "No videos available yet. Check back soon!"}
            </p>
            <Link href="/gallery/videos">
              <Button className="bg-blue-600 hover:bg-blue-700">
                View All Videos
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Call to Action for Photographers */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Are you a videographer?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Join our community of videographers and start selling your footage today.
            Upload your best clips and earn money from every download.
          </p>
          <Link href="/register/photographer">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-gray-100"
            >
              Become a Contributor
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
