"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "./StepIndicator";
import { ChevronLeft, ChevronRight, Loader2, Upload, X, MapPin } from "lucide-react";
import { auth, db, storage } from "@/infrastructure/firebase/client";
import { collection, addDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { locationService, Provincia, Localidad } from "@/infrastructure/services/locationService";
import dynamic from 'next/dynamic';

// Dynamic import for Map to avoid SSR issues
const Map = dynamic(() => import("./GoogleMap"), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">Cargando mapa...</div>
});

const STEPS = [
    "Operación",
    "Ubicación",
    "Características",
    "Precio",
    "Multimedia",
    "Descripción"
];

export default function PropertyWizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        // Step 1: Operation
        operation_type: 'Venta', // Venta, Alquiler, Temporada
        property_type: 'Departamento',
        property_subtype: '',

        // Step 2: Location
        provincia: '',
        provincia_id: '',
        localidad: '',
        localidad_id: '',
        calle: '',
        altura: '',
        lat: -34.6037, // Default Buenos Aires
        lng: -58.3816,

        // Step 3: Characteristics
        area_total: '',
        area_covered: '',
        rooms: '',
        bedrooms: '',
        bathrooms: '',
        toilettes: '',
        garages: '',
        antiquity_type: 'A estrenar', // A estrenar, Años, En construcción
        antiquity_years: '',

        // Step 4: Price
        currency: 'USD',
        price: '',
        expenses: '',

        // Step 6: Description
        title: '',
        description: '',
    });

    // Step 5: Multimedia State
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Location Data State
    const [provincias, setProvincias] = useState<Provincia[]>([]);
    const [localidades, setLocalidades] = useState<Localidad[]>([]);

    useEffect(() => {
        // Load provincias on mount
        locationService.getProvincias().then(setProvincias);
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleProvinciaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provinciaId = e.target.value;
        const provincia = provincias.find(p => p.id === provinciaId);

        handleChange('provincia_id', provinciaId);
        handleChange('provincia', provincia?.nombre || '');
        handleChange('localidad_id', '');
        handleChange('localidad', '');

        if (provinciaId) {
            const locs = await locationService.getLocalidades(provinciaId);
            setLocalidades(locs);
        } else {
            setLocalidades([]);
        }
    };

    const handleLocalidadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const localidadId = e.target.value;
        const localidad = localidades.find(l => l.id === localidadId);
        handleChange('localidad_id', localidadId);
        handleChange('localidad', localidad?.nombre || '');
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImages(prev => [...prev, ...newFiles]);
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const nextStep = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            handleSubmit();
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        if (!auth.currentUser) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Create Document
            const propertyRef = await addDoc(collection(db, "properties"), {
                ...formData,
                userId: auth.currentUser.uid,
                createdAt: new Date(),
                status: 'active',
                imageUrls: []
            });

            // 2. Upload Images
            const imageUrls: string[] = [];
            const totalImages = images.length;

            for (let i = 0; i < totalImages; i++) {
                const image = images[i];
                const storageRef = ref(storage, `properties/${auth.currentUser.uid}/${propertyRef.id}/${image.name}-${Date.now()}`);
                await uploadBytes(storageRef, image);
                const url = await getDownloadURL(storageRef);
                imageUrls.push(url);
                setUploadProgress(Math.round(((i + 1) / totalImages) * 100));
            }

            // 3. Update Document
            await updateDoc(propertyRef, { imageUrls });

            router.push("/dashboard/propiedades");

        } catch (err: any) {
            console.error(err);
            setError("Error al publicar: " + err.message);
            setLoading(false);
        }
    };

    // Render Steps
    const renderStep = () => {
        switch (currentStep) {
            case 1: // Operation & Type
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-semibold">¿Qué querés publicar?</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de operación</label>
                            <div className="flex gap-4">
                                {['Venta', 'Alquiler', 'Temporada'].map(op => (
                                    <button
                                        key={op}
                                        onClick={() => handleChange('operation_type', op)}
                                        className={`flex-1 py-3 px-4 rounded-xl border transition-all ${formData.operation_type === op
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {op}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de propiedad</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.property_type}
                                    onChange={(e) => handleChange('property_type', e.target.value)}
                                >
                                    <option value="Departamento">Departamento</option>
                                    <option value="Casa">Casa</option>
                                    <option value="PH">PH</option>
                                    <option value="Terreno">Terreno</option>
                                    <option value="Local">Local</option>
                                    <option value="Oficina">Oficina</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subtipo (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Ej. Duplex, Loft"
                                    value={formData.property_subtype}
                                    onChange={(e) => handleChange('property_subtype', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2: // Location
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-semibold">¿Dónde está ubicada?</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                    value={formData.provincia_id}
                                    onChange={handleProvinciaChange}
                                >
                                    <option value="">Seleccioná una provincia</option>
                                    {provincias.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Localidad / Barrio</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl disabled:bg-gray-100"
                                    value={formData.localidad_id}
                                    onChange={handleLocalidadChange}
                                    disabled={!formData.provincia_id}
                                >
                                    <option value="">Seleccioná una localidad</option>
                                    {localidades.map(l => (
                                        <option key={l.id} value={l.id}>{l.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Calle</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                    placeholder="Nombre de la calle"
                                    value={formData.calle}
                                    onChange={(e) => handleChange('calle', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Altura</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                    placeholder="1234"
                                    value={formData.altura}
                                    onChange={(e) => handleChange('altura', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">¿Cómo querés mostrar tu ubicación?</label>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="location_privacy" className="text-indigo-600 focus:ring-indigo-500" defaultChecked />
                                    <span className="text-sm text-gray-700">Exacta</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="location_privacy" className="text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-sm text-gray-700">Aproximada</span>
                                </label>
                            </div>
                        </div>

                        {/* Map Component */}
                        <div className="rounded-xl overflow-hidden border border-gray-200 h-[400px] relative">
                            <Map
                                lat={formData.lat}
                                lng={formData.lng}
                                onLocationSelect={(lat, lng) => {
                                    handleChange('lat', lat);
                                    handleChange('lng', lng);
                                }}
                            />
                            <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded-lg text-xs shadow-sm z-[1000]">
                                Hacé click en el mapa para ajustar la ubicación exacta
                            </div>
                        </div>
                    </div>
                );

            case 3: // Characteristics
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-semibold">Características principales</h2>

                        {/* Superficie */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Superficie</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Cubierta (m²)</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border border-gray-300 rounded-xl"
                                        value={formData.area_covered}
                                        onChange={(e) => handleChange('area_covered', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Total (m²)</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border border-gray-300 rounded-xl"
                                        value={formData.area_total}
                                        onChange={(e) => handleChange('area_total', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Rooms */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Ambientes y Distribución</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['rooms', 'bedrooms', 'bathrooms', 'toilettes', 'garages'].map(field => (
                                    <div key={field}>
                                        <label className="block text-xs text-gray-500 mb-1 capitalize">
                                            {field === 'rooms' ? 'Ambientes' :
                                                field === 'bedrooms' ? 'Dormitorios' :
                                                    field === 'bathrooms' ? 'Baños' :
                                                        field === 'garages' ? 'Cocheras' : field}
                                        </label>
                                        <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                                            <button
                                                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border-r"
                                                onClick={() => handleChange(field, Math.max(0, Number(formData[field as keyof typeof formData] || 0) - 1))}
                                            >-</button>
                                            <input
                                                type="number"
                                                className="w-full p-2 text-center outline-none"
                                                value={formData[field as keyof typeof formData] || 0}
                                                onChange={(e) => handleChange(field, e.target.value)}
                                            />
                                            <button
                                                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border-l"
                                                onClick={() => handleChange(field, Number(formData[field as keyof typeof formData] || 0) + 1)}
                                            >+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Antiquity */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Antigüedad</h3>
                            <div className="flex flex-col gap-3">
                                {['A estrenar', 'Años de antigüedad', 'En construcción'].map(type => (
                                    <label key={type} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="antiquity"
                                            checked={formData.antiquity_type === type}
                                            onChange={() => handleChange('antiquity_type', type)}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">{type}</span>
                                        {type === 'Años de antigüedad' && formData.antiquity_type === type && (
                                            <input
                                                type="number"
                                                placeholder="Años"
                                                className="ml-auto w-20 p-1 border rounded text-sm"
                                                value={formData.antiquity_years}
                                                onChange={(e) => handleChange('antiquity_years', e.target.value)}
                                            />
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 4: // Price
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-semibold">Definí el precio</h2>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                    value={formData.currency}
                                    onChange={(e) => handleChange('currency', e.target.value)}
                                >
                                    <option value="USD">USD (Dólares)</option>
                                    <option value="ARS">ARS (Pesos)</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Precio</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                    placeholder="0"
                                    value={formData.price}
                                    onChange={(e) => handleChange('price', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Expensas (Opcional)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-500">$</span>
                                <input
                                    type="number"
                                    className="w-full p-3 pl-8 border border-gray-300 rounded-xl"
                                    placeholder="0"
                                    value={formData.expenses}
                                    onChange={(e) => handleChange('expenses', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 5: // Multimedia
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-semibold">Fotos y Multimedia</h2>

                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer relative">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                multiple
                                accept="image/*"
                                onChange={handleImageSelect}
                            />
                            <div className="flex flex-col items-center gap-2 text-gray-500 pointer-events-none">
                                <Upload className="w-10 h-10 text-gray-400" />
                                <p className="font-medium">Arrastrá tus fotos o hacé click para subir</p>
                                <p className="text-xs">Podés subir hasta 30 fotos</p>
                            </div>
                        </div>

                        {previews.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                {previews.map((src, index) => (
                                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border bg-gray-100">
                                        <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/70"
                                        >
                                            <X size={14} />
                                        </button>
                                        {index === 0 && (
                                            <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">Portada</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 6: // Description
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-semibold">Describí tu propiedad</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Título del aviso</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-xl"
                                placeholder="Ej. Hermoso departamento 2 ambientes en Palermo"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1 text-right">{formData.title.length}/70</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                            <textarea
                                className="w-full p-3 border border-gray-300 rounded-xl h-40 resize-none"
                                placeholder="Contanos los detalles que hacen única a tu propiedad..."
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1 text-right">Mínimo 150 caracteres</p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <StepIndicator currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} />
            </div>

            {/* Content */}
            <div className="p-8 min-h-[400px]">
                {renderStep()}
            </div>

            {/* Footer / Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <button
                    onClick={prevStep}
                    disabled={currentStep === 1 || loading}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition
                        ${currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}
                    `}
                >
                    <ChevronLeft size={20} />
                    Atrás
                </button>

                <button
                    onClick={nextStep}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            {uploadProgress > 0 ? `Subiendo ${uploadProgress}%` : 'Publicando...'}
                        </>
                    ) : (
                        <>
                            {currentStep === STEPS.length ? 'Publicar Aviso' : 'Continuar'}
                            {currentStep < STEPS.length && <ChevronRight size={20} />}
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 text-center text-sm border-t border-red-100">
                    {error}
                </div>
            )}
        </div>
    );
}
