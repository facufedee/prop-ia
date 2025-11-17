"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function EstimationChart() {
  const data = [
    { name: "Ene", valor: 120000 },
    { name: "Feb", valor: 132000 },
    { name: "Mar", valor: 125000 },
    { name: "Abr", valor: 140000 },
  ];

  return (
    <div className="bg-white border rounded-2xl shadow-sm p-6 h-80">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Evolución de Tasaciones
      </h3>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="valor"
            stroke="#000000"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
