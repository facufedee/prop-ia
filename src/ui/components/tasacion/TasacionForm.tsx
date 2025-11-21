"use client";

import { useState } from "react";
import { PropiedadData } from "@/domain/entities/PropiedadData";
import { CalcularTasacionUseCase } from "@/app/usecases/CalcularTasacionUseCase";
import { TasacionRepositoryMock } from "@/infrastructure/repositories/TasacionRepositoryMock";

import { Home, Ruler, Building2, Clock } from "lucide-react";

export default function TasacionForm() {
  const repo = new TasacionRepositoryMock();
  const usecase = new CalcularTasacionUseCase(repo);

  const [form, setForm] = useState<PropiedadData>({
    ubicacion: "",
    metrosCuadrados: 0,
    ambientes: 1,
    antiguedad: 0,
  });

  const [result, setResult] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const calcular = async () => {
    const res = await usecase.execute({
      ...form,
      metrosCuadrados: Number(form.metrosCuadrados),
      ambientes: Number(form.ambientes),
      antiguedad: Number(form.antiguedad),
    });

    setResult(res);
  };

  return (
    <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-semibold mb-8 text-gray-900 flex items-center gap-3">
        <Home className="w-7 h-7 text-black" />
        Tasador de Inmuebles Nahu
      </h2>

      <div className="grid gap-5">
        {/* Ubicación */}
        <div className="relative">
          <Home className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
          <input
            name="ubicacion"
            placeholder=" "
            onChange={handleChange}
            className="w-full border bg-gray-50 pl-10 p-3 rounded-xl text-black 
            focus:ring-2 focus:ring-black focus:bg-white transition-all peer"
          />
          <label
            className="absolute left-10 top-3 text-gray-500 pointer-events-none
            transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base
            peer-focus:-top-3 peer-focus:text-sm peer-focus:text-black"
          >
            Ubicación
          </label>
        </div>

        {/* Metros Cuadrados */}
        <div className="relative">
          <Ruler className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
          <input
            name="metrosCuadrados"
            type="number"
            placeholder=" "
            onChange={handleChange}
            className="w-full border bg-gray-50 pl-10 p-3 rounded-xl text-black
            focus:ring-2 focus:ring-black focus:bg-white transition-all peer"
          />
          <label
            className="absolute left-10 top-3 text-gray-500 pointer-events-none
            transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base
            peer-focus:-top-3 peer-focus:text-sm peer-focus:text-black"
          >
            Metros cuadrados
          </label>
        </div>

        {/* Ambientes */}
        <div className="relative">
          <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
          <input
            name="ambientes"
            type="number"
            placeholder=" "
            onChange={handleChange}
            className="w-full border bg-gray-50 pl-10 p-3 rounded-xl text-black
            focus:ring-2 focus:ring-black focus:bg-white transition-all peer"
          />
          <label
            className="absolute left-10 top-3 text-gray-500 pointer-events-none
            transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base
            peer-focus:-top-3 peer-focus:text-sm peer-focus:text-black"
          >
            Ambientes
          </label>
        </div>

        {/* Antigüedad */}
        <div className="relative">
          <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
          <input
            name="antiguedad"
            type="number"
            placeholder=" "
            onChange={handleChange}
            className="w-full border bg-gray-50 pl-10 p-3 rounded-xl text-black
            focus:ring-2 focus:ring-black focus:bg-white transition-all peer"
          />
          <label
            className="absolute left-10 top-3 text-gray-500 pointer-events-none
            transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base
            peer-focus:-top-3 peer-focus:text-sm peer-focus:text-black"
          >
            Antigüedad (años)
          </label>
        </div>
      </div>

      <button
        onClick={calcular}
        className="w-full mt-8 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-medium"
      >
        Calcular Tasación
      </button>

      {result && (
        <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
          <p className="font-semibold text-black text-lg">
            Valor estimado: USD {result.valorEstimadoUSD}
          </p>
          <p className="text-gray-600 mt-2 leading-relaxed">
            {result.detalleCalculo}
          </p>
        </div>
      )}
    </div>
  );
}
