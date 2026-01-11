import DashboardShell from "@/ui/components/layout/DashboardShell";
import AuthGuard from "@/ui/auth/AuthGuard";
import PermissionGuard from "@/ui/auth/PermissionGuard";

import { BranchProvider } from "@/infrastructure/context/BranchContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <PermissionGuard>
        <BranchProvider>
          <DashboardShell>

            {children}
          </DashboardShell>
        </BranchProvider>
      </PermissionGuard>
    </AuthGuard>
  );
}
