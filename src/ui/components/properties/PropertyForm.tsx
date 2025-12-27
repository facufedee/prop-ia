"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PropertyData } from "@/lib/prediction/preprocessor";
import { Home, Ruler, Building2, Clock, Bath, BedDouble, Landmark, MapPin, Hash, CircleDollarSign, Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { app, db, storage, auth } from "@/infrastructure/firebase/client";
import { collection, addDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const initialFormState: PropertyData = {
    bedrooms: null,
    bathrooms: null,
    area_total: null,
    area_covered: null,
    floor: null,
    construction_year: null,
    rooms: null,
    expenses: null,
    property_type: '',
    barrio: '',
    ciudad: '',
    provincia: '',
    all_features: '',
};

const propertyTypeOptions = [
    "Departamento",
    "Bodega-Galpon",
    "Bóveda, nicho o parcela",
    "Cama Náutica",
    "Casa",
    "Consultorio",
    "Depósito",
    "Edificio",
    "Fondo de comercio",
    "Cochera",
    "Hotel",
    "Local comercial",
    "Oficina comercial",
    "PH",
    "Quinta Vacacional"
];

const commonFeatures = [
    "pileta", "sum", "seguridad", "cochera", "balcon", "terraza", "jardin", "gimnasio", "laundry", "calefaccion"
];

// Reusing location data from TasacionForm (simplified for brevity, ideally shared)
const provinciaOptions = [
    "Capital Federal", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza"
];
// Simplified location data for MVP
const locationData: Record<string, { ciudades: string[]; barrios: string[] }> = {
    "Capital Federal": {
        ciudades: ["Capital Federal"],
        barrios: ["Palermo", "Belgrano", "Recoleta", "Almagro", "Caballito", "Flores", "Villa Crespo", "Balvanera", "San Telmo", "Barracas", "Boedo", "Chacarita", "Coghlan", "Colegiales", "Constitución", "Monserrat", "Nueva Pompeya", "Núñez", "Parque Avellaneda", "Parque Chacabuco", "Parque Patricios", "Puerto Madero", "Retiro", "Saavedra", "San Cristobal", "San Nicolás", "Tribunales", "Versalles", "Villa del Parque", "Villa Devoto", "Villa General Mitre", "Villa Lugano", "Villa Luro", "Villa Ortúzar", "Villa Pueyrredón", "Villa Real", "Villa Riachuelo", "Villa Santa Rita", "Villa Soldati", "Villa Urquiza"]
    },
    // Add other provinces as needed or import from a shared constant
};

export default function PropertyForm() {
    const router = useRouter();
    const [form, setForm] = useState<PropertyData>(initialFormState);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [selectedProvincia, setSelectedProvincia] = useState<string>('');
    const [selectedCiudad, setSelectedCiudad] = useState<string>('');
    const [ciudadOptions, setCiudadOptions] = useState<string[]>([]);
    const [barrioOptions, setBarrioOptions] = useState<string[]>([]);

    // Image Upload State
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (e.target.type === 'number' && value !== '' && Number(value) < 0) return;
        setForm((prev: PropertyData) => ({ ...prev, [name]: value }));
    };

    const handleFeatureChange = (feature: string, checked: boolean) => {
        if (checked) {
            setSelectedFeatures(prev => [...prev, feature]);
        } else {
            setSelectedFeatures(prev => prev.filter(f => f !== feature));
        }
    };

    const handleProvinciaChange = (value: string) => {
        setSelectedProvincia(value);
        setForm((prev: PropertyData) => ({ ...prev, provincia: value }));
        if (value && locationData[value as keyof typeof locationData]) {
            setCiudadOptions(locationData[value as keyof typeof locationData].ciudades);
            setSelectedCiudad('');
            setBarrioOptions([]);
            setForm((prev: PropertyData) => ({ ...prev, ciudad: '', barrio: '' }));
        } else {
            setCiudadOptions([]);
            setBarrioOptions([]);
        }
    };

    const handleCiudadChange = (value: string) => {
        setSelectedCiudad(value);
        setForm((prev: PropertyData) => ({ ...prev, ciudad: value }));
        if (selectedProvincia && value && locationData[selectedProvincia as keyof typeof locationData]) {
            setBarrioOptions(locationData[selectedProvincia as keyof typeof locationData].barrios);
            setForm((prev: PropertyData) => ({ ...prev, barrio: '' }));
        }
    };

    // Image Handlers
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
            URL.revokeObjectURL(prev[index]); // Cleanup memory
            return prev.filter((_, i) => i !== index);
        });
    };

    const isFormValid = () => {
        return (
            form.property_type &&
            form.provincia &&
            form.ciudad &&
            form.barrio &&
            form.area_total &&
            form.rooms &&
            form.bedrooms &&
            images.length > 0
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth?.currentUser || !db) {
            setError("Debes iniciar sesión para registrar una propiedad.");
            return;
        }

        try {
            setLoading(true);
            setUploading(true);

            // Upload images first
            const imageUrls: string[] = [];
            for (let i = 0; i < images.length; i++) {
                if (!storage) throw new Error("Firebase Storage not initialized");
                const storageRef = ref(storage, `properties/${auth?.currentUser?.uid}/${Date.now()}-${images[i].name}`);
                await uploadBytes(storageRef, images[i]);
                const url = await getDownloadURL(storageRef);
                imageUrls.push(url);
                setUploadProgress(Math.round(((i + 1) / images.length) * 100));
            }

            setUploading(false);

            // Create property document
            const propertyData = {
                ...form,
                all_features: selectedFeatures.join(', '),
                userId: auth?.currentUser?.uid,
                createdAt: new Date(),
                status: 'active',
                imageUrls
            };

            await addDoc(collection(db, "properties"), propertyData);
            router.push("/dashboard/propiedades");
        } catch (error) {
            console.error("Error creating property:", error);
            setError("Error al registrar la propiedad");
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    const renderInputField = (name: keyof PropertyData, label: string, icon: React.ReactNode, type = "text") => (
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                {icon}
            </span>
            <input
                name={name as string}
                type={type}
                min={type === 'number' ? "0" : undefined}
                placeholder={label}
                value={(form as any)[name] || ''}
                onChange={handleChange}
                className="w-full border bg-gray-50 pl-10 p-3 rounded-xl text-black focus:ring-2 focus:ring-black focus:bg-white transition-all min-h-[44px]"
            />
        </div>
    );

    const renderSelectField = (name: keyof PropertyData, label: string, icon: React.ReactNode, options: string[], disabled: boolean = false, onChange?: (value: string) => void) => (
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                {icon}
            </span>
            <select
                name={name as string}
                value={(form as any)[name] || ''}
                onChange={(e) => onChange ? onChange(e.target.value) : handleChange(e)}
                disabled={disabled}
                className="w-full border bg-gray-50 pl-10 p-3 rounded-xl text-black focus:ring-2 focus:ring-black focus:bg-white transition-all appearance-none disabled:bg-gray-100 disabled:text-gray-400 min-h-[44px] font-sans"
            >
                <option value="">{disabled ? `Selecciona ${label.toLowerCase()} primero` : label}</option>
                {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Location Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <MapPin className="w-5 h-5" /> Ubicación
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderSelectField("provincia", "Provincia", <MapPin />, provinciaOptions, false, handleProvinciaChange)}
                        {renderSelectField("ciudad", "Ciudad", <MapPin />, ciudadOptions, !selectedProvincia, handleCiudadChange)}
                        {renderSelectField("barrio", "Barrio", <MapPin />, barrioOptions, !selectedCiudad)}
                        {renderInputField("property_type", "Dirección (Calle y Altura)", <Home />)}
                    </div>
                </div>

                {/* Details Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="w-5 h-5" /> Detalles de la Propiedad
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {renderSelectField("property_type", "Tipo de Propiedad", <Landmark />, propertyTypeOptions)}
                        {renderInputField("area_total", "Área Total (m²)", <Ruler />, "number")}
                        {renderInputField("area_covered", "Área Cubierta (m²)", <Ruler />, "number")}
                        {renderInputField("rooms", "Ambientes", <Building2 />, "number")}
                        {renderInputField("bedrooms", "Dormitorios", <BedDouble />, "number")}
                        {renderInputField("bathrooms", "Baños", <Bath />, "number")}
                        {renderInputField("floor", "Piso", <Hash />, "number")}
                        {renderInputField("construction_year", "Año Construcción", <Clock />, "number")}
                        {renderInputField("expenses", "Expensas ($)", <CircleDollarSign />, "number")}
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Características Adicionales</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {commonFeatures.map(feature => (
                                <label key={feature} className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                    <input
                                        type="checkbox"
                                        checked={selectedFeatures.includes(feature)}
                                        onChange={(e) => handleFeatureChange(feature, e.target.checked)}
                                        className="rounded border-gray-300 text-black focus:ring-black"
                                    />
                                    <span className="text-sm text-gray-700 capitalize">{feature}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Image Upload Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" /> Imágenes
                    </h2>

                    <div
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={handleImageSelect}
                        />
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                            <Upload className="w-10 h-10 text-gray-400" />
                            <p className="font-medium">Hacé click para subir imágenes</p>
                            <p className="text-xs">Soporta JPG, PNG (Máx 30 imágenes)</p>
                        </div>
                    </div>

                    {previews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            {previews.map((src, index) => (
                                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                                    <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !isFormValid()}
                        className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {uploading ? `Subiendo ${uploadProgress}%` : 'Guardando...'}
                            </>
                        ) : (
                            'Registrar Propiedad'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
