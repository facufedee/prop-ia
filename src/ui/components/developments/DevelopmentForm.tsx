"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Development, DevelopmentUnit, developmentService } from "@/infrastructure/services/developmentService";
import { Building2, MapPin, LayoutGrid, Image as ImageIcon, CheckCircle, Plus, X, Trash2, Upload, Loader2, Save } from "lucide-react";
import { auth } from "@/infrastructure/firebase/client";
import GoogleMapComponent from "@/ui/components/properties/wizard/GoogleMap";

interface DevelopmentFormProps {
    initialData?: Development;
    isEditing?: boolean;
}

const steps = [
    { id: 'general', label: 'Información General', icon: <Building2 strokeWidth={1.5} size={18} /> },
    { id: 'location', label: 'Ubicación', icon: <MapPin strokeWidth={1.5} size={18} /> },
    { id: 'units', label: 'Tipologías y Unidades', icon: <LayoutGrid strokeWidth={1.5} size={18} /> },
    { id: 'media', label: 'Imágenes y Branding', icon: <ImageIcon strokeWidth={1.5} size={18} /> },
    { id: 'amenities', label: 'Servicios', icon: <CheckCircle strokeWidth={1.5} size={18} /> }
];

const emptyUnit: DevelopmentUnit = {
    id: '',
    name: 'Nueva Tipología',
    type: '2 Dormitorios',
    price_currency: 'USD',
    price_min: 0,
    area_covered: 0,
    area_total: 0,
    bathrooms: 1,
    bedrooms: 2,
    status: 'available'
};

