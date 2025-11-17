import { Home } from "lucide-react";


export default function PropertiesTable() {
const data = [
{ id: 1, titulo: "Departamento 2 ambientes", ubicacion: "Recoleta", metros: 45, precio: 120000 },
{ id: 2, titulo: "Casa 4 ambientes", ubicacion: "Caballito", metros: 110, precio: 260000 },
{ id: 3, titulo: "Monoambiente", ubicacion: "Palermo", metros: 28, precio: 95000 },
];


return (
<div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-gray-100 text-gray-700 text-sm">
<th className="p-4">Título</th>
<th className="p-4">Ubicación</th>
<th className="p-4">Metros²</th>
<th className="p-4">Precio (USD)</th>
</tr>
</thead>
<tbody>
{data.map((p) => (
<tr key={p.id} className="border-t text-black hover:bg-gray-50 transition">
<td className="p-4 font-medium flex items-center gap-2"><Home className="w-4 h-4" /> {p.titulo}</td>
<td className="p-4">{p.ubicacion}</td>
<td className="p-4">{p.metros}</td>
<td className="p-4">{p.precio.toLocaleString()}</td>
</tr>
))}
</tbody>
</table>
</div>
);
}