// Email utility for sending notifications
// Uses nodemailer with SMTP for transactional emails

import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create email transporter with SMTP configuration
function createTransporter() {
  console.log("📧 Creating email transporter with config:", {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USERNAME,
  });

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "linkpalbitsonline.co.ke",
    port: parseInt(process.env.EMAIL_PORT || "465"),
    secure: true, // Use SSL/TLS for port 465
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USERNAME || "noreply@linkpalbitsonline.co.ke",
      pass: process.env.EMAIL_PASSWORD || "Bits0nline@21",
    },
    debug: true,
    logger: true,
  });

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options;

  // Check if we should send emails
  const shouldSend = process.env.EMAIL_SEND === "true" || process.env.NODE_ENV === "production";

  console.log("📧 Email send check:", {
    shouldSend,
    EMAIL_SEND: process.env.EMAIL_SEND,
    NODE_ENV: process.env.NODE_ENV,
    to,
    subject,
  });

  if (!shouldSend) {
    console.log("📧 [DEV] Email would be sent (set EMAIL_SEND=true to enable)");
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    return true;
  }

  try {
    const transporter = createTransporter();

    // Verify connection first
    console.log("📧 Verifying SMTP connection...");
    await transporter.verify();
    console.log("📧 SMTP connection verified");

    // Send email
    console.log("📧 Sending email...");
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_SENDERNAME || "Linkpal Bits Online Team"}" <${process.env.EMAIL_SENDER || "noreply@linkpalbitsonline.co.ke"}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    console.log("📧 Email sent successfully! MessageId:", info.messageId);
    return true;
  } catch (error) {
    console.error("📧 Error sending email:", error);
    return false;
  }
}

// Welcome email template
export function getWelcomeEmailHtml(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Bits Photo Mart!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Welcome to Bits Photo Mart - your premier marketplace for stunning photography!</p>
          <p>We're excited to have you join our community of photography enthusiasts and professionals.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" class="button">
            Start Exploring
          </a>
          <p>With your account, you can:</p>
          <ul>
            <li>Browse thousands of high-quality photos</li>
            <li>Purchase licenses for commercial or personal use</li>
            <li>Save your favorite photos for later</li>
          </ul>
          <p>If you have any questions, feel free to reply to this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Bits Photo Mart. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Password Reset Email Template
export function getPasswordResetEmailHtml(
  name: string,
  resetLink: string,
  expiresInHours: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 12px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>We received a request to reset your Bits Photo Mart password.</p>
          <p>Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">
              Reset Password
            </a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>This link will expire in ${expiresInHours} hours</li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; font-size: 12px; color: #6b7280;">${resetLink}</p>
          
          <p>If you have any questions, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Bits Photo Mart. All rights reserved.</p>
          <p>This email was sent to you because of a password reset request.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetLink = `${appUrl}/reset-password?token=${resetToken}`;
  const expiresInHours = 1;

  const html = getPasswordResetEmailHtml(name, resetLink, expiresInHours);

  return sendEmail({
    to: email,
    subject: "Reset Your Password - Bits Photo Mart",
    html,
  });
}

// Order Confirmation Email Template
function getOrderConfirmationEmailHtml(
  orderNumber: string,
  customerName: string,
  items: Array<{ title: string; licenseType: string; price: string }>,
  total: string,
  paymentMethod: string,
  appUrl: string
): string {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.title}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.licenseType}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.price}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #10b981; margin: 0;">✓ Payment Successful!</h1>
        </div>
        
        <p>Dear ${customerName},</p>
        
        <p>Thank you for your purchase! We're pleased to confirm that your order has been successfully processed.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Order Number:</strong> ${orderNumber}</p>
          <p style="margin: 5px 0 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
        </div>
        
        <h3 style="color: #333; margin-top: 30px;">Order Details</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #10b981; color: white;">
              <th style="padding: 12px; text-align: left;">Item</th>
              <th style="padding: 12px; text-align: left;">License</th>
              <th style="padding: 12px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr>
              <td colspan="2" style="padding: 12px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 12px; text-align: right;"><strong>${total}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <p style="margin-top: 30px;">
          You can download your purchased items from your 
          <a href="${appUrl}/dashboard/purchases" style="color: #10b981; text-decoration: none;">
            dashboard
          </a>.
        </p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            If you have any questions, please contact us at <a href="mailto:info@bitsphotomart.com" style="color: #10b981;">info@bitsphotomart.com</a>
          </p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Bits Photo Mart. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(
  orderId: string,
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  items: Array<{ title: string; licenseType: string; price: number }>,
  total: number,
  paymentMethod: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const formattedItems = items.map((item) => ({
    title: item.title,
    licenseType: item.licenseType,
    price: `KES ${item.price.toLocaleString()}`,
  }));

  const html = getOrderConfirmationEmailHtml(
    orderNumber,
    customerName,
    formattedItems,
    `KES ${total.toLocaleString()}`,
    paymentMethod,
    appUrl
  );

  return sendEmail({
    to: customerEmail,
    subject: `Order Confirmed - ${orderNumber} - Bits Photo Mart`,
    html,
  });
}
