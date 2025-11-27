import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
    title,
    value,
    icon,
    trend,
    trendUp,
}: {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: string;
    trendUp?: boolean;
}) {
    return (
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">{icon}</div>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                        {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
        </div>
    );
}