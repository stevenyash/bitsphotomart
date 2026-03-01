import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers/session-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import ChatlingChatbot from "@/components/chat/chatling-chatbot";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Bits Photo Mart - Your Nationwide Creative Media Network",
  description: "Connect with verified photographers and videographers across Kenya. Stock photos, event coverage, documentaries, and more.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body
        className={`${inter.variable} antialiased min-h-screen flex flex-col overflow-x-hidden`}
      >
        <Providers>
          <CartProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <ChatlingChatbot />
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
