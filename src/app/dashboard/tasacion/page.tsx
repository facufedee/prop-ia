import TasacionForm from "@/ui/components/tasacion/TasacionForm";


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
