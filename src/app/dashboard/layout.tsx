import DashboardShell from "@/ui/components/layout/DashboardShell";
import AuthGuard from "@/ui/auth/AuthGuard";
import InfoAlert from "@/ui/components/ui/InfoAlert";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardShell>
        <div className="px-6 pt-6">
          <InfoAlert
            message="Estamos en construcción. Algunas funcionalidades pueden no estar disponibles."
            linkText="Conoce cómo funciona Prop-IA aquí"
            linkHref="/como-funciona"
          />
        </div>
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
