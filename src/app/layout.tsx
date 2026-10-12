import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NIE Research Publication Management System",
  description: "Institutional publication tracking and NIRF compliance portal for The National Institute of Engineering, Mysore",
  keywords: ["NIE Mysore", "Research Publications", "NIRF Tracker", "Scopus Quartiles", "Academic Research"],
};

import { AuthProvider } from "@/components/shared/auth-provider";
import { ToastProvider } from "@/components/shared/toast-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
