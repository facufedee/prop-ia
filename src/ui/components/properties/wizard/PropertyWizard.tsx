"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "./StepIndicator";
import { ChevronLeft, ChevronRight, Loader2, Upload, X, MapPin, Sparkles } from "lucide-react";
import { app, db, storage, auth } from "@/infrastructure/firebase/client";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { locationService, Provincia, Localidad } from "@/infrastructure/services/locationService";
import { useBranchContext } from "@/infrastructure/context/BranchContext";
import { auditLogService } from "@/infrastructure/services/auditLogService";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import LimitReachedModal from "@/ui/components/modals/LimitReachedModal";
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
    "Multimedia"
];

const AMENITIES_LIST = [
    "Parrilla",
    "Apto mascotas",
    "Apto profesional",
    "Preinstalación de A/A",
    "Luminoso",
    "Laundry",
    "Calefacción individual",
    "Gimnasio",
    "Pileta",
    "SUM",
    "Balcón",
    "Terraza",
    "Seguridad",
    "Sauna"
];

const SERVICES_LIST = [
    "Agua Corriente",
    "Cloaca",
    "Gas Natural",
    "Internet",
    "Electricidad",
    "Pavimento",
    "Teléfono",
    "Cable"
];

const ROOMS_LIST = [
    "Cocina",
    "Hall",
    "Jardín",
    "Lavadero",
    "Living comedor",
    "Patio",
    "Toilette",
    "Escritorio",
    "Vestidor"
];

const CONDITIONS_LIST = ["A estrenar", "Muy bueno", "Bueno", "Regular", "A refaccionar"];
const SITUATIONS_LIST = ["Habitada", "Vacía", "Alquilada"];
const ORIENTATIONS_LIST = ["Norte", "Sur", "Este", "Oeste", "Noreste", "Noroeste", "Sureste", "Suroeste"];


export interface PropertyData {
    title: string;
    operation_type: string;
    property_type: string;
    property_subtype: string;
    apto_profesional: boolean;
    apto_mascotas: boolean;
    provincia: string;
    provincia_id: string;
    localidad: string;
    localidad_id: string;
    calle: string;
    altura: string;
    piso: string;
    depto: string;
    entre_calle_1: string;
    entre_calle_2: string;
    barrio_cerrado: boolean;
    lat: number;
    lng: number;
    area_total: string;
    area_covered: string;
    area_semi_covered: string;
    area_uncovered: string;
    land_measures: string;
    land_width: string;
    land_length: string;
    rooms: string;
    bedrooms: string;
    bathrooms: string;
    toilettes: string;
    garages: string;
    floors: string;
    heating_type: string;
    water_heating_type: string;
    amenities: string[];
    services: string[];
    room_tags: string[];
    antiquity_type: string;
    antiquity_years: string;
    condition: string;
    situation: string;
    orientation: string;
    currency: string;
    price: string;
    expenses: string;
    hasExpenses: boolean;
    video_url: string;
    virtual_tour_url: string;
    description: string;
    publishToPortal: boolean;
    coverImageIndex: number;
    // Additional fields needed for logic
    imageUrls?: string[];
    id?: string;
    branchId?: string;
}

interface PropertyWizardProps {
    initialData?: Partial<PropertyData>;
    isEditing?: boolean;
    onSuccessRedirect?: string;
}

