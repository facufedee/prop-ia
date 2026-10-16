import AdminGuard from "@/ui/auth/AdminGuard";

// Platform content (ZetaProp's own blog): admins only, regardless of role permissions.
export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminGuard>{children}</AdminGuard>;
}
