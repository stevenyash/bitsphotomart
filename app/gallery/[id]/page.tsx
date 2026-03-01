"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AntiPiracyImage } from '@/components/gallery/anti-piracy-image';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Download, 
  Camera, 
  Calendar,
  User,
  Star,
  Loader2
} from 'lucide-react';

interface PhotoData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string | null;
  thumbnailUrl: string;
  watermarkUrl: string | null;
  width: number | null;
  height: number | null;
  price: number;
  licenseType: string;
  createdAt: string;
  photographer: {
    id: string;
    user: {
      name: string | null;
    };
    rating: number;
  } | null;
}

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string | null;
    avatar: string | null;
  };
}

export default function PhotoDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [photo, setPhoto] = useState<PhotoData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    async function fetchData() {
      try {
        const response = await fetch(`/api/photos/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Photo not found');
          } else {
            setError('Failed to load photo');
          }
          return;
        }
        const data = await response.json();
        setPhoto(data.photo);
        setReviews(data.reviews || []);
      } catch (err) {
        setError('Failed to load photo');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-600 mb-4">{error || 'Photo not found'}</p>
        <Link href="/gallery">
          <Button>Back to Gallery</Button>
        </Link>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link 
            href="/gallery" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Photo Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <AntiPiracyImage showWatermark={true}>
                <img
                  src={photo.watermarkUrl || photo.thumbnailUrl}
                  alt={photo.title}
                  className="w-full h-auto"
                  draggable={false}
                />
              </AntiPiracyImage>
            </div>

            {/* Photo Actions */}
            <div className="mt-4 flex gap-4">
              <AddToCartButton 
                photoId={photo.id} 
                price={photo.price}
                licenseType={photo.licenseType === "EXTENDED" ? "EXTENDED" : "STANDARD"}
              />
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Wishlist
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Photo Details */}
          <div className="space-y-6">
            {/* Title & Photographer */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h1 className="text-2xl font-bold text-gray-900">{photo.title}</h1>
              
              <div className="mt-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {photo.photographer?.user?.name || 'Unknown Photographer'}
                  </p>
                  {photo.photographer && (
                    <Link 
                      href={`/photographers/${photo.photographer.id}`}
                      className="text-sm text-amber-600 hover:text-amber-700"
                    >
                      View Profile
                    </Link>
                  )}
                </div>
              </div>

              {/* Rating */}
              {reviews.length > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= avgRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {avgRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">License & Pricing</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Standard License</p>
                    <p className="text-sm text-gray-500">Web use, social media</p>
                  </div>
                  <p className="text-xl font-bold text-amber-600">
                    KES {photo.price.toLocaleString()}
                  </p>
                </div>
                
                {photo.licenseType === 'EXTENDED' && (
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Extended License</p>
                      <p className="text-sm text-gray-500">Commercial use, prints</p>
                    </div>
                    <p className="text-xl font-bold text-amber-600">
                      KES {(photo.price * 5).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <Button className="w-full mt-4" size="lg">
                <Download className="h-5 w-5 mr-2" />
                Buy Now
              </Button>
            </div>

            {/* Photo Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo Details</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <Camera className="h-4 w-4" />
                  <span>Category: {photo.category}</span>
                </div>
                
                {photo.width && photo.height && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <span className="font-medium">Dimensions:</span>
                    <span>{photo.width} x {photo.height} px</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Uploaded: {new Date(photo.createdAt).toLocaleDateString()}</span>
                </div>

                {photo.tags && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {photo.tags.split(',').map((tag) => (
                      <span 
                        key={tag} 
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {photo.description && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-600">{photo.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{review.user.name || 'Anonymous'}</p>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {review.comment && (
                    <p className="mt-2 text-gray-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