export default function PropertyWizard({ initialData, isEditing = false, ...props }: PropertyWizardProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { selectedBranchId } = useBranchContext();


    // Limit Modal State
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [currentLimit, setCurrentLimit] = useState<number | string>(5);

    // Form State
    const [formData, setFormData] = useState<PropertyData>({
        // Step 1: Operation & Basic Data
        title: initialData?.title || '', // Moved from Step 6
        operation_type: initialData?.operation_type || 'Venta',
        property_type: initialData?.property_type || 'Departamento',
        property_subtype: initialData?.property_subtype || '',
        apto_profesional: initialData?.apto_profesional || false,
        apto_mascotas: initialData?.apto_mascotas || false,

        // Step 2: Location
        provincia: initialData?.provincia || '',
        provincia_id: initialData?.provincia_id || '',
        localidad: initialData?.localidad || '',
        localidad_id: initialData?.localidad_id || '',
        calle: initialData?.calle || '',
        altura: initialData?.altura || '',
        piso: initialData?.piso || '',
        depto: initialData?.depto || '',
        entre_calle_1: initialData?.entre_calle_1 || '',
        entre_calle_2: initialData?.entre_calle_2 || '',
        barrio_cerrado: initialData?.barrio_cerrado || false,
        lat: initialData?.lat || -34.6037,
        lng: initialData?.lng || -58.3816,

        // Step 3: Characteristics
        area_total: initialData?.area_total || '',
        area_covered: initialData?.area_covered || '',
        area_semi_covered: initialData?.area_semi_covered || '',
        area_uncovered: initialData?.area_uncovered || '',
        land_measures: initialData?.land_measures || '',
        land_width: initialData?.land_width || '',
        land_length: initialData?.land_length || '',
        rooms: initialData?.rooms || '',
        bedrooms: initialData?.bedrooms || '',
        bathrooms: initialData?.bathrooms || '',
        toilettes: initialData?.toilettes || '',
        garages: initialData?.garages || '',
        floors: initialData?.floors || '',

        heating_type: initialData?.heating_type || '',
        water_heating_type: initialData?.water_heating_type || '',

        amenities: initialData?.amenities || [],
        services: initialData?.services || [],
        room_tags: initialData?.room_tags || [],

        antiquity_type: initialData?.antiquity_type || 'A estrenar',
        antiquity_years: initialData?.antiquity_years || '',
        condition: initialData?.condition || 'Muy bueno',
        situation: initialData?.situation || 'Habitada',
        orientation: initialData?.orientation || 'Norte',

        // Step 4: Price
        currency: initialData?.currency || 'USD',
        price: initialData?.price || '',
        expenses: initialData?.expenses || '',
        hasExpenses: initialData?.expenses ? true : false,

        // Step 5: Multimedia
        video_url: initialData?.video_url || '',
        virtual_tour_url: initialData?.virtual_tour_url || '',

        // Step 6: Description (Description remains here)
        description: initialData?.description || '',

        // Options
        publishToPortal: initialData?.publishToPortal || false,
        coverImageIndex: initialData?.coverImageIndex || 0,
    });

    // Step 5: Multimedia State
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>(initialData?.imageUrls || []);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Location Data State
    const [provincias, setProvincias] = useState<Provincia[]>([]);
    const [localidades, setLocalidades] = useState<Localidad[]>([]);

    // Google Maps API Key
    // Google Maps API Key
    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: libraries
    });

    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

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

    // Auto-calculate Land Area
    useEffect(() => {
        const width = parseFloat(formData.land_width);
        const length = parseFloat(formData.land_length);
        if (!isNaN(width) && !isNaN(length) && width > 0 && length > 0) {
            const area = (width * length).toFixed(2);
            // Only update if different to avoid loop
            if (formData.area_total !== area) {
                setFormData(prev => ({ ...prev, area_total: area, land_measures: `${width}x${length}` }));
            }
        }
    }, [formData.land_width, formData.land_length]);

    const handleChange = (field: keyof PropertyData, value: any) => {
        // Validation Logic
        if (typeof value === 'string') {
            // 1. Integer Fields (Rooms, Bedrooms, etc, Antiguety)
            const integerFields = ['rooms', 'bedrooms', 'bathrooms', 'toilettes', 'garages', 'floors', 'antiquity_years'];
            if (integerFields.includes(field)) {
                // Remove ANY non-digit character
                value = value.replace(/\D/g, '');

                // Apply specific length limits
                if (field === 'antiquity_years') {
                    if (value.length > 4) value = value.slice(0, 4);
                } else {
                    // Rooms, baths, etc max 3 digits (e.g. 999 is plenty)
                    if (value.length > 3) value = value.slice(0, 3);
                }
            }


            // 2. Decimal/Float Fields (Surfaces, Prices)
            const decimalFields = ['area_total', 'area_covered', 'area_uncovered', 'area_semi_covered', 'price', 'expenses', 'land_width', 'land_length'];
            if (decimalFields.includes(field)) {
                // Allow digits and ONLY one dot
                // First remove anything that is not digit or dot
                value = value.replace(/[^0-9.]/g, '');

                // Ensure only one dot exists
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }

                // Limit overall length
                if (value.length > 15) value = value.slice(0, 15);

                // Auto-calculation logic for Land Area
                if (field === 'land_width' || field === 'land_length') {
                    const width = field === 'land_width' ? value : formData.land_width;
                    const length = field === 'land_length' ? value : formData.land_length;

                    if (Number(width) > 0 && Number(length) > 0) {
                        const area = (parseFloat(width) * parseFloat(length)).toFixed(2);
                        // Using a timeout to avoid state update conflict within render cycle if we were using useEffect, 
                        // but here in event handler it's fine to queue another update or just update all at once?
                        // Better to update all at once to avoid double render, but setFormData accepts prev.
                        // We can't update 'area_total' synchronously easily here because we need 'value' which is being set.
                        // So we'll trust the useEffect approach or do it here. 
                        // Let's do it in a useEffect to be cleaner and handle initial values too.
                    }
                }
            }

            // 3. Text Limits
            if (field === 'land_measures' && value.length > 25) {
                value = value.slice(0, 25);
            }
        }

        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error if present
        if (error) setError(null);
    };

    const handleAmenityToggle = (amenity: string) => {
        setFormData(prev => {
            const current = prev.amenities || [];
            if (current.includes(amenity)) {
                return { ...prev, amenities: current.filter((a: string) => a !== amenity) };
            } else {
                return { ...prev, amenities: [...current, amenity] };
            }
        });
    };

    const handleServiceToggle = (service: string) => {
        setFormData(prev => {
            const current = (prev as any).services || [];
            if (current.includes(service)) {
                return { ...prev, services: current.filter((s: string) => s !== service) };
            } else {
                return { ...prev, services: [...current, service] };
            }
        });
    };

    const handleRoomTagToggle = (room: string) => {
        setFormData(prev => {
            const current = (prev as any).room_tags || [];
            if (current.includes(room)) {
                return { ...prev, room_tags: current.filter((r: string) => r !== room) };
            } else {
                return { ...prev, room_tags: [...current, room] };
            }
        });
    };

    const handleProvinciaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provinciaId = e.target.value;
        const provincia = provincias.find(p => p.id === provinciaId);

        console.log("Selected Province ID:", provinciaId, "Name:", provincia?.nombre);

        handleChange('provincia_id', provinciaId);
        handleChange('provincia', provincia?.nombre || '');
        handleChange('localidad_id', '');
        handleChange('localidad', '');

        if (provinciaId) {
            try {
                const locs = await locationService.getLocalidades(provinciaId);
                console.log(`Fetched ${locs.length} localities for province ${provinciaId}`);
                setLocalidades(locs);
            } catch (error) {
                console.error("Error fetching localities manual:", error);
                setLocalidades([]);
            }
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
        if (!validateStep(currentStep)) return; // Stop if validation fails

        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            handleSubmit();
        }
    };

    const validateStep = (step: number) => {
        setError(null);

        if (step === 3) { // Characteristics Validation
            const {
                area_total, area_covered,
                rooms, bedrooms, bathrooms, garages
            } = formData;

            // 1. Basic Number & Negative checks
            if (Number(area_total) < 0 || Number(area_covered) < 0 || Number(formData.area_semi_covered) < 0 || Number(formData.area_uncovered) < 0) {
                setError("Las superficies no pueden ser negativas.");
                return false;
            }
            if (Number(rooms) < 0 || Number(bedrooms) < 0 || Number(bathrooms) < 0 || Number(garages) < 0) {
                setError("Las cantidades no pueden ser negativas.");
                return false;
            }

            // 2. Logical Checks
            if (Number(area_covered) > Number(area_total)) {
                setError("La superficie cubierta no puede ser mayor a la total.");
                return false;
            }

            // 3. Reasonable Max Limits
            if (Number(area_total) > 100000) {
                setError("La superficie total parece incorrecta (máx 100.000 m²).");
                return false;
            }
            if (Number(rooms) > 50) {
                setError("La cantidad de ambientes excede el límite permitido (máx 50).");
                return false;
            }
            if (Number(bedrooms) > Number(rooms)) {
                setError("No puede haber más dormitorios que ambientes totales.");
                return false;
            }
            if (Number(bathrooms) > 20) {
                setError("La cantidad de baños excede el límite permitido.");
                return false;
            }

            // 4. "002" Leading Zero cleanup is handled in handleChange (see below modification)
        }

        return true;
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        if (!auth?.currentUser) return;

        // Check limits before proceeding (only for creation)
        if (!isEditing && !initialData?.id) {
            setLoading(true);
            try {
                const limitCheck = await subscriptionService.checkUsageLimit(auth.currentUser.uid, 'properties');
                if (!limitCheck.allowed) {
                    setCurrentLimit(limitCheck.limit);
                    setShowLimitModal(true);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Error checking limits:", err);
                // Optional: decide if we block or allow on error. Blocking is safer for business.
                setError("Error verificando límites del plan.");
                setLoading(false);
                return;
            }
        }

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
                if (!db) throw new Error("Firestore not initialized");
                propertyRef = doc(db, "properties", initialData.id);
                await updateDoc(propertyRef, {
                    ...formData,
                    updatedAt: new Date(),
                    imageUrls: imageUrls, // Will be updated with new ones below
                    branchId: selectedBranchId !== 'all' ? selectedBranchId : (initialData?.branchId || null)
                });
            } else {
                // Create new document
                if (!db) throw new Error("Firestore not initialized");
                const docRef = await addDoc(collection(db, "properties"), {
                    ...formData,
                    userId: auth.currentUser?.uid,
                    createdAt: new Date(),
                    status: 'active',
                    imageUrls: [],
                    branchId: selectedBranchId !== 'all' ? selectedBranchId : null
                });
                propertyRef = docRef; // docRef is a DocumentReference
            }

            // Upload NEW Images
            const totalImages = images.length;
            const newImageUrls: string[] = [];

            for (let i = 0; i < totalImages; i++) {
                const image = images[i];
                // Use propertyRef.id (works for both new and existing docs)
                if (!storage) throw new Error("Firebase Storage not initialized");
                const storageRef = ref(storage, `properties/${auth.currentUser?.uid}/${propertyRef.id}/${image.name}-${Date.now()}`);
                await uploadBytes(storageRef, image);
                const url = await getDownloadURL(storageRef);
                newImageUrls.push(url);
                setUploadProgress(Math.round(((i + 1) / totalImages) * 100));
            }

            // Combine existing (kept) and new images
            const finalImageUrls = [...imageUrls, ...newImageUrls];

            // Update Document with final image list
            await updateDoc(propertyRef, { imageUrls: finalImageUrls });

            // Create Audit Log
            try {
                const action = isEditing && initialData?.id ? 'property_update' : 'property_create';
                const address = `${formData.calle} ${formData.altura}, ${formData.localidad}`;

                await auditLogService.logProperty(
                    auth.currentUser?.uid || '',
                    auth.currentUser?.email || '',
                    auth.currentUser?.displayName || 'Usuario',
                    action,
                    propertyRef.id,
                    address,
                    "default-org-id", // TODO: Replace with actual org ID if available
                    {
                        operation: formData.operation_type,
                        price: formData.price,
                        currency: formData.currency
                    }
                );
                // Log existing check
            } catch (logErr) {
                console.error("Error creating audit log:", logErr);
            }

            if ((props as any).onSuccessRedirect) {
                const redirectUrl = (props as any).onSuccessRedirect;
                // Add the new ID to the redirect URL
                const separator = redirectUrl.includes('?') ? '&' : '?';
                router.push(`${redirectUrl}${separator}createdPropertyId=${propertyRef.id}`);
            } else {
                router.push("/dashboard/propiedades");
            }

        } catch (err: any) {
            console.error(err);
            setError("Error al guardar: " + err.message);
            setLoading(false);
        }
    };


    const handleStepClick = (step: number) => {
        // Allow going back always
        if (step < currentStep) {
            setCurrentStep(step);
            window.scrollTo(0, 0);
            return;
        }

        // Allow going forward only one step at a time and if current is valid
        if (step === currentStep + 1) {
            if (validateStep(currentStep)) {
                setCurrentStep(step);
                window.scrollTo(0, 0);
            }
        }

        // You could also allow jumping forward to any step if all intermediate steps are valid,
        // but that requires more complex validation logic. 
        // For now, next step or back steps.
    };

    // Render Steps
    const renderStep = () => {
        switch (currentStep) {
            // Operation & Type
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-4">
                            {/* Portal Publication Toggle */}
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, publishToPortal: !prev.publishToPortal }))}
                                className={`rounded-xl p-5 border-2 flex items-start gap-4 transition-all cursor-pointer hover:shadow-md ${formData.publishToPortal ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="flex-1">
                                    <h3 className={`font-semibold text-lg ${formData.publishToPortal ? 'text-green-900' : 'text-gray-900'}`}>
                                        ¿Querés llegar a más clientes?
                                    </h3>
                                    <p className={`text-sm mt-1 leading-relaxed ${formData.publishToPortal ? 'text-green-800' : 'text-gray-600'}`}>
                                        Al activar esta opción, aceptás publicar tu propiedad en nuestro portal exclusivo para alcanzar a miles de interesados.
                                        <br />
                                        <span className={`text-xs mt-1 block font-medium ${formData.publishToPortal ? 'text-green-700' : 'text-gray-500'}`}>
                                            Aplican Términos y Condiciones.
                                        </span>
                                    </p>
                                </div>
                                <div className="relative inline-block w-14 mr-2 align-middle select-none transition duration-200 ease-in mt-1">
                                    <input
                                        type="checkbox"
                                        name="toggle"
                                        id="portal-toggle"
                                        className="toggle-checkbox absolute block w-7 h-7 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:right-0 right-7 transition-all"
                                        checked={formData.publishToPortal}
                                        readOnly // Controlled by div onClick
                                    />
                                    <label
                                        htmlFor="portal-toggle"
                                        className={`toggle-label block overflow-hidden h-7 rounded-full cursor-pointer transition-colors ${formData.publishToPortal ? 'bg-green-500' : 'bg-gray-300'}`}
                                    ></label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Título de la publicación <span className="text-gray-400 font-normal">(Opcional)</span></label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 text-gray-900 font-medium"
                                placeholder="Ej. Hermoso departamento en Recoleta con balcón aterrazado"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de operación</label>
                            <div className="flex gap-4">
                                {['Venta', 'Alquiler', 'Temporada'].map(op => (
                                    <button
                                        key={op}
                                        onClick={() => {
                                            // Handle special case for currency
                                            const newCurrency = op === 'Alquiler' ? 'ARS' : 'USD';
                                            setFormData(prev => ({ ...prev, operation_type: op, currency: newCurrency }));
                                        }}
                                        className={`flex-1 py-3 px-4 rounded-xl border transition-all ${formData.operation_type === op
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
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
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans text-base bg-white appearance-none text-gray-900 font-medium"
                                    value={formData.property_type}
                                    onChange={(e) => handleChange('property_type', e.target.value)}
                                    style={{ fontFamily: 'inherit' }}
                                >
                                    <option value="Departamento">Departamento</option>
                                    <option value="Bodega-Galpon">Bodega-Galpon</option>
                                    <option value="Bóveda, nicho o parcela">Bóveda, nicho o parcela</option>
                                    <option value="Cama Náutica">Cama Náutica</option>
                                    <option value="Casa">Casa</option>
                                    <option value="Consultorio">Consultorio</option>
                                    <option value="Depósito">Depósito</option>
                                    <option value="Edificio">Edificio</option>
                                    <option value="Fondo de comercio">Fondo de comercio</option>
                                    <option value="Cochera">Cochera</option>
                                    <option value="Hotel">Hotel</option>
                                    <option value="Local comercial">Local comercial</option>
                                    <option value="Oficina comercial">Oficina comercial</option>
                                    <option value="PH">PH</option>
                                    <option value="Quinta Vacacional">Quinta Vacacional</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subtipo (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    placeholder="Ej. Duplex, Loft"
                                    value={formData.property_subtype}
                                    onChange={(e) => handleChange('property_subtype', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6 pt-2">
                            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition w-full md:w-auto">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                    checked={formData.apto_profesional}
                                    onChange={(e) => handleChange('apto_profesional', e.target.checked)}
                                />
                                <span className="text-gray-700 font-medium">Apto Profesional</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition w-full md:w-auto">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                    checked={formData.apto_mascotas}
                                    onChange={(e) => handleChange('apto_mascotas', e.target.checked)}
                                />
                                <span className="text-gray-700 font-medium">Apto Mascotas</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción detallada</label>
                            <textarea
                                rows={6}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                placeholder="Describí las características, ubicación, estado, etc..."
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                            />
                        </div>
                    </div >
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
                                        autocompleteRef.current = autocomplete;
                                        // Restrict to Argentina
                                        autocomplete.setComponentRestrictions({ country: "ar" });
                                        // Also restrict types to address only
                                        autocomplete.setTypes(["address"]);
                                    }}
                                    onPlaceChanged={async () => {
                                        if (autocompleteRef.current) {
                                            const place = autocompleteRef.current.getPlace();
                                            if (place && place.geometry && place.geometry.location) {
                                                const lat = place.geometry.location.lat();
                                                const lng = place.geometry.location.lng();

                                                // Extract address components
                                                let calle = '';
                                                let altura = '';
                                                let localidadName = '';
                                                let sublocalidadName = '';
                                                let provinciaName = '';

                                                place.address_components?.forEach((component: any) => {
                                                    const types = component.types;
                                                    if (types.includes('route')) {
                                                        calle = component.long_name;
                                                    }
                                                    if (types.includes('street_number')) {
                                                        altura = component.long_name;
                                                    }
                                                    if (types.includes('locality')) {
                                                        localidadName = component.long_name;
                                                    }
                                                    if (types.includes('sublocality')) {
                                                        sublocalidadName = component.long_name;
                                                    }
                                                    if (types.includes('administrative_area_level_1')) {
                                                        provinciaName = component.long_name;
                                                    }
                                                });

                                                // Update Basic Data
                                                setFormData(prev => ({
                                                    ...prev,
                                                    lat,
                                                    lng,
                                                    calle: calle || prev.calle,
                                                    altura: altura || prev.altura,
                                                }));

                                                // Fuzzy Match Helper
                                                const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace("province", "").trim();

                                                // 1. Find and Set Provincia
                                                let provinciaId = '';
                                                let pMatch = null;

                                                if (provinciaName) {
                                                    const cleanProv = normalize(provinciaName);

                                                    // Map common variations specifically for BsAs
                                                    if (cleanProv.includes("ciudad autonoma") || cleanProv === "caba") {
                                                        pMatch = provincias.find(p => p.id === "02" || normalize(p.nombre).includes("ciudad autonoma"));
                                                    } else if (cleanProv === "buenos aires") {
                                                        pMatch = provincias.find(p => p.id === "06");
                                                    } else {
                                                        pMatch = provincias.find(p => normalize(p.nombre) === cleanProv || normalize(p.nombre).includes(cleanProv) || cleanProv.includes(normalize(p.nombre)));
                                                    }

                                                    if (pMatch) {
                                                        provinciaId = pMatch.id;
                                                        // Update province immediately
                                                        setFormData(prev => ({ ...prev, provincia_id: provinciaId, provincia: pMatch!.nombre }));

                                                        // 2. Fetch Localities for this Province
                                                        try {
                                                            const locs = await locationService.getLocalidades(provinciaId);
                                                            setLocalidades(locs);

                                                            // 3. Find and Set Localidad
                                                            // Try locality first, then sublocality
                                                            const targetLoc = localidadName || sublocalidadName;

                                                            if (targetLoc) {
                                                                const cleanLoc = normalize(targetLoc);

                                                                // Try exact match first, then includes
                                                                let locMatch = locs.find(l => normalize(l.nombre) === cleanLoc);

                                                                // Robust fuzzy matching
                                                                if (!locMatch) {
                                                                    // 1. Try includes check
                                                                    locMatch = locs.find(l => normalize(l.nombre).includes(cleanLoc) || cleanLoc.includes(normalize(l.nombre)));

                                                                    // 2. Try removing common prefixes if still not found
                                                                    if (!locMatch) {
                                                                        const targetClean = cleanLoc.replace("partido de ", "").replace("departamento de ", "");
                                                                        locMatch = locs.find(l => {
                                                                            const sourceClean = normalize(l.nombre).replace("partido de ", "").replace("departamento de ", "");
                                                                            return sourceClean === targetClean || sourceClean.includes(targetClean) || targetClean.includes(sourceClean);
                                                                        });
                                                                    }
                                                                }

                                                                if (locMatch) {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        localidad_id: locMatch!.id,
                                                                        localidad: locMatch!.nombre
                                                                    }));
                                                                }
                                                            }
                                                        } catch (err) {
                                                            console.error("Error fetching localities in autocomplete:", err);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Escribí la dirección..."
                                        className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    />
                                </Autocomplete>
                                <MapPin className="absolute left-3 top-[38px] text-gray-400 w-5 h-5" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans text-gray-900 font-medium"
                                    value={formData.provincia_id}
                                    onChange={handleProvinciaChange}
                                    style={{ fontFamily: 'inherit' }}
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
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans text-gray-900 font-medium"
                                    value={formData.localidad_id}
                                    onChange={handleLocalidadChange}
                                    disabled={!formData.provincia_id}
                                    style={{ fontFamily: 'inherit' }}
                                >
                                    <option value="">Seleccionar...</option>
                                    {localidades.map(l => (
                                        <option key={l.id} value={l.id}>{l.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Calle</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    value={formData.calle}
                                    onChange={(e) => handleChange('calle', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nro. Calle</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    value={formData.altura}
                                    onChange={(e) => handleChange('altura', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Piso</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                        value={formData.piso}
                                        onChange={(e) => handleChange('piso', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Depto</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                        value={formData.depto}
                                        onChange={(e) => handleChange('depto', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Entre calle 1</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    value={formData.entre_calle_1}
                                    onChange={(e) => handleChange('entre_calle_1', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Entre calle 2</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    value={formData.entre_calle_2}
                                    onChange={(e) => handleChange('entre_calle_2', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="barrio_cerrado"
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                checked={formData.barrio_cerrado}
                                onChange={(e) => handleChange('barrio_cerrado', e.target.checked)}
                            />
                            <label htmlFor="barrio_cerrado" className="text-sm text-gray-700">Esta propiedad pertenece a un country / barrio cerrado</label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ancho del terreno (m)</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Ej. 8.66"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    value={formData.land_width}
                                    onChange={(e) => handleChange('land_width', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Largo del terreno (m)</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Ej. 30"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    value={formData.land_length}
                                    onChange={(e) => handleChange('land_length', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Superficie Terreno (m²)</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    value={formData.area_total}
                                    onChange={(e) => handleChange('area_total', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Superficie Cubierta (m²)</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    value={formData.area_covered}
                                    onChange={(e) => handleChange('area_covered', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Superficie Descubierta (m²)</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    value={formData.area_uncovered}
                                    onChange={(e) => handleChange('area_uncovered', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Superficie Semi-cubierta (m²)</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    value={formData.area_semi_covered}
                                    onChange={(e) => handleChange('area_semi_covered', e.target.value)}
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
                                { label: 'Plantas', field: 'floors' },
                            ].map(item => (
                                <div key={item.field}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{item.label}</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                        value={(formData as any)[item.field]}
                                        onChange={(e) => handleChange(item.field as keyof PropertyData, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                                    value={formData.condition}
                                    onChange={(e) => handleChange('condition', e.target.value)}
                                >
                                    {CONDITIONS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Situación</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 font-medium"
                                    value={formData.situation}
                                    onChange={(e) => handleChange('situation', e.target.value)}
                                >
                                    {SITUATIONS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Orientación</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 font-medium"
                                    value={formData.orientation}
                                    onChange={(e) => handleChange('orientation', e.target.value)}
                                >
                                    {ORIENTATIONS_LIST.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Calefacción</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                    value={formData.heating_type}
                                    onChange={(e) => handleChange('heating_type', e.target.value)}
                                >
                                    <option value="">Seleccionar</option>
                                    <option value="Losa radiante">Losa radiante</option>
                                    <option value="Radiadores">Radiadores</option>
                                    <option value="Estufa tiro balanceado">Estufa tiro balanceado</option>
                                    <option value="Aire acondicionado">Aire acondicionado</option>
                                    <option value="Salamandra/Hogar">Salamandra/Hogar</option>
                                    <option value="Otras">Otras</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Agua Caliente</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                    value={formData.water_heating_type}
                                    onChange={(e) => handleChange('water_heating_type', e.target.value)}
                                >
                                    <option value="">Seleccionar</option>
                                    <option value="Termotanque">Termotanque</option>
                                    <option value="Calefón">Calefón</option>
                                    <option value="Caldera dual">Caldera dual</option>
                                    <option value="Central">Central</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {AMENITIES_LIST.map(amenity => (
                                    <button
                                        key={amenity}
                                        onClick={() => handleAmenityToggle(amenity)}
                                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${(formData.amenities || []).includes(amenity)
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{amenity}</span>
                                        {(formData.amenities || []).includes(amenity) && (
                                            <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
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
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                    value={formData.antiquity_years}
                                    onChange={(e) => handleChange('antiquity_years', e.target.value)}
                                />
                            )}
                        </div>
                    </div>
                );

            case 4: // Price
                // Auto-set currency based on operation type when entering/rendering this step
                // Note: Better handled in useEffect or handleChange, but for now we render correctly

                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-semibold">Valor de la propiedad</h2>

                        <div className="flex gap-4">
                            <div className="w-32">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    value={formData.currency}
                                    onChange={(e) => handleChange('currency', e.target.value)}
                                >
                                    <option value="USD">USD</option>
                                    <option value="ARS">ARS</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Precio {formData.operation_type === 'Alquiler' ? '(Mensual)' : ''}
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    value={formData.price}
                                    onChange={(e) => handleChange('price', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="hasExpenses"
                                    checked={formData.hasExpenses}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormData(prev => ({
                                            ...prev,
                                            hasExpenses: checked,
                                            expenses: checked ? prev.expenses : ''
                                        }));
                                    }}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="hasExpenses" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Paga expensas
                                </label>
                            </div>

                            {formData.hasExpenses && (
                                <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        placeholder="Valor mensual aproximado"
                                        className="w-full p-3 pl-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                        value={formData.expenses}
                                        onChange={(e) => handleChange('expenses', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );

            // Operation & Type
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
                                    <div
                                        key={index}
                                        className={`relative aspect-[4/3] group rounded-lg overflow-hidden border-2 transition-all ${(formData as any).coverImageIndex === index
                                            ? 'border-indigo-500 ring-2 ring-indigo-200'
                                            : 'border-transparent hover:border-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={src}
                                            alt={`Preview ${index}`}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Cover Image Badge/Toggle */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFormData(prev => ({ ...prev, coverImageIndex: index }));
                                            }}
                                            className={`absolute top-2 left-2 p-1.5 rounded-full shadow-sm transition-all ${(formData as any).coverImageIndex === index
                                                ? 'bg-indigo-500 text-white opacity-100'
                                                : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-yellow-500'
                                                }`}
                                            title="Establecer como portada"
                                        >
                                            <Sparkles className={`w-4 h-4 ${(formData as any).coverImageIndex === index ? 'fill-current' : ''}`} />
                                        </button>

                                        {(formData as any).coverImageIndex === index && (
                                            <div className="absolute bottom-0 inset-x-0 bg-indigo-500/80 text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider backdrop-blur-sm">
                                                Portada
                                            </div>
                                        )}

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

                        <div className="grid grid-cols-1 gap-6 pt-4 border-t border-gray-100">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Video (YouTube URL)</label>
                                <input
                                    type="text"
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
                                    value={formData.video_url}
                                    onChange={(e) => handleChange('video_url', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <LimitReachedModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                resource="propiedades"
                limit={currentLimit}
            />
            <StepIndicator currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} onStepClick={handleStepClick} />

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

                    <div className="flex gap-3">
                        {isEditing && (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-green-500 text-green-600 rounded-xl font-medium hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
                            </button>
                        )}
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
                                    {currentStep === STEPS.length ? (isEditing ? 'Finalizar Edición' : 'Publicar') : 'Siguiente'}
                                    {currentStep !== STEPS.length && <ChevronRight className="w-5 h-5" />}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