export default function DevelopmentForm({ initialData, isEditing = false }: DevelopmentFormProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const defaultData: Partial<Development> = {
        name: '',
        status: 'en-pozo',
        description: '',
        units: [],
        amenities: [],
        services: [],
        imageUrls: [],
        active: true,
        address: '',
        city: '',
        province: '',
        lat: -34.6037,
        lng: -58.3816
    };

    // Form State
    const [formData, setFormData] = useState<Partial<Development>>(initialData || defaultData);

    // Images State
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>(initialData?.imageUrls || []);
    const [coverIndex, setCoverIndex] = useState(0);

    // Handlers
    const handleChange = (field: keyof Development, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, lat, lng }));
    };

    const handleUnitAdd = () => {
        const newUnit = { ...emptyUnit, id: Math.random().toString(36).substr(2, 9) };
        setFormData(prev => ({ ...prev, units: [...(prev.units || []), newUnit] }));
    };

    const handleUnitChange = (index: number, field: keyof DevelopmentUnit, value: any) => {
        const updatedUnits = [...(formData.units || [])];
        updatedUnits[index] = { ...updatedUnits[index], [field]: value };
        setFormData(prev => ({ ...prev, units: updatedUnits }));
    };

    const handleUnitRemove = (index: number) => {
        const updatedUnits = [...(formData.units || [])];
        updatedUnits.splice(index, 1);
        setFormData(prev => ({ ...prev, units: updatedUnits }));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);

            if (previews.length + newFiles.length > 30) {
                alert("El máximo es de 30 imágenes.");
                return;
            }

            setImages(prev => [...prev, ...newFiles]);
            const newPreviews = newFiles.map(f => URL.createObjectURL(f));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
        if (coverIndex === index) setCoverIndex(0);
        if (coverIndex > index) setCoverIndex(prev => prev - 1);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.address) {
            alert("Por favor completá los campos obligatorios");
            return;
        }

        setLoading(true);
        try {
            // Upload images
            const uploadedUrls = [...(initialData?.imageUrls || [])];

            for (const file of images) {
                const path = `developments/${auth?.currentUser?.uid || 'admin'}/${Date.now()}-${file.name}`;
                const url = await developmentService.uploadImage(file, path);
                uploadedUrls.push(url);
            }

            // Handle Cover Image Logic (Move cover to index 0)
            if (uploadedUrls.length > 0 && coverIndex > 0) {
                const cover = uploadedUrls.splice(coverIndex, 1)[0];
                uploadedUrls.unshift(cover);
            }

            const finalData = {
                ...formData,
                imageUrls: uploadedUrls
            };

            if (isEditing && initialData?.id) {
                await developmentService.update(initialData.id, finalData);
            } else {
                await developmentService.create(finalData as any);
            }

            router.push("/dashboard/emprendimientos");
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al guardar");
        } finally {
            setLoading(false);
        }
    };

    // Render Steps
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // General
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Nombre del Proyecto</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    className="w-full p-3 border border-[var(--color-rule)] rounded-xl text-[var(--color-ink)]"
                                    placeholder="Ej: Grand Tower Palermo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Estado de Obra</label>
                                <select
                                    value={formData.status}
                                    onChange={e => handleChange('status', e.target.value)}
                                    className="w-full p-3 border border-[var(--color-rule)] rounded-xl text-[var(--color-ink)] bg-[var(--color-paper-2)]"
                                >
                                    <option value="en-pozo">En Pozo</option>
                                    <option value="en-construccion">En Construcción</option>
                                    <option value="terminado">Terminado / Posesión Inmediata</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Fecha de Entrega (Estimada)</label>
                                <input
                                    type="date"
                                    value={formData.delivery_date ? new Date(formData.delivery_date).toISOString().split('T')[0] : ''}
                                    onChange={e => handleChange('delivery_date', e.target.value)}
                                    className="w-full p-3 border border-[var(--color-rule)] rounded-xl text-[var(--color-ink)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Desarrolladora (Firma)</label>
                                <input
                                    type="text"
                                    value={formData.developer || ''}
                                    onChange={e => handleChange('developer', e.target.value)}
                                    className="w-full p-3 border border-[var(--color-rule)] rounded-xl text-[var(--color-ink)]"
                                    placeholder="Ej: Grupo Construir S.A."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Descripción Comercial</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => handleChange('description', e.target.value)}
                                    className="w-full p-3 border border-[var(--color-rule)] rounded-xl text-[var(--color-ink)] h-32"
                                    placeholder="Descripción atractiva del proyecto..."
                                />
                            </div>
                        </div>
                    </div>
                );
            case 1: // Location
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Dirección Exacta</label>
                                <input
                                    type="text"
                                    value={formData.address || ''}
                                    onChange={e => handleChange('address', e.target.value)}
                                    className="w-full p-3 border border-[var(--color-rule)] rounded-xl text-[var(--color-ink)]"
                                    placeholder="Calle y Altura"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Localidad</label>
                                <input
                                    type="text"
                                    value={formData.city || ''}
                                    onChange={e => handleChange('city', e.target.value)}
                                    className="w-full p-3 border border-[var(--color-rule)] rounded-xl text-[var(--color-ink)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Provincia</label>
                                <input
                                    type="text"
                                    value={formData.province || ''}
                                    onChange={e => handleChange('province', e.target.value)}
                                    className="w-full p-3 border border-[var(--color-rule)] rounded-xl text-[var(--color-ink)]"
                                />
                            </div>
                        </div>
                        {/* Map Integration */}
                        <div className="bg-[var(--color-paper-3)] rounded-xl h-96 overflow-hidden border border-[var(--color-rule)] relative">
                            <GoogleMapComponent
                                lat={formData.lat || -34.6037}
                                lng={formData.lng || -58.3816}
                                onLocationSelect={handleLocationSelect}
                            />
                            <div className="absolute top-4 left-4 bg-[var(--color-paper-2)]/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm text-xs font-medium text-[var(--color-ink-2)] pointer-events-none">
                                Hacé click en el mapa para ajustar la ubicación
                            </div>
                        </div>
                    </div>
                );
            case 2: // Units
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Tipologías Disponibles</h3>
                            <button onClick={handleUnitAdd} className="bg-[var(--color-ink)] text-[var(--color-paper)] px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                                <Plus strokeWidth={1.5} size={16} /> Agregar Tipología
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.units?.map((unit, index) => (
                                <div key={index} className="bg-[var(--color-paper)] border border-[var(--color-rule)] p-4 rounded-xl relative group">
                                    <button
                                        onClick={() => handleUnitRemove(index)}
                                        className="absolute top-2 right-2 text-[var(--color-neutral)] hover:text-[var(--color-danger)] p-1"
                                    >
                                        <Trash2 strokeWidth={1.5} size={16} />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase">Nombre</label>
                                            <input
                                                type="text"
                                                value={unit.name}
                                                onChange={e => handleUnitChange(index, 'name', e.target.value)}
                                                className="w-full p-2 border rounded-lg"
                                                placeholder="Ej: 2 Ambientes - Frente"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase">Tipo</label>
                                            <select
                                                value={unit.type}
                                                onChange={e => handleUnitChange(index, 'type', e.target.value)}
                                                className="w-full p-2 border rounded-lg"
                                            >
                                                <option>Monoambiente</option>
                                                <option>1 Dormitorio</option>
                                                <option>2 Dormitorios</option>
                                                <option>3 Dormitorios</option>
                                                <option>4+ Dormitorios</option>
                                                <option>Oficina</option>
                                                <option>Local</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase">Estado</label>
                                            <select
                                                value={unit.status}
                                                onChange={e => handleUnitChange(index, 'status', e.target.value)}
                                                className="w-full p-2 border rounded-lg"
                                            >
                                                <option value="available">Disponible</option>
                                                <option value="reserved">Reservada</option>
                                                <option value="sold">Vendida</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase">Precio Min ({unit.price_currency})</label>
                                            <input
                                                type="number"
                                                value={unit.price_min}
                                                onChange={e => handleUnitChange(index, 'price_min', Number(e.target.value))}
                                                className="w-full p-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase">Sup. Cubierta (m²)</label>
                                            <input
                                                type="number"
                                                value={unit.area_covered}
                                                onChange={e => handleUnitChange(index, 'area_covered', Number(e.target.value))}
                                                className="w-full p-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase">Baños</label>
                                            <input
                                                type="number"
                                                value={unit.bathrooms}
                                                onChange={e => handleUnitChange(index, 'bathrooms', Number(e.target.value))}
                                                className="w-full p-2 border rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!formData.units || formData.units.length === 0) && (
                                <p className="text-center text-[var(--color-muted)] py-4 italic">No has cargado tipologías aún. Agregá al menos una.</p>
                            )}
                        </div>
                    </div>
                );
            case 3: // Media
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="border-2 border-dashed border-[var(--color-rule)] rounded-xl p-8 text-center hover:bg-[var(--color-paper-3)] transition">
                            <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" id="imgs" />
                            <label htmlFor="imgs" className="cursor-pointer flex flex-col items-center gap-2">
                                <Upload strokeWidth={1.5} className="w-10 h-10 text-[var(--color-neutral)]" />
                                <span className="font-medium">Hacé click para subir imágenes</span>
                                <span className="text-xs text-[var(--color-muted)]">Renders, planos y fotos de obra</span>
                            </label>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {previews.map((src, idx) => (
                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border">
                                    <img src={src} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 4: // Amenities
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <h3 className="font-semibold text-lg">Servicios y Amenities</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {['Piscina', 'SUM', 'Gimnasio', 'Seguridad 24hs', 'Parrilla', 'Solarium', 'Cocheras', 'Laundry', 'Coworking'].map(amenity => (
                                <label key={amenity} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-[var(--color-paper-3)]">
                                    <input
                                        type="checkbox"
                                        checked={formData.amenities?.includes(amenity) || false}
                                        onChange={e => {
                                            if (e.target.checked) setFormData(prev => ({ ...prev, amenities: [...(prev.amenities || []), amenity] }));
                                            else setFormData(prev => ({ ...prev, amenities: prev.amenities?.filter(a => a !== amenity) }));
                                        }}
                                        className="rounded text-[var(--color-ink)] focus:ring-[var(--color-rule)]"
                                    />
                                    <span className="text-sm">{amenity}</span>
                                </label>
                            ))}
                        </div>

                        <div className="mt-8">
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Detalle de Financiación (Opcional)</label>
                            <textarea
                                value={formData.financing_details || ''}
                                onChange={e => handleChange('financing_details', e.target.value)}
                                className="w-full p-3 border rounded-xl h-24"
                                placeholder="Ej: Anticipo 30% en USD y saldo en 24 cuotas en Pesos + CAC."
                            />
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="bg-[var(--color-paper-2)] rounded-2xl shadow-sm border border-[var(--color-rule-2)] overflow-hidden flex flex-col md:flex-row min-h-[600px]">
            {/* Sidebar Steps */}
            <div className="w-full md:w-64 bg-[var(--color-paper)] border-r border-[var(--color-rule-2)] p-4 md:flex flex-col gap-2 hidden">
                {steps.map((step, idx) => (
                    <button
                        key={step.id}
                        onClick={() => setCurrentStep(idx)}
                        className={`text-left px-4 py-3 rounded-xl flex items-center gap-3 transition ${currentStep === idx ? 'bg-[var(--color-ink)] text-[var(--color-paper)] shadow-md' : 'text-[var(--color-ink-2)] hover:bg-[var(--color-paper-4)]'}`}
                    >
                        {step.icon}
                        <span className="text-sm font-medium">{step.label}</span>
                    </button>
                ))}
            </div>

            {/* Mobile Tabs */}
            <div className="md:hidden flex overflow-x-auto gap-2 p-4 bg-[var(--color-paper)] border-b border-[var(--color-rule-2)]">
                {steps.map((step, idx) => (
                    <button
                        key={step.id}
                        onClick={() => setCurrentStep(idx)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${currentStep === idx ? 'bg-[var(--color-ink)] text-[var(--color-paper)]' : 'bg-[var(--color-paper-2)] border text-[var(--color-ink-2)]'}`}
                    >
                        {step.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-8 flex flex-col">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6">{steps[currentStep].label}</h2>
                    {renderStepContent()}
                </div>

                {/* Footer Controls */}
                <div className="mt-8 pt-6 border-t border-[var(--color-rule-2)] flex justify-between">
                    <button
                        onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                        disabled={currentStep === 0}
                        className="px-6 py-2 rounded-xl text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] disabled:opacity-50"
                    >
                        Anterior
                    </button>

                    {currentStep < steps.length - 1 ? (
                        <button
                            onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                            className="px-6 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-xl hover:bg-[var(--color-ink-2)]"
                        >
                            Siguiente
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-xl hover:bg-[var(--color-ink-2)] font-bold flex items-center gap-2"
                        >
                            {loading && <Loader2 strokeWidth={1.5} className="animate-spin" size={18} />}
                            {isEditing ? 'Guardar Cambios' : 'Crear Emprendimiento'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
