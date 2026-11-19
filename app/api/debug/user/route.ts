import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Debug endpoint to find a user by email
 * Usage: /api/debug/user?email=your@email.com
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({
      error: 'Email parameter required',
      usage: '/api/debug/user?email=your@email.com'
    }, { status: 400 });
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        isVerified: true,
        createdAt: true,
      }
    });
    
    if (!user) {
      return NextResponse.json({
        found: false,
        message: `No user found with email: ${email}`,
        suggestion: 'The user may not exist in the database. Check if you need to run seed or create the user.'
      });
    }
    
    // Return user info (without full password hash for security)
    return NextResponse.json({
      found: true,
      user: {
        ...user,
        password: user.password ? '[HASHED]' : null,
        passwordLength: user.password?.length
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
