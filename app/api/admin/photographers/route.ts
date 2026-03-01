import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { PhotographerStatus } from "../../../../generated/prisma/client";

// GET - Get pending photographer applications
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const photographers = await prisma.photographer.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal fields
    const serializedPhotographers = photographers.map((p) => ({
      ...p,
      totalEarnings: Number(p.totalEarnings),
      createdAt: p.createdAt?.toISOString() || null,
      updatedAt: p.updatedAt?.toISOString() || null,
      user: p.user ? {
        ...p.user,
        createdAt: p.user.createdAt?.toISOString() || null,
        updatedAt: p.user.updatedAt?.toISOString() || null,
      } : undefined,
    }));

    return NextResponse.json(serializedPhotographers);
  } catch (error) {
    console.error("Error fetching photographers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Approve or reject photographer
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { photographerId, action, notes } = body;

    if (!photographerId || !action) {
      return NextResponse.json({ error: "photographerId and action are required" }, { status: 400 });
    }

    if (!["APPROVE", "REJECT", "SUSPEND"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const statusMap = {
      APPROVE: PhotographerStatus.APPROVED,
      REJECT: PhotographerStatus.REJECTED,
      SUSPEND: PhotographerStatus.SUSPENDED,
    };

    const photographer = await prisma.photographer.update({
      where: { id: photographerId },
      data: {
        status: statusMap[action as keyof typeof statusMap],
      },
      include: {
        user: true,
      },
    });

    // If approved, update user role to PHOTOGRAPHER and mark as verified
    if (action === "APPROVE") {
      await prisma.user.update({
        where: { id: photographer.userId },
        data: { 
          role: "PHOTOGRAPHER",
          isVerified: true 
        },
      });
      
      // Also mark the photographer's ID as verified
      await prisma.photographer.update({
        where: { id: photographerId },
        data: { idVerified: true },
      });
      
      // Send approval email notification
      try {
        await sendEmail({
          to: photographer.user.email,
          subject: "🎉 Your Photographer Application has been Approved!",
          html: getPhotographerApprovalEmailHtml(
            photographer.user.name || "Photographer",
            "APPROVED"
          ),
        });
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
      }
    }
    
    // If rejected, send rejection email
    if (action === "REJECT") {
      try {
        await sendEmail({
          to: photographer.user.email,
          subject: "Update on Your Photographer Application",
          html: getPhotographerApprovalEmailHtml(
            photographer.user.name || "Photographer",
            "REJECTED",
            notes
          ),
        });
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }
    }

    return NextResponse.json(photographer);
  } catch (error) {
    console.error("Error updating photographer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Email template for photographer status notifications
function getPhotographerApprovalEmailHtml(name: string, status: string, notes?: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  if (status === "APPROVED") {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations, ${name}!</h1>
          </div>
          <div class="content">
            <h2>Your Photographer Application has been Approved!</h2>
            <p>We are thrilled to inform you that your photographer application to join Bits Photo Mart has been <strong>approved</strong>.</p>
            <p>You now have access to:</p>
            <ul>
              <li>Upload and sell your photos on our marketplace</li>
              <li>Track your sales and earnings in your dashboard</li>
              <li>Request payouts directly to your M-Pesa or bank account</li>
              <li>View analytics on your photo performance</li>
            </ul>
            <a href="${appUrl}/photographer/upload" class="button">
              Start Uploading Photos
            </a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Bits Photo Mart Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6B7280; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Update on Your Application</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>We regret to inform you that your photographer application to join Bits Photo Mart has been <strong>not been approved</strong> at this time.</p>
            ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ""}
            <p>This doesn't mean you can't try again in the future. Please review our requirements and feel free to apply again.</p>
            <p>If you have any questions or would like more information, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Bits Photo Mart Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
