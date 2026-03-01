"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/providers/cart-provider";

export function CartIcon() {
  const { count } = useCart();

  return (
    <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
      <ShoppingCart className="w-5 h-5 text-gray-700" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
