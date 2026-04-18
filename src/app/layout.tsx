import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import Nav from "@/components/Nav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Recipes",
  description: "Our family recipe collection",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var s=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(s===null&&d)){document.documentElement.classList.add('dark')}})()` }} />
      </head>
      <body className="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 antialiased min-h-screen">
        <SessionProvider>
          <Nav />
          {children}
          <ServiceWorkerRegister />
        </SessionProvider>
      </body>
    </html>
  );
}
