import DashboardSidebar from "./DashboardSidebar";
import Footer from "./Footer";


export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-65px)] bg-gray-50">
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <Footer />
    </div>
  );
}