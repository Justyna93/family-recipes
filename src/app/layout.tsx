import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Recipes",
  description: "Our family recipe collection",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Family Recipes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#d97706",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 antialiased min-h-screen">
        <SessionProvider>
          <Nav />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
