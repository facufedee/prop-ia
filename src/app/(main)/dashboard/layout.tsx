import Script from "next/script";
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
    <>
      {/* Google Ads — Conversión de Registro */}
      <Script
        id="google-ads-conversion"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof gtag !== 'undefined') {
              gtag('event', 'conversion', {
                'send_to': 'AW-17943485669/LYk7CMaLx4UcEOW5j-xC',
                'value': 1.0,
                'currency': 'ARS'
              });
            }
          `,
        }}
      />

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
    </>
  );
}
