import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { Analytics } from "@/components/Analytics";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MAKT Event - Masjid Agung Kubah Timah",
  description: "Pusat Layanan Kegiatan, Agenda Dakwah & Peminjaman Fasilitas Masjid Agung Kubah Timah Pangkalpinang.",
  icons: {
    icon: "/logo-makt-full.png?v=5",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <head>
        <link rel="icon" href="/logo-makt-full.png?v=5" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans bg-[#F8FAF8] text-[#111C2D] antialiased selection:bg-[#FED65B] selection:text-[#241A00]">
        {children}
        <Analytics />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
