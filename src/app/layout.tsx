import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Navbar from "@/ui/components/layout/navbar/Navbar";
import { AuthProvider } from "@/ui/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PROP-IA",
  description: "SaaS inmobiliario con tasación inteligente",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        suppressHydrationWarning={true}
        className={`
          min-h-screen
          bg-white text-black
          antialiased
          ${inter.variable}
        `}
      >
        <AuthProvider>
          <Navbar />
          <main className="pt-24">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
