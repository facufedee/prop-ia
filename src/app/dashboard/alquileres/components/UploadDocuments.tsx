"use client";

import { useState } from "react";
import { storage } from "@/infrastructure/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Upload, X, FileText, CheckCircle } from "lucide-react";

interface UploadDocumentsProps {
    alquilerId: string;
    inquilinoId: string;
    onDocumentsUploaded: (urls: string[]) => void;
    existingDocuments?: string[];
}

type DocumentType =
    | 'recibo_sueldo'
    | 'monotributo'
    | 'seguro_caucion'
    | 'dni_frente'
    | 'dni_dorso'
    | 'servicio_luz'
    | 'servicio_gas'
    | 'servicio_agua'
    | 'otro';

interface DocumentFile {
    file: File;
    type: DocumentType;
    preview?: string;
    uploading?: boolean;
    uploaded?: boolean;
    url?: string;
}

const DOCUMENT_LABELS: Record<DocumentType, string> = {
    recibo_sueldo: 'Recibo de Sueldo',
    monotributo: 'Constancia de Monotributo',
    seguro_caucion: 'Póliza de Seguro de Caución',
    dni_frente: 'DNI Frente',
    dni_dorso: 'DNI Dorso',
    servicio_luz: 'Servicio de Luz',
    servicio_gas: 'Servicio de Gas',
    servicio_agua: 'Servicio de Agua',
    otro: 'Otro Documento',
};

export default function UploadDocuments({
    alquilerId,
    inquilinoId,
    onDocumentsUploaded,
    existingDocuments = []
}: UploadDocumentsProps) {
    const [documents, setDocuments] = useState<DocumentFile[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
        const files = Array.from(e.target.files || []);

        const newDocs: DocumentFile[] = files.map(file => ({
            file,
            type,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        }));

        setDocuments(prev => [...prev, ...newDocs]);
    };

    const removeDocument = (index: number) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const uploadDocuments = async () => {
        setUploading(true);
        const uploadedUrls: string[] = [];

        try {
            for (let i = 0; i < documents.length; i++) {
                const doc = documents[i];

                // Update status
                setDocuments(prev => prev.map((d, idx) =>
                    idx === i ? { ...d, uploading: true } : d
                ));

                // Upload to Firebase Storage
                const fileName = `alquileres/${alquilerId}/${doc.type}_${Date.now()}_${doc.file.name}`;
                if (!storage) throw new Error("Firebase Storage not initialized");
                const storageRef = ref(storage, fileName);

                await uploadBytes(storageRef, doc.file);
                const url = await getDownloadURL(storageRef);

                uploadedUrls.push(url);

                // Update status
                setDocuments(prev => prev.map((d, idx) =>
                    idx === i ? { ...d, uploading: false, uploaded: true, url } : d
                ));
            }

            onDocumentsUploaded(uploadedUrls);

            // Clear documents after successful upload
            setTimeout(() => {
                setDocuments([]);
            }, 2000);

        } catch (error) {
            console.error("Error uploading documents:", error);
            alert("Error al subir documentos");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cargar Documentos</h3>

                {/* Document Type Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {(Object.keys(DOCUMENT_LABELS) as DocumentType[]).map(type => (
                        <div key={type} className="relative">
                            <label className="flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <Upload className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">
                                        {DOCUMENT_LABELS[type]}
                                    </span>
                                </div>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(e, type)}
                                />
                            </label>
                        </div>
                    ))}
                </div>

                {/* Selected Documents */}
                {documents.length > 0 && (
                    <div className="space-y-3 mb-6">
                        <h4 className="text-sm font-medium text-gray-700">Documentos Seleccionados</h4>
                        {documents.map((doc, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    {doc.uploaded ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <FileText className="w-5 h-5 text-gray-400" />
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {DOCUMENT_LABELS[doc.type]}
                                        </p>
                                        <p className="text-xs text-gray-500">{doc.file.name}</p>
                                    </div>
                                </div>

                                {doc.uploading && (
                                    <div className="text-sm text-indigo-600">Subiendo...</div>
                                )}

                                {doc.uploaded && (
                                    <div className="text-sm text-green-600">✓ Subido</div>
                                )}

                                {!doc.uploading && !doc.uploaded && (
                                    <button
                                        onClick={() => removeDocument(index)}
                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload Button */}
                {documents.length > 0 && (
                    <button
                        onClick={uploadDocuments}
                        disabled={uploading || documents.every(d => d.uploaded)}
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? "Subiendo documentos..." : "Subir Todos los Documentos"}
                    </button>
                )}

                {/* Existing Documents */}
                {existingDocuments.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Documentos Cargados</h4>
                        <div className="space-y-2">
                            {existingDocuments.map((url, index) => (
                                <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm text-indigo-600 hover:underline">
                                        Documento {index + 1}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Formatos aceptados:</strong> PDF, JPG, PNG
                    <br />
                    <strong>Tamaño máximo:</strong> 10MB por archivo
                </p>
            </div>
        </div>
    );
}
