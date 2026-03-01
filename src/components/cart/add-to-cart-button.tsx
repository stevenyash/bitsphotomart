"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";

interface AddToCartButtonProps {
  photoId: string;
  price: number;
  licenseType?: "STANDARD" | "EXTENDED";
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export function AddToCartButton({
  photoId,
  price,
  licenseType = "STANDARD",
  variant = "default",
  size = "sm",
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { refreshCount } = useCart();

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoId,
          licenseType,
        }),
      });

      if (response.ok) {
        setIsAdded(true);
        // Update the cart count in header immediately
        await refreshCount();
        // Reset the "added" state after 2 seconds
        setTimeout(() => {
          setIsAdded(false);
        }, 2000);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
      alert("Failed to add to cart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isAdded) {
    return (
      <Button variant="outline" size={size} className="bg-green-50 border-green-200 text-green-600" disabled>
        <Check className="w-4 h-4 mr-1" />
        Added
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCart}
      disabled={isLoading}
      className={variant === "default" ? "bg-amber-600 hover:bg-amber-700" : ""}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
      ) : (
        <ShoppingCart className="w-4 h-4 mr-1" />
      )}
      Add to Cart
    </Button>
  );
}
