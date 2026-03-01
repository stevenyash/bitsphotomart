"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WatermarkImage } from "@/components/gallery/watermark-image";

interface PhotoCardProps {
  photo: {
    id: string;
    title: string;
    price: number;
    thumbnailUrl: string | null;
    licenseType: string;
    photographer?: {
      user?: {
        name: string | null;
      };
    } | null;
  };
}

export function PhotoCard({ photo }: PhotoCardProps) {
  return (
    <Link
      href={`/gallery/${photo.id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100">
        <WatermarkImage showWatermark={true}>
          {photo.thumbnailUrl ? (
            <img
              src={photo.thumbnailUrl}
              alt={photo.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingCart className="h-12 w-12" />
            </div>
          )}
        </WatermarkImage>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="text-white font-medium">
              KES {photo.price.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <button 
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  // Handle like/favorite
                }}
              >
                <Heart className="h-4 w-4 text-white" />
              </button>
              <div onClick={(e) => e.preventDefault()}>
                <AddToCartButton 
                  photoId={photo.id} 
                  price={photo.price}
                  licenseType={photo.licenseType === "EXTENDED" ? "EXTENDED" : "STANDARD"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">
          {photo.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          by {photo.photographer?.user?.name || "Unknown"}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-amber-600 font-bold">
            KES {photo.price.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400 uppercase">
            {photo.licenseType}
          </span>
        </div>
      </div>
    </Link>
  );
}
