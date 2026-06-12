import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import AuthProvider from "@/app/components/AuthProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PulseReach — AI-Native Marketing CRM",
  description:
    "AI-powered CRM and marketing automation platform. An intelligent Mini CRM for D2C brands. Create audience segments, launch personalized campaigns, and track performance — all through a conversational AI copilot.",
  keywords: [
    "CRM",
    "marketing",
    "AI",
    "D2C",
    "customer engagement",
    "campaigns",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
