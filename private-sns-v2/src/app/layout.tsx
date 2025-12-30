import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Providers } from './providers'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "東葛 Dolphins B.B.C.",
  description: "東葛飾高校ドルフィンズバスケットボールクラブ - プライベートSNS",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/logo-circle.png",
    apple: "/images/logo-circle.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "東葛 Dolphins",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
