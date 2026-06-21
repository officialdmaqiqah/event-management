import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { Analytics } from "@/components/Analytics";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MAKT Event Management",
  description: "Sistem manajemen event internal untuk organisasi/lembaga.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo-makt-full.png?v=3" type="image/png" />
      </head>
      <body className={`${outfit.className} bg-slate-50 text-slate-900`}>
        {children}
        <Analytics />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
