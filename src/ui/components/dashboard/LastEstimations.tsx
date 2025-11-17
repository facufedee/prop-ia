export default function LastEstimations() {
const data = [
{ id: 1, ubicacion: "Recoleta", valor: 120000 },
{ id: 2, ubicacion: "Belgrano", valor: 185000 },
{ id: 3, ubicacion: "Caballito", valor: 94000 },
];


return (
<div className="bg-white border rounded-2xl shadow-sm p-6">
<h3 className="text-lg font-semibold text-gray-900 mb-4">Últimas Tasaciones</h3>
<ul className="flex flex-col gap-3 text-sm text-gray-700">
{data.map((t) => (
<li key={t.id} className="flex justify-between py-2 border-b last:border-b-0">
<span>{t.ubicacion}</span>
<span className="font-semibold text-black">USD {t.valor.toLocaleString()}</span>
</li>
))}
</ul>
</div>
);
}