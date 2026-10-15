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
        <div className="bg-[var(--color-paper-2)] border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-full bg-[var(--color-paper-3)] text-[var(--color-muted)]">{icon}</div>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}`}>
                        {trendUp ? <TrendingUp strokeWidth={1.5} className="w-4 h-4" /> : <TrendingDown strokeWidth={1.5} className="w-4 h-4" />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm text-[var(--color-muted)] mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-[var(--color-ink)]">{value}</h3>
            </div>
        </div>
    );
}