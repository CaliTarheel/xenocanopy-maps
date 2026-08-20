import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://xenocanopy-maps.srider.chatgpt.site"),
  title: "Xenocanopy — Alien Jungle Battlemap Generator",
  description: "Generate low-level alien-jungle encounters with forced-movement terrain and Roll20-ready PNG maps.",
  openGraph: {
    title: "Xenocanopy — Make the Jungle Fight Back",
    description: "Generate alien-jungle tactical maps with dangerous terrain, forced-movement opportunities, and Roll20-ready exports.",
    type: "website",
    images: [{ url: "/og.png", width: 1672, height: 939, alt: "Xenocanopy alien-jungle tactical map generator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Xenocanopy — Make the Jungle Fight Back",
    description: "Procedural alien-jungle tactical maps for revised fifth-edition play.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
