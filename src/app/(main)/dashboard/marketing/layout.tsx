import AdminGuard from "@/ui/auth/AdminGuard";

// Platform content (ZetaProp's own marketing): admins only, regardless of role permissions.
export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminGuard>{children}</AdminGuard>;
}
