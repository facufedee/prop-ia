import { ReactNode } from "react";


export default function StatCard({
title,
value,
icon,
}: {
title: string;
value: string | number;
icon: ReactNode;
}) {
return (
<div className="bg-white border rounded-2xl p-5 shadow-sm flex items-center gap-4">
<div className="p-3 rounded-xl bg-gray-100 text-black">{icon}</div>
<div>
<p className="text-sm text-gray-500">{title}</p>
<h3 className="text-xl font-semibold text-gray-900">{value}</h3>
</div>
</div>
);
}