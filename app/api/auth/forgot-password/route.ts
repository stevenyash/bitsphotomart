import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomBytes } from "crypto";

// POST /api/auth/forgot-password
// Request password reset email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Find user by email (case-insensitive)
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a password reset link will be sent" },
        { status: 200 }
      );
    }

    // Delete any existing password reset tokens for this email
    await prisma.passwordReset.deleteMany({
      where: { email: normalizedEmail },
    });

    // Generate secure reset token
    const resetToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await prisma.passwordReset.create({
      data: {
        email: normalizedEmail,
        token: resetToken,
        expiresAt,
      },
    });

    // Get user's name for the email
    const userName = user.name || "Customer";

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(
      normalizedEmail,
      userName,
      resetToken
    );

    if (!emailSent) {
      console.error("Failed to send password reset email");
      // Still return success to not leak information
    }

    return NextResponse.json(
      { message: "If an account exists, a password reset link will be sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
