"use client";

import { useEffect, useState } from "react";
import { app, db, auth } from "@/infrastructure/firebase/client";
import { collection, getDocs, limit, query, addDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { roleService } from "@/infrastructure/services/roleService";

interface CheckItem {
    name: string;
    status: "pending" | "success" | "error" | "warning";
    message?: string;
}

export default function FirebaseCheckPage() {
    const [initChecks, setInitChecks] = useState<CheckItem[]>([]);
    const [envChecks, setEnvChecks] = useState<CheckItem[]>([]);
    const [connCheck, setConnCheck] = useState<CheckItem>({ name: "Firestore Connection", status: "pending", message: "Waiting to test..." });
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // 1. Check Env Vars
        const envVars = [
            "NEXT_PUBLIC_FIREBASE_API_KEY",
            "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
            "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
            "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
            "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
            "NEXT_PUBLIC_FIREBASE_APP_ID",
        ];

        const envResults = envVars.map(varName => ({
            name: varName,
            status: process.env[varName] ? "success" : "error",
            message: process.env[varName] ? "Presente/Cargado" : "FALTA (Undefined)",
        })) as CheckItem[];

        setEnvChecks(envResults);

        // 2. Check Initialization
        const initResults: CheckItem[] = [
            { name: "Firebase App Initialized", status: app ? "success" : "error", message: app ? "OK" : "Failed" },
            { name: "Firestore DB Initialized", status: db ? "success" : "error", message: db ? "OK" : "Failed" },
            { name: "Auth Initialized", status: auth ? "success" : "error", message: auth ? "OK" : "Failed" },
        ];
        setInitChecks(initResults);

    }, []);

    useEffect(() => {
        const unsubscribe = auth?.onAuthStateChanged((u) => {
            setUser(u);
        });
        return () => unsubscribe && unsubscribe();
    }, []);

    const testRoleService = async () => {
        if (!auth?.currentUser) {
            setConnCheck({ name: "Role Service Test", status: "error", message: "Must be logged in to test role service" });
            return;
        }
        setConnCheck({ name: "Role Service Test", status: "pending", message: "Testing service..." });
        try {
            console.log("Testing roleService for uid:", auth.currentUser.uid);
            const role = await roleService.getUserRole(auth.currentUser.uid);
            setConnCheck({
                name: "Role Service Test",
                status: "success",
                message: `Service OK. Role: ${role?.name || 'None'}`
            });
        } catch (error: any) {
            console.error("Role Service Failed:", error);
            setConnCheck({
                name: "Role Service Test",
                status: "error",
                message: `Service Error: ${error.message}`
            });
        }
    };

    const testReadData = async (collectionName: string, isPublic: boolean) => {
        const checkName = `Read ${collectionName} (${isPublic ? 'Public' : 'Private'})`;
        setConnCheck({ name: checkName, status: "pending", message: "Leyendo..." });

        try {
            if (!db) throw new Error("Database not initialized");
            const q = query(collection(db, collectionName), limit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setConnCheck({
                    name: checkName,
                    status: "success",
                    message: "Conectado. Colección vacía (0 docs)."
                });
            } else {
                const data = snapshot.docs[0].data();
                setConnCheck({
                    name: checkName,
                    status: "success",
                    message: `DATA REAL: ${JSON.stringify(data).substring(0, 100)}...`
                });
            }
        } catch (error: any) {
            setConnCheck({
                name: checkName,
                status: "error",
                message: `Error: ${error.message} (Code: ${error.code})`
            });
        }
    };

    const testUserProfile = async () => {
        if (!auth?.currentUser) {
            setConnCheck({ name: "User Profile Check", status: "error", message: "No estás logueado." });
            return;
        }

        const uid = auth.currentUser.uid;
        setConnCheck({ name: "User Profile Check", status: "pending", message: `Buscando usuario ${uid}...` });

        try {
            if (!db) throw new Error("Db not init");

            // 1. Get User Doc
            const userRef = doc(db, "users", uid); // Assuming 'users' collection
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                setConnCheck({
                    name: "User Profile Check",
                    status: "error",
                    message: `❌ Documento de usuario NO EXISTE en colección 'users' para ID: ${uid}`
                });
                return;
            }

            const userData = userSnap.data();
            const roleId = userData.roleId;

            if (!roleId) {
                setConnCheck({
                    name: "User Profile Check",
                    status: "warning",
                    message: `⚠️ Usuario encontrado pero NO tiene campo 'roleId'. Data: ${JSON.stringify(userData)}`
                });
                return;
            }

            // 2. Get Role Doc
            const roleRef = doc(db, "roles", roleId);
            const roleSnap = await getDoc(roleRef);

            if (!roleSnap.exists()) {
                setConnCheck({
                    name: "User Profile Check",
                    status: "error",
                    message: `❌ Usuario tiene roleId='${roleId}', pero ese documento NO EXISTE en colección 'roles'.`
                });
                return;
            }

            const roleData = roleSnap.data();
            setConnCheck({
                name: "User Profile Check",
                status: "success",
                message: `✅ TODO OK. Usuario con rol '${roleData.name}'. Permisos: ${roleData.permissions?.length || 0}`
            });

        } catch (error: any) {
            setConnCheck({
                name: "User Profile Check",
                status: "error",
                message: `Error inesperado: ${error.message}`
            });
        }
    };

    const testWrite = async () => {
        setConnCheck({ name: "Write Test", status: "pending", message: "Escribiendo..." });
        try {
            if (!db) throw new Error("Database not initialized");
            // Attempt to write a test document
            const testRef = collection(db, "connectivity_tests");
            await addDoc(testRef, {
                timestamp: new Date(),
                user: auth?.currentUser?.uid || "anonymous",
                userAgent: navigator.userAgent
            });

            setConnCheck({
                name: "Write Test",
                status: "success",
                message: "¡Escritura EXITOSA! Conexión confirmada."
            });
        } catch (error: any) {
            setConnCheck({
                name: "Write Test",
                status: "error",
                message: `Escritura Fallida: ${error.message} (${error.code})`
            });
        }
    };

    const restoreAdminRole = async () => {
        setConnCheck({ name: "Role Restore", status: "pending", message: "Restaurando rol 'admin'..." });
        try {
            if (!db) throw new Error("Db not init");

            // Manually creating the admin role with the specific ID 'admin'
            // to match what the user profile expects
            const adminRoleRef = doc(db, "roles", "admin");

            const adminRoleData = {
                name: "Administrador",
                isSystem: true,
                permissions: [
                    "/dashboard",
                    "/dashboard/tasacion",
                    "/dashboard/propiedades",
                    "/dashboard/alquileres",
                    "/dashboard/agentes",
                    "/dashboard/leads",
                    "/dashboard/clientes",
                    "/dashboard/chat",
                    "/dashboard/publicaciones",
                    "/dashboard/finanzas",
                    "/dashboard/calendario",
                    "/dashboard/soporte",
                    "/dashboard/soporte/ticketera",
                    "/dashboard/bitacora",
                    "/dashboard/cuenta",
                    "/dashboard/configuracion",
                    "/dashboard/configuracion/roles",
                    "/dashboard/configuracion/backup",
                    "/dashboard/blog"
                ]
            };

            await setDoc(adminRoleRef, adminRoleData);

            setConnCheck({
                name: "Role Restore",
                status: "success",
                message: "✅ Rol 'admin' creado exitosamente. Ahora prueba 'Diagnosticar Mi Usuario' de nuevo."
            });

        } catch (error: any) {
            setConnCheck({
                name: "Role Restore",
                status: "error",
                message: `Error al restaurar: ${error.message}`
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-indigo-600 p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Diagnóstico de Firebase Prop-IA</h1>
                        <p className="text-indigo-100 mt-2">Verificación de estado y conectividad</p>
                    </div>
                    <div className="text-right">
                        <p className="text-white text-sm font-semibold">
                            {user ? `👤 ${user.email}` : "⚪ No autenticado"}
                        </p>
                        <p className="text-indigo-200 text-xs">{user?.uid}</p>
                    </div>
                </div>

                <div className="p-6 space-y-8">

                    {/* Environment Variables */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">1. Variables de Entorno</h2>
                        <div className="grid gap-2">
                            {envChecks.map((check) => (
                                <div key={check.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-mono text-sm text-gray-600">{check.name}</span>
                                    <StatusBadge status={check.status} text={check.message} />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Initialization */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">2. Inicialización de SDK</h2>
                        <div className="grid gap-2">
                            {initChecks.map((check) => (
                                <div key={check.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-700">{check.name}</span>
                                    <StatusBadge status={check.status} text={check.message} />
                                    <button
                                        onClick={testWrite}
                                        className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm active:transform active:scale-95 ml-4"
                                    >
                                        Probar Escritura (Write)
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Connection Test */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">3. Prueba de Conexión Real</h2>
                        <div className="bg-gray-50 rounded-lg p-6 text-center">
                            <div className="mb-4">
                                <StatusBadge status={connCheck.status} text={connCheck.message} large />
                            </div>

                            <button
                                onClick={testWrite}
                                className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm active:transform active:scale-95 ml-4 mr-4"
                            >
                                Probar Escritura (Write)
                            </button>
                            <button
                                onClick={testUserProfile}
                                className="px-6 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors shadow-sm active:transform active:scale-95 mr-4"
                            >
                                Diagnosticar Mi Usuario
                            </button>
                            <button
                                onClick={restoreAdminRole}
                                className="px-6 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors shadow-sm active:transform active:scale-95"
                            >
                                Restaurar Rol Admin
                            </button>
                            <button
                                onClick={() => testReadData("roles", false)}
                                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm active:transform active:scale-95 mr-4"
                            >
                                Probar Datos Privados (Roles)
                            </button>
                            <button
                                onClick={testRoleService}
                                className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm active:transform active:scale-95"
                            >
                                Probar RoleService
                            </button>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status, text, large = false }: { status: string, text?: string, large?: boolean }) {
    const colors = {
        pending: "bg-yellow-100 text-yellow-800",
        success: "bg-green-100 text-green-800",
        error: "bg-red-100 text-red-800",
    };

    const baseClasses = `inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${large ? 'text-lg px-4 py-2' : 'text-xs'}`;
    const colorClass = colors[status as keyof typeof colors] || colors.pending;

    return (
        <span className={`${baseClasses} ${colorClass}`}>
            {text || status}
        </span>
    );
}
