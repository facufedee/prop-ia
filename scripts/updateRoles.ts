// Script para actualizar roles existentes con el nuevo permiso de Alquileres
// Ejecutar este archivo una vez para actualizar los roles en Firestore

import { db } from "@/infrastructure/firebase/client";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

async function updateRoles() {
    try {
        console.log("Actualizando roles...");

        const rolesRef = collection(db, "roles");
        const snapshot = await getDocs(rolesRef);

        for (const roleDoc of snapshot.docs) {
            const roleData = roleDoc.data();

            // Actualizar rol Agente
            if (roleData.name === "Agente") {
                const currentPermissions = roleData.permissions || [];

                if (!currentPermissions.includes("/dashboard/alquileres")) {
                    const updatedPermissions = [
                        "/dashboard",
                        "/dashboard/propiedades",
                        "/dashboard/alquileres",
                        "/dashboard/leads",
                        "/dashboard/calendario",
                        "/dashboard/cuenta"
                    ];

                    await updateDoc(doc(db, "roles", roleDoc.id), {
                        permissions: updatedPermissions
                    });

                    console.log(`✓ Rol Agente actualizado con permiso de Alquileres`);
                }
            }

            // Actualizar rol Administrador (debería tener todos los permisos)
            if (roleData.name === "Administrador") {
                const allPermissions = [
                    "/dashboard",
                    "/dashboard/tasacion",
                    "/dashboard/propiedades",
                    "/dashboard/alquileres",
                    "/dashboard/leads",
                    "/dashboard/clientes",
                    "/dashboard/chat",
                    "/dashboard/publicaciones",
                    "/dashboard/finanzas",
                    "/dashboard/calendario",
                    "/dashboard/cuenta",
                    "/dashboard/configuracion",
                    "/dashboard/configuracion/roles"
                ];

                await updateDoc(doc(db, "roles", roleDoc.id), {
                    permissions: allPermissions
                });

                console.log(`✓ Rol Administrador actualizado`);
            }
        }

        console.log("✓ Roles actualizados exitosamente");
        console.log("Por favor, cierra sesión y vuelve a iniciar sesión para ver los cambios");

    } catch (error) {
        console.error("Error actualizando roles:", error);
    }
}

// Ejecutar
updateRoles();
