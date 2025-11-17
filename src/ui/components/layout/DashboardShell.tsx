import DashboardNavbar from "./DashboardNavbar";
import DashboardSidebar from "./DashboardSidebar";


export default function DashboardShell({ children }: { children: React.ReactNode }) {
return (
<div className="flex min-h-screen bg-gray-50">
<DashboardSidebar />
<div className="flex-1 flex flex-col">
<DashboardNavbar />
<main className="p-6">{children}</main>
</div>
</div>
);
}