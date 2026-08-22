import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.pidge.dating"),
  title: "Pidge — People nearby",
  description: "Meet adults nearby. 18+ dating grid sorted by your location.",
  manifest: "/manifest.webmanifest",
  applicationName: "Pidge",
  appleWebApp: { capable: true, title: "Pidge", statusBarStyle: "black-translucent" },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("dark font-sans", geist.variable)}>
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
