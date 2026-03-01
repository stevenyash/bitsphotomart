import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to register as a photographer" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bio, portfolio, location, skills, idNumber } = body;

    // Get the user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { photographer: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is already a photographer
    if (user.photographer) {
      return NextResponse.json(
        { error: "You are already registered as a photographer" },
        { status: 400 }
      );
    }

    // Create photographer profile
    const photographer = await prisma.photographer.create({
      data: {
        userId: user.id,
        bio,
        portfolio,
        location,
        skills,
        idNumber,
        status: "PENDING",
      },
    });

    // Update user role to PHOTOGRAPHER
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "PHOTOGRAPHER" },
    });

    return NextResponse.json(
      { 
        message: "Photographer registration submitted successfully. Your account is pending approval.",
        photographer: { id: photographer.id, status: photographer.status }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Photographer registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
