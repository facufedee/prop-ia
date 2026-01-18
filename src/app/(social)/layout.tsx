import "@/app/globals.css";

export default function SocialLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <body className="antialiased">{children}</body>
        </html>
    )
}
