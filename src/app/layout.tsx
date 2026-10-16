import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "Keuangan Keluarga — Abi & Umi",
  description:
    "Aplikasi keuangan keluarga: catat pemasukan, pengeluaran, transfer, anggaran bulanan, aset & kewajiban, dengan ekspor Excel/PDF.",
  keywords: [
    "keuangan keluarga",
    "anggaran",
    "catatan keuangan",
    "abi umi",
    "keuangan rumah tangga",
  ],
  authors: [{ name: "Keluarga" }],
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground min-h-screen">
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
        <SonnerToaster richColors position="top-center" />
      </body>
    </html>
  );
}
