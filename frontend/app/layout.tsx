import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "../components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: "Droplet",
  description: "Distilled AI for your Business",
  icons: {
    icon: '/whiteD.png',
    shortcut: '/whiteD.png',
    apple: '/whiteD.png',
  },
  other: {
    // Preload critical resources
    'preload-image-1': '<link rel="preload" as="image" href="/D.png">',
    'preload-image-2': '<link rel="preload" as="image" href="/whiteD.png">',
    // DNS prefetch for external resources
    'dns-prefetch-1': '<link rel="dns-prefetch" href="https://fonts.googleapis.com">',
    'dns-prefetch-2': '<link rel="dns-prefetch" href="https://fonts.gstatic.com">',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
