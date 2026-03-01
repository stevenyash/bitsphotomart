'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Image as ImageIcon, CreditCard, ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/providers/cart-provider';

interface Photo {
  id: string;
  title: string;
  originalUrl: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  price: any;
  photographer: {
    user: {
      name: string | null;
    };
  };
}

interface CartItem {
  id: string;
  photoId: string;
  photo: Photo;
}

interface CartContentProps {
  initialItems: CartItem[];
}

export function CartContent({ initialItems }: CartContentProps) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const { refreshCount } = useCart();

  const total = items.reduce((sum, item) => sum + Number(item.photo.price), 0);

  const handleDelete = async (itemId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setItems((prev) => prev.filter((item) => item.id !== itemId));
          // Update the cart count in header immediately
          await refreshCount();
        }
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
        <p className="text-gray-500 mb-6">Start shopping to add items to your cart</p>
        <Link href="/gallery">
          <Button>Browse Gallery</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm p-4 flex gap-4"
          >
            <div className="relative w-32 h-32 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
              {item.photo.originalUrl ? (
                <Image
                  src={item.photo.originalUrl}
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
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {item.photo.title}
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                by {item.photo.photographer.user.name || 'Unknown'}
              </p>
              <p className="text-lg font-bold text-amber-700">
                KES {Number(item.photo.price).toLocaleString()}
              </p>
            </div>
            
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Items ({items.length})</span>
              <span>KES {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Processing Fee</span>
              <span>KES 0</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>KES {total.toLocaleString()}</span>
            </div>
          </div>

          <Link href="/checkout" className="block">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Checkout
            </Button>
          </Link>

          <div className="mt-4 text-center">
            <Link href="/gallery" className="text-sm text-amber-700 hover:underline">
              Continue Shopping
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t text-xs text-gray-500">
            <p>Secure checkout powered by M-Pesa</p>
            <p className="mt-1">You will receive a payment prompt on your phone</p>
          </div>
        </div>
      </div>
    </div>
  );
}
