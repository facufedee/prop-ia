"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/ui/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/infrastructure/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { X, Upload, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingModal() {
    const { user, userData } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [agencyName, setAgencyName] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userData || !user) return;

        const needsOnboarding = !userData.agencyName || !userData.photoURL;
        const skips = userData.onboardingSkips || 0;

        if (needsOnboarding && skips < 2) {
            setIsOpen(true);
            setAgencyName(userData.agencyName || "");
            setPreviewUrl(userData.photoURL || null);
        }
    }, [userData, user]);

    if (!isOpen || !user) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!agencyName.trim() && !logoFile) {
            toast.error("Por favor ingresa al menos un dato o haz clic en Omitir.");
            return;
        }

        setLoading(true);
        try {
            let newLogoUrl = previewUrl;

            if (logoFile) {
                const storageRef = ref(storage, `logos/${user.uid}/${logoFile.name}`);
                await uploadBytes(storageRef, logoFile);
                newLogoUrl = await getDownloadURL(storageRef);
            }

            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                agencyName: agencyName.trim(),
                photoURL: newLogoUrl || "",
                // Reset skips on successful save if it's completed
                ...(agencyName.trim() && newLogoUrl ? { onboardingSkips: 2 } : {})
            });

            toast.success("¡Datos guardados correctamente!");
            setIsOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar los datos.");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        const skips = (userData?.onboardingSkips || 0) + 1;
        setIsOpen(false);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { onboardingSkips: skips });
        } catch (error) {
            console.error("Error skipping onboarding:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">¡Bienvenido a Zeta Prop!</h2>
                            <p className="text-sm text-gray-500 mt-1">Completa tu perfil para que tus clientes te reconozcan.</p>
                        </div>
                        <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la Inmobiliaria</label>
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Logo preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <Building2 className="h-8 w-8 text-gray-400" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="h-6 w-6 text-white" />
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                                <div className="text-sm text-gray-500">
                                    Sube tu logo en formato cuadrado (JPG o PNG, máx. 5MB).
                                </div>
                            </div>
                        </div>

                        {/* Agency Name */}
                        <div>
                            <label htmlFor="modalAgencyName" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre de la Inmobiliaria
                            </label>
                            <input
                                id="modalAgencyName"
                                type="text"
                                className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 sm:text-sm"
                                placeholder="Ej: Inmobiliaria Centro"
                                value={agencyName}
                                onChange={(e) => setAgencyName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={handleSkip}
                            disabled={loading}
                            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Omitir por ahora
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 transition-colors flex justify-center items-center gap-2"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            Guardar datos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
