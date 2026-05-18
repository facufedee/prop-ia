"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Site } from "@/domain/models/Site";

interface SiteContactFormProps {
  site: Site;
  propertyId?: string;
  propertyTitle?: string;
}

type FieldErrors = { nombre?: string; email?: string; tel?: string; mensaje?: string };

export default function SiteContactForm({ site, propertyId, propertyTitle }: SiteContactFormProps) {
  const [formData, setFormData] = useState({ nombre: "", email: "", tel: "", mensaje: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const primary = site.colorPrimario || "#4f46e5";

  const validate = (): boolean => {
    const e: FieldErrors = {};
    const nombre = formData.nombre.trim();
    const tel = formData.tel.trim();

    if (!nombre) e.nombre = "El nombre es requerido";
    else if (nombre.length < 2) e.nombre = "Mínimo 2 caracteres";
    else if (nombre.length > 60) e.nombre = "Máximo 60 caracteres";
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'\-]+$/.test(nombre)) e.nombre = "Solo se permiten letras";

    if (formData.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Email inválido";
      else if (formData.email.length > 100) e.email = "Email demasiado largo";
    }

    if (!tel) e.tel = "El teléfono es requerido";
    else if (!/^[\d\s\+\-\(\)]+$/.test(tel)) e.tel = "Solo se permiten números";
    else if (tel.replace(/\D/g, "").length < 6) e.tel = "Mínimo 6 dígitos";
    else if (tel.length > 20) e.tel = "Máximo 20 caracteres";

    if (formData.mensaje.length > 500) e.mensaje = "Máximo 500 caracteres";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          email: formData.email.trim() || undefined,
          telefono: formData.tel.trim(),
          mensaje: formData.mensaje.trim().slice(0, 500) || undefined,
          userId: site.userId,
          origen: "web",
          propertyId,
          propertyTitle,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("success");
    } catch (error) {
      console.error("Error sending lead:", error);
      setStatus("error");
    }
  };

  const setField = (field: keyof typeof formData, value: string) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (status === "success") {
    return (
      <div className="bg-white rounded-3xl p-10 text-center shadow-2xl border border-gray-100 max-w-2xl mx-auto my-20">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Mensaje enviado!</h3>
        <p className="text-gray-500">Nos pondremos en contacto con vos a la brevedad. Gracias por confiar en {site.nombre}.</p>
        <button 
          onClick={() => {
            setFormData({ nombre: "", email: "", tel: "", mensaje: "" });
            setStatus("idle");
          }}
          className="mt-8 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
        <div className="lg:w-1/2">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            ¿Encontraste tu próximo <span style={{ color: primary }}>hogar</span>?
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-lg leading-relaxed">
            Dejanos tus datos y un asesor se comunicará con vos para brindarte toda la información que necesitás.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 shrink-0">
                <Send size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Atención Personalizada</h4>
                <p className="text-sm text-gray-500">Estamos para resolver todas tus dudas sobre el proceso.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Asesoramiento Legal</h4>
                <p className="text-sm text-gray-500">Te acompañamos en cada etapa de la transacción.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 w-full">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl shadow-indigo-100 border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Nombre *</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={e => setField("nombre", e.target.value)}
                                maxLength={60}
                                className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none ${errors.nombre ? "border-red-400 bg-red-50" : "border-transparent"}`}
                                placeholder="Tu nombre completo"
                            />
                            {errors.nombre && <p className="mt-1 text-xs text-red-500 ml-1">{errors.nombre}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Email</label>
                            <input
                                type="text"
                                value={formData.email}
                                onChange={e => setField("email", e.target.value)}
                                maxLength={100}
                                className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none ${errors.email ? "border-red-400 bg-red-50" : "border-transparent"}`}
                                placeholder="ejemplo@correo.com"
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500 ml-1">{errors.email}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">WhatsApp *</label>
                        <input
                            type="tel"
                            value={formData.tel}
                            onChange={e => setField("tel", e.target.value.replace(/[^0-9\s\+\-\(\)]/g, ""))}
                            maxLength={20}
                            className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none ${errors.tel ? "border-red-400 bg-red-50" : "border-transparent"}`}
                            placeholder="Ej: +54 9 11 1234-5678"
                        />
                        {errors.tel && <p className="mt-1 text-xs text-red-500 ml-1">{errors.tel}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Mensaje</label>
                        <div className="relative">
                            <textarea
                                value={formData.mensaje}
                                onChange={e => setField("mensaje", e.target.value)}
                                maxLength={500}
                                rows={4}
                                className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none ${errors.mensaje ? "border-red-400 bg-red-50" : "border-transparent"}`}
                                placeholder="¿En qué podemos ayudarte?"
                            />
                            <span className="absolute bottom-3 right-4 text-[11px] text-gray-400">{formData.mensaje.length}/500</span>
                        </div>
                        {errors.mensaje && <p className="mt-1 text-xs text-red-500 ml-1">{errors.mensaje}</p>}
                    </div>

                    {status === "error" && (
                      <p className="text-red-500 text-sm font-medium text-center">Hubo un error al enviar el mensaje. Reintentá en unos segundos.</p>
                    )}

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full py-5 rounded-2xl text-white font-bold uppercase tracking-[0.2em] text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        style={{ backgroundColor: primary }}
                    >
                        {status === "loading" ? "Enviando..." : "Enviar Consulta"}
                    </button>
                </form>
            </div>
        </div>
      </div>
    </section>
  );
}
