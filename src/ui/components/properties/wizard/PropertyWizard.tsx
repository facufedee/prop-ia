"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "./StepIndicator";
import { ChevronLeft, ChevronRight, Loader2, Upload, X, MapPin } from "lucide-react";
import { auth, db, storage } from "@/infrastructure/firebase/client";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { locationService, Provincia, Localidad } from "@/infrastructure/services/locationService";
import dynamic from 'next/dynamic';

import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

// Dynamic import for Map to avoid SSR issues
const Map = dynamic(() => import("./GoogleMap"), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">Cargando mapa...</div>
});

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

const STEPS = [
    "Operación",
    "Ubicación",
    "Características",
    "Precio",
    "Multimedia",
    "Descripción"
];

interface PropertyWizardProps {
    initialData?: any;
    isEditing?: boolean;
}

export default function PropertyWizard({ initialData, isEditing = false }: PropertyWizardProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        // Step 1: Operation
        operation_type: initialData?.operation_type || 'Venta',
        property_type: initialData?.property_type || 'Departamento',
        property_subtype: initialData?.property_subtype || '',

        // Step 2: Location
        provincia: initialData?.provincia || '',
        provincia_id: initialData?.provincia_id || '',
        localidad: initialData?.localidad || '',
        localidad_id: initialData?.localidad_id || '',
        calle: initialData?.calle || '',
        altura: initialData?.altura || '',
        lat: initialData?.lat || -34.6037,
        lng: initialData?.lng || -58.3816,

        // Step 3: Characteristics
        area_total: initialData?.area_total || '',
        area_covered: initialData?.area_covered || '',
        rooms: initialData?.rooms || '',
        bedrooms: initialData?.bedrooms || '',
        bathrooms: initialData?.bathrooms || '',
        toilettes: initialData?.toilettes || '',
        garages: initialData?.garages || '',
        antiquity_type: initialData?.antiquity_type || 'A estrenar',
        antiquity_years: initialData?.antiquity_years || '',

        // Step 4: Price
        currency: initialData?.currency || 'USD',
        price: initialData?.price || '',
        expenses: initialData?.expenses || '',

        // Step 6: Description
        title: initialData?.title || '',
        description: initialData?.description || '',
    });

    // Step 5: Multimedia State
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>(initialData?.imageUrls || []);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Location Data State
    const [provincias, setProvincias] = useState<Provincia[]>([]);
    const [localidades, setLocalidades] = useState<Localidad[]>([]);

    // Google Maps API Key
    const GOOGLE_MAPS_API_KEY = "AIzaSyB9-8L-SaT3rMmfl6O80nq8uK7lPJoHYZE";

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: libraries
    });

    useEffect(() => {
        // Load provincias on mount
        locationService.getProvincias().then(setProvincias);

        // If editing and we have a province ID, load localities
        if (initialData?.provincia_id) {
            locationService.getLocalidades(initialData.provincia_id).then(setLocalidades);
        }
    }, [initialData]);

    // Automatic Geocoding Effect
    useEffect(() => {
        // Only geocode if not editing or if address changed significantly
        // For simplicity, we skip auto-geocoding on initial load if editing to preserve saved coords
        if (isEditing && formData.lat === initialData?.lat && formData.lng === initialData?.lng) return;

        const { calle, altura, localidad, provincia } = formData;
        if (calle && altura && localidad && provincia) {
            const timer = setTimeout(async () => {
                try {
                    const address = `${calle} ${altura}, ${localidad}, ${provincia}, Argentina`;
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`);
                    const data = await response.json();

                    if (data.results && data.results.length > 0) {
                        const { lat, lng } = data.results[0].geometry.location;
                        setFormData(prev => ({ ...prev, lat, lng }));
                    }
                } catch (error) {
                    console.error("Geocoding error:", error);
                }
            }, 1000); // Debounce 1s

            return () => clearTimeout(timer);
        }
    }, [formData.calle, formData.altura, formData.localidad, formData.provincia, isEditing, initialData]);

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
        // If it's an existing image (URL), we just remove it from previews
        // Ideally we should track deleted existing images to remove them from Storage/Firestore on save
        // For now, we just remove from the UI list

        if (index < (initialData?.imageUrls?.length || 0) && images.length === 0) {
            // Removing an existing image when no new images added yet
            // This logic is tricky because 'images' array only holds NEW files
            // 'previews' holds mixed URLs (existing) and blob URLs (new)
            // We need a better way to track which is which, but for MVP:
            setPreviews(prev => prev.filter((_, i) => i !== index));
            return;
        }

        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            // Only revoke if it's a blob URL
            if (prev[index].startsWith('blob:')) {
                URL.revokeObjectURL(prev[index]);
            }
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
            let propertyRef;
            let imageUrls = [...(initialData?.imageUrls || [])]; // Start with existing images

            // Filter out removed existing images from imageUrls based on previews
            // This is a simplification; robust implementation would track deleted URLs explicitly
            imageUrls = imageUrls.filter(url => previews.includes(url));

            if (isEditing && initialData?.id) {
                // Update existing document
                propertyRef = doc(db, "properties", initialData.id);
                await updateDoc(propertyRef, {
                    ...formData,
                    updatedAt: new Date(),
                    imageUrls: imageUrls // Will be updated with new ones below
                });
            } else {
                // Create new document
                const docRef = await addDoc(collection(db, "properties"), {
                    ...formData,
                    userId: auth.currentUser.uid,
                    createdAt: new Date(),
                    status: 'active',
                    imageUrls: []
                });
                propertyRef = docRef; // docRef is a DocumentReference
            }

            // Upload NEW Images
            const totalImages = images.length;
            const newImageUrls: string[] = [];

            for (let i = 0; i < totalImages; i++) {
                const image = images[i];
                // Use propertyRef.id (works for both new and existing docs)
                const storageRef = ref(storage, `properties/${auth.currentUser.uid}/${propertyRef.id}/${image.name}-${Date.now()}`);
                await uploadBytes(storageRef, image);
                const url = await getDownloadURL(storageRef);
                newImageUrls.push(url);
                setUploadProgress(Math.round(((i + 1) / totalImages) * 100));
            }

            // Combine existing (kept) and new images
            const finalImageUrls = [...imageUrls, ...newImageUrls];

            // Update Document with final image list
            await updateDoc(propertyRef, { imageUrls: finalImageUrls });

            router.push("/dashboard/propiedades");

        } catch (err: any) {
            console.error(err);
            setError("Error al guardar: " + err.message);
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

                        {/* Autocomplete Search */}
                        {isLoaded && (
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar dirección (Autocompletar)</label>
                                <Autocomplete
                                    onLoad={(autocomplete) => {
                                        // Store autocomplete instance if needed
                                        (window as any).autocomplete = autocomplete;
                                    }}
                                    onPlaceChanged={() => {
                                        const autocomplete = (window as any).autocomplete;
                                        if (autocomplete) {
                                            const place = autocomplete.getPlace();
                                            if (place.geometry && place.geometry.location) {
                                                const lat = place.geometry.location.lat();
                                                const lng = place.geometry.location.lng();

                                                // Extract address components
                                                let calle = '';
                                                let altura = '';
                                                let localidad = '';
                                                let provincia = '';

                                                place.address_components?.forEach((component: any) => {
                                                    const types = component.types;
                                                    if (types.includes('route')) {
                                                        calle = component.long_name;
                                                    }
                                                    if (types.includes('street_number')) {
                                                        altura = component.long_name;
                                                    }
                                                    if (types.includes('locality') || types.includes('sublocality')) {
                                                        localidad = component.long_name;
                                                    }
                                                    if (types.includes('administrative_area_level_1')) {
                                                        provincia = component.long_name;
                                                    }
                                                });

                                                setFormData(prev => ({
                                                    ...prev,
                                                    lat,
                                                    lng,
                                                    calle: calle || prev.calle,
                                                    altura: altura || prev.altura,
                                                    localidad: localidad || prev.localidad,
                                                    provincia: provincia || prev.provincia
                                                }));
                                            }
                                        }
                                    }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Escribí la dirección..."
                                        className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </Autocomplete>
                                <MapPin className="absolute left-3 top-[38px] text-gray-400 w-5 h-5" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.provincia_id}
                                    onChange={handleProvinciaChange}
                                >
                                    <option value="">Seleccionar...</option>
                                    {provincias.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Localidad / Barrio</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.localidad_id}
                                    onChange={handleLocalidadChange}
                                    disabled={!formData.provincia_id}
                                >
                                    <option value="">Seleccionar...</option>
                                    {localidades.map(l => (
                                        <option key={l.id} value={l.id}>{l.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Calle</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.calle}
                                    onChange={(e) => handleChange('calle', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Altura</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.altura}
                                    onChange={(e) => handleChange('altura', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="h-[400px] rounded-xl overflow-hidden border border-gray-200">
                            {isLoaded ? (
                                <Map
                                    lat={formData.lat}
                                    lng={formData.lng}
                                    onLocationSelect={(lat: number, lng: number) => {
                                        setFormData(prev => ({ ...prev, lat, lng }));
                                    }}
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 3: // Characteristics
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-semibold">Características principales</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Superficie Total (m²)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.area_total}
                                    onChange={(e) => handleChange('area_total', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Superficie Cubierta (m²)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.area_covered}
                                    onChange={(e) => handleChange('area_covered', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Ambientes', field: 'rooms' },
                                { label: 'Dormitorios', field: 'bedrooms' },
                                { label: 'Baños', field: 'bathrooms' },
                                { label: 'Toilettes', field: 'toilettes' },
                                { label: 'Cocheras', field: 'garages' },
                            ].map(item => (
                                <div key={item.field}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{item.label}</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={(formData as any)[item.field]}
                                        onChange={(e) => handleChange(item.field, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Antigüedad</label>
                            <div className="flex gap-4 mb-4">
                                {['A estrenar', 'Años de antigüedad', 'En construcción'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleChange('antiquity_type', type)}
                                        className={`px-4 py-2 rounded-lg border text-sm ${formData.antiquity_type === type
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            {formData.antiquity_type === 'Años de antigüedad' && (
                                <input
                                    type="number"
                                    placeholder="Cantidad de años"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.antiquity_years}
                                    onChange={(e) => handleChange('antiquity_years', e.target.value)}
                                />
                            )}
                        </div>
                    </div>
                );

            case 4: // Price
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-semibold">Valor de la propiedad</h2>

                        <div className="flex gap-4">
                            <div className="w-32">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.currency}
                                    onChange={(e) => handleChange('currency', e.target.value)}
                                >
                                    <option value="USD">USD</option>
                                    <option value="ARS">ARS</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Precio</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.price}
                                    onChange={(e) => handleChange('price', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Expensas (Mensual)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-500">$</span>
                                <input
                                    type="number"
                                    className="w-full p-3 pl-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                        <h2 className="text-xl font-semibold">Fotos y Videos</h2>

                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleImageSelect}
                            />
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Hacé clic para subir fotos</p>
                                    <p className="text-sm text-gray-500">o arrastrá y soltá los archivos acá</p>
                                </div>
                            </div>
                        </div>

                        {previews.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {previews.map((src, index) => (
                                    <div key={index} className="relative aspect-[4/3] group">
                                        <img
                                            src={src}
                                            alt={`Preview ${index}`}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 6: // Description
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-semibold">Descripción del aviso</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Título del aviso</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ej. Hermoso departamento 2 ambientes en Palermo"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción detallada</label>
                            <textarea
                                rows={8}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Describí las características, ubicación, estado, etc..."
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                            />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <StepIndicator currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mt-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {renderStep()}

                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                    <button
                        onClick={prevStep}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${currentStep === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        disabled={currentStep === 1}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Anterior
                    </button>

                    <button
                        onClick={nextStep}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {uploadProgress > 0 ? `Subiendo ${uploadProgress}%` : 'Publicando...'}
                            </>
                        ) : (
                            <>
                                {currentStep === STEPS.length ? (isEditing ? 'Guardar Cambios' : 'Publicar') : 'Siguiente'}
                                {currentStep !== STEPS.length && <ChevronRight className="w-5 h-5" />}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
