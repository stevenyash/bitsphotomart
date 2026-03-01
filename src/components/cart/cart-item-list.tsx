"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CartItem {
  id: string;
  licenseType: string;
  createdAt: Date;
  photo: {
    id: string;
    title: string;
    imageUrl: string;
    price: import("@prisma/client").Prisma.Decimal;
    photographer: {
      user: {
        name: string | null;
      };
    };
  };
}

interface CartItemListProps {
  items: CartItem[];
}

export function CartItemList({ items: initialItems }: CartItemListProps) {
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (itemId: string) => {
    setDeletingId(itemId);
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        startTransition(() => {
          setItems((prev) => prev.filter((item) => item.id !== itemId));
        });
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.photo.price);
  }, 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Browse our photo gallery and add some photos to your cart</p>
        <Link href="/gallery" className="text-amber-600 hover:text-amber-700 font-medium">
          Browse Gallery
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-sm p-4 flex gap-4"
          >
            {/* Photo Thumbnail */}
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
              {item.photo.imageUrl ? (
                <Image
                  src={item.photo.imageUrl}
                  alt={item.photo.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Photo Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {item.photo.title}
              </h3>
              <p className="text-sm text-gray-500">
                by {item.photo.photographer.user.name || "Unknown"}
              </p>
              <span className="inline-block mt-1 text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                {item.licenseType} License
              </span>
            </div>

            {/* Price & Remove */}
            <div className="flex flex-col items-end justify-between">
              <span className="font-bold text-amber-600">
                KES {Number(item.photo.price).toLocaleString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Items ({items.length})</span>
              <span className="font-medium">KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Standard License</span>
              <span className="font-medium">
                {items.filter(i => i.licenseType === "STANDARD").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Extended License</span>
              <span className="font-medium">
                {items.filter(i => i.licenseType === "EXTENDED").length}
              </span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-amber-600">KES {subtotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Link href="/checkout">
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={items.length === 0}
              >
                <span>Proceed to Checkout</span>
              </Button>
            </Link>
            <p className="text-xs text-gray-500 text-center">
              Secure payment via M-Pesa STK Push
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
