import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { CartContent } from "@/components/cart/cart-content";

export default async function CartPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect("/login");
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: {
      photo: {
        include: {
          photographer: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Convert Decimal to number for client component
  const serializedItems = cartItems.map((item) => ({
    ...item,
    photo: {
      ...item.photo,
      price: Number(item.photo.price),
      photographer: {
        ...item.photo.photographer,
        totalEarnings: Number(item.photo.photographer.totalEarnings),
      },
    },
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/gallery">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Gallery
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                Shopping Cart
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <CartContent initialItems={serializedItems} />
      </div>
    </div>
  );
}
