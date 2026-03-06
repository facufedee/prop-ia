import TrialBanner from "@/ui/components/subscription/TrialBanner";
import DashboardShell from "@/ui/components/layout/DashboardShell";
import AuthGuard from "@/ui/auth/AuthGuard";
import PermissionGuard from "@/ui/auth/PermissionGuard";

import { BranchProvider } from "@/infrastructure/context/BranchContext";

import TrialEnforcer from "@/ui/components/subscription/TrialEnforcer";
import AccountLockEnforcer from "@/ui/components/subscription/AccountLockEnforcer";
import PaymentWelcomeListener from "@/ui/components/subscription/PaymentWelcomeListener";

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
            <TrialBanner />
            <PaymentWelcomeListener />
            <TrialEnforcer />
            <AccountLockEnforcer />
            {children}
          </DashboardShell>
        </BranchProvider>
      </PermissionGuard>
    </AuthGuard>
  );
}
