import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {prisma} from "@/lib/prisma";
import { checkRateLimit, RATE_LIMITS, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Apply rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`register:${clientIp}`, RATE_LIMITS.AUTH);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, password, phone, referralCode } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Find marketer by referral code
    let marketerProfile = null;
    if (referralCode) {
      marketerProfile = await prisma.marketerProfile.findUnique({
        where: { referralCode },
        include: { user: true },
      });
      
      // Only allow referral from active marketers
      if (marketerProfile && marketerProfile.status !== 'ACTIVE') {
        marketerProfile = null;
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "USER",
      },
    });

    // Create referral record if valid referral code was provided
    if (marketerProfile) {
      await prisma.marketerReferral.create({
        data: {
          marketerId: marketerProfile.id,
          referredUserId: user.id,
          referralCode: referralCode,
          referralSource: 'website',
          status: 'PENDING',
        },
      });
      
      // Update marketer's active clients count
      await prisma.marketerProfile.update({
        where: { id: marketerProfile.id },
        data: {
          activeClients: { increment: 1 },
        },
      });
    }

    return NextResponse.json(
      { 
        message: "User created successfully", 
        user: { id: user.id, email: user.email },
        referred: !!marketerProfile,
        referredBy: marketerProfile ? marketerProfile.user.name || marketerProfile.user.email : null
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
