import { Inter } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/ui/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: 'Imprimir Ficha - Zeta Prop',
    description: 'Vista de impresión de propiedad',
};

// Forces recompile
export default function PrintLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <section className={`${inter.className} bg-gray-100 print:bg-white min-h-screen`}>
            <style dangerouslySetInnerHTML={{ __html: `
                @page {
                    margin: 0;
                    size: auto;
                }
                @media print {
                    body {
                        width: 100vw;
                        height: 100vh;
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        overflow: visible;
                    }
                    /* Ensure backgrounds print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}} />
            <AuthProvider>
                {children}
            </AuthProvider>
        </section>
    );
}
