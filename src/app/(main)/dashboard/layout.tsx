import DashboardShell from "@/ui/components/layout/DashboardShell";
import AuthGuard from "@/ui/auth/AuthGuard";
import PermissionGuard from "@/ui/auth/PermissionGuard";

import { BranchProvider } from "@/infrastructure/context/BranchContext";

import OnboardingTour from "@/ui/components/onboarding/OnboardingTour";

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
            <OnboardingTour />
            {children}
          </DashboardShell>
        </BranchProvider>
      </PermissionGuard>
    </AuthGuard>
  );
}
