"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Site } from "@/domain/models/Site";

interface SiteContactFormProps {
  site: Site;
  propertyId?: string;
  propertyTitle?: string;
}

export default function SiteContactForm({ site, propertyId, propertyTitle }: SiteContactFormProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    tel: "",
    mensaje: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const primary = site.colorPrimario || "#4f46e5";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const { leadsService } = await import("@/infrastructure/services/leadsService");
      
      await leadsService.createLead({
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.tel,
        mensaje: formData.mensaje,
        userId: site.userId,
        tipo: 'consulta',
        estado: 'nuevo',
        origen: 'web',
        notas: [],
        propertyId,
        propertyTitle,
      }, site.email);

      setStatus("success");
    } catch (error) {
      console.error("Error sending lead:", error);
      setStatus("error");
    }
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
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Nombre</label>
                            <input 
                                required
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                placeholder="Tu nombre completo"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Email</label>
                            <input 
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                placeholder="ejemplo@correo.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">WhatsApp</label>
                        <input 
                            required
                            type="tel"
                            name="tel"
                            value={formData.tel}
                            onChange={handleChange}
                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            placeholder="Ej: +54 9 11 1234-5678"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Mensaje</label>
                        <textarea 
                            required
                            name="mensaje"
                            value={formData.mensaje}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                            placeholder="¿En qué podemos ayudarte?"
                        />
                    </div>
                    
                    {status === "error" && (
                      <p className="text-red-500 text-sm font-medium text-center">Hubo un error al enviar el mensaje. Reintentá en unos segundos.</p>
                    )}

                    <button
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
