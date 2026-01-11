"use client";

import dynamic from 'next/dynamic';

// Carga dinámica del formulario para evitar errores de hidratación (SSR)
const TasacionForm = dynamic(
  () => import('@/ui/components/tasacion/TasacionForm'),
  { ssr: false, loading: () => <p>Cargando tasador...</p> }
);

export default function TasacionPage() {
  return (
    <div className="p-6">
      <div className="w-full max-w-7xl mx-auto">

        <TasacionForm />
      </div>
    </div>
  );
}
