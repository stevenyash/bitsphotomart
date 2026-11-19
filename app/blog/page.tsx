/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, ArrowLeft } from 'lucide-react';

// Blog post type
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  featuredImage?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  category?: string;
  coverImage?: string;
  featured?: boolean;
}

// Sample blog data (fallback when API is unavailable)
const samplePosts: BlogPost[] = [
  {
    id: '1',
    title: 'Welcome to Bits Photo Mart',
    slug: 'welcome-to-bits-photo-mart',
    excerpt: 'Discover the premier marketplace for high-quality photography and videography in Kenya.',
    content: 'Welcome to Bits Photo Mart, your premier destination for discovering and purchasing exceptional photography and videography. Our platform connects talented photographers with businesses and individuals seeking premium visual content.',
    coverImage: '/blog/welcome.jpg',
    author: 'BPM Team',
    category: 'Announcements',
    publishedAt: '2026-02-15',
    featured: true,
  },
  {
    id: '2',
    title: 'Top 10 Photography Tips for Beginners',
    slug: 'photography-tips-beginners',
    excerpt: 'Learn the essential tips and tricks to improve your photography skills.',
    content: 'Whether you are just starting out or looking to refine your skills, these tips will help you capture better photos.',
    coverImage: '/blog/tips.jpg',
    author: 'John Kamau',
    category: 'Tutorials',
    publishedAt: '2026-02-10',
    featured: true,
  },
  {
    id: '3',
    title: 'The Rise of Drone Photography in Kenya',
    slug: 'drone-photography-kenya',
    excerpt: 'Explore how drone photography is transforming the visual industry.',
    content: 'Drone photography has opened up new perspectives for capturing breathtaking aerial shots.',
    coverImage: '/blog/drone.jpg',
    author: 'Sarah Ochieng',
    category: 'Industry News',
    publishedAt: '2026-02-05',
    featured: false,
  },
  {
    id: '4',
    title: 'Behind the Scenes: Event Photography',
    slug: 'behind-scenes-event-photography',
    excerpt: 'What happens during a professional event photography shoot.',
    content: 'Ever wondered what goes into capturing the perfect event? Let us take you behind the scenes.',
    coverImage: '/blog/events.jpg',
    author: 'Mike Wanjala',
    category: 'Behind the Scenes',
    publishedAt: '2026-01-28',
    featured: false,
  },
];

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFullPost, setShowFullPost] = useState<BlogPost | null>(null);
  const selectedPost = showFullPost;

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/blog');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setPosts(data);
        } else {
          setPosts(samplePosts as any);
        }
      } else {
        setPosts(samplePosts as any);
      }
    } catch (error) {
      console.log('Using sample posts');
      setPosts(samplePosts as any);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Map API posts to display format
  const displayPosts = posts.map(p => ({
    ...p,
    category: 'Blog',
    featured: false,
    coverImage: p.featuredImage || '',
    publishedAt: p.publishedAt ? formatDate(p.publishedAt) : (p.createdAt ? formatDate(p.createdAt) : ''),
  }));

  const categories = ['All', ...new Set(displayPosts.map(p => p.category))];

  const filteredPosts = selectedCategory === 'All' 
    ? displayPosts 
    : displayPosts.filter(p => p.category === selectedCategory);

  const featuredPost = displayPosts.find(p => p.featured) || displayPosts[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Bits Photo Mart Blog</h1>
          <p className="text-lg text-muted-foreground">News, tutorials, and insights from the world of photography</p>
        </div>

        {/* Featured Post */}
        {featuredPost && !showFullPost && (
          <div className="mb-12 bg-card rounded-2xl shadow-lg overflow-hidden">
            <Link href={`/blog/${featuredPost.slug}`}>
              <div className="md:flex cursor-pointer hover:opacity-95 transition-opacity">
                <div className="md:w-1/2 bg-primary min-h-[300px] flex items-center justify-center">
                  {featuredPost.coverImage ? (
                    <img src={featuredPost.coverImage} alt={featuredPost.title} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-16 h-16 text-primary-foreground" />
                  )}
                </div>
                <div className="md:w-1/2 p-8">
                  <span className="inline-block bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm mb-4">
                    Featured
                  </span>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{featuredPost.title}</h2>
                  <p className="text-muted-foreground mb-4">{featuredPost.excerpt}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>{featuredPost.author}</span>
                    <span className="mx-2">•</span>
                    <span>{featuredPost.publishedAt}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Category Filter */}
        {!showFullPost && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Selected Post View */}
        {selectedPost && (
          <div className="bg-card rounded-2xl shadow-lg p-8 mb-8">
            <button 
              onClick={() => setShowFullPost(null)}
              className="text-primary hover:underline mb-4"
            >
              ← Back to Blog
            </button>
            <span className="inline-block bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm mb-4">
              {selectedPost.category}
            </span>
            <h1 className="text-3xl font-bold text-foreground mb-4">{selectedPost.title}</h1>
            <div className="flex items-center text-sm text-muted-foreground mb-6">
              <span>By {selectedPost.author}</span>
              <span className="mx-2">•</span>
              <span>{selectedPost.publishedAt}</span>
            </div>
            <div className="bg-muted rounded-xl h-64 flex items-center justify-center mb-6">
              <Camera className="w-16 h-16 text-muted-foreground" />
            </div>
            <div className="prose max-w-none">
              <p className="text-foreground leading-relaxed">{selectedPost.content}</p>
              <p className="text-foreground leading-relaxed mt-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          </div>
        )}

        {/* Blog Grid */}
        {!selectedPost && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map(post => (
              <article 
                key={post.id} 
                className="bg-card rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setShowFullPost(post)}
              >
                <div className="bg-muted h-48 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="p-6">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    {post.category}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-2 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>{post.author}</span>
                    <span className="mx-2">•</span>
                    <span>{post.publishedAt}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {filteredPosts.length === 0 && !selectedPost && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
