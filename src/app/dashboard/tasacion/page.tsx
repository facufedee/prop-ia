"use client";

import dynamic from 'next/dynamic';

// Carga dinámica del formulario para evitar errores de hidratación (SSR)
const TasacionForm = dynamic(
  () => import('@/ui/components/tasacion/TasacionForm'),
  { ssr: false, loading: () => <p>Cargando tasador...</p> }
);

export default function TasacionPage() {
  return (
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Tasación
        </h1>
        <TasacionForm />
      </div>
    </div>
  );
}
