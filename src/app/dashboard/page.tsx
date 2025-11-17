import StatCard from "@/ui/components/cards/StatCard";
import { Home, Calculator, Building2 } from "lucide-react";
import QuickActions from "@/ui/components/dashboard/QuickActions";
import LastEstimations from "@/ui/components/dashboard/LastEstimations";
import EstimationChart from "@/ui/components/dashboard/EstimationChart";


export default function DashboardPage() {
return (
<div className="p-6 flex flex-col gap-10">
<h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>


<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
<StatCard title="Propiedades registradas" value={12} icon={<Home className="w-6 h-6" />} />
<StatCard title="Tasaciones realizadas" value={34} icon={<Calculator className="w-6 h-6" />} />
<StatCard title="Activas" value={8} icon={<Building2 className="w-6 h-6" />} />
</div>


<QuickActions />


<div className="grid md:grid-cols-2 gap-6">
<EstimationChart />
<LastEstimations />
</div>
</div>
);
}