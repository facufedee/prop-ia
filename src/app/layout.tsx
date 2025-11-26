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
  metadataBase: new URL('https://prop-ia.com'), // Replace with actual domain
  title: {
    default: "PROP-IA | Tasación Inmobiliaria con Inteligencia Artificial",
    template: "%s | PROP-IA"
  },
  description: "La plataforma líder en Argentina para tasaciones inmobiliarias precisas impulsadas por IA. Datos de +450k propiedades y análisis de mercado en tiempo real.",
  keywords: ["tasación inmobiliaria", "inteligencia artificial", "real estate argentina", "valoración de propiedades", "proptech", "tasador online", "precios propiedades argentina"],
  authors: [{ name: "PROP-IA Team" }],
  creator: "PROP-IA",
  publisher: "PROP-IA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "PROP-IA | Tasación Inmobiliaria Inteligente",
    description: "Descubrí el valor real de tu propiedad con nuestra IA entrenada con +450k datos históricos. Precisión, rapidez y tecnología de vanguardia.",
    url: 'https://prop-ia.com',
    siteName: 'PROP-IA',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg', // Ensure this image exists or is created
        width: 1200,
        height: 630,
        alt: 'PROP-IA Dashboard y Análisis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "PROP-IA | Tasación Inmobiliaria Inteligente",
    description: "Tasaciones precisas en segundos con Inteligencia Artificial. +450k propiedades analizadas.",
    images: ['/og-image.jpg'], // Same image for consistency
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://prop-ia.com',
  },
};

import NextTopLoader from "nextjs-toploader";

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
        <NextTopLoader
          color="#000000"
          initialPosition={0.08}
          crawlSpeed={200}
          height={2}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #000000,0 0 5px #000000"
        />
        <AuthProvider>
          <Navbar />
          <main className="pt-[65px]">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
