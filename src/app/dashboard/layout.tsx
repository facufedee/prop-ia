import DashboardShell from "@/ui/components/layout/DashboardShell";
import AuthGuard from "@/ui/auth/AuthGuard";
import PermissionGuard from "@/ui/auth/PermissionGuard";
import InfoAlert from "@/ui/components/ui/InfoAlert";
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
            <div className="px-6 pt-6">
              <InfoAlert
                message="Estamos en construcción. Algunas funcionalidades pueden no estar disponibles."
                linkText="Conoce cómo funciona Prop-IA aquí"
                linkHref="/servicios"
              />
            </div>
            {children}
          </DashboardShell>
        </BranchProvider>
      </PermissionGuard>
    </AuthGuard>
  );
}
