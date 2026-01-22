import AdminGuard from "@/ui/auth/AdminGuard";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminGuard>{children}</AdminGuard>;
}
