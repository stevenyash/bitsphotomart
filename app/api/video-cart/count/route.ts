import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get video cart count
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ count: 0 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.videoCartItem.count({
      where: { userId: user.id },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching video cart count:", error);
    return NextResponse.json({ count: 0 });
  }
}
