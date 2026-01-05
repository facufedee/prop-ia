/**
 * Script para verificar y corregir roles en Firebase
 * 
 * Este script:
 * 1. Lista todos los roles existentes
 * 2. Identifica roles sin nombre
 * 3. Actualiza el rol de Administrador si es necesario
 * 
 * Ejecutar desde: /dashboard/firebase-check
 */

import { db } from "@/infrastructure/firebase/client";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { roleService, PERMISSIONS } from "@/infrastructure/services/roleService";

export async function checkAndFixRoles() {
    if (!db) {
        console.error("Firebase no inicializado");
        return { success: false, error: "Firebase no inicializado" };
    }

    try {
        // 1. Obtener todos los roles
        const rolesSnapshot = await getDocs(collection(db, "roles"));
        const roles = rolesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[]; // Use any[] to handle partial data

        console.log("📋 Roles encontrados:", roles);

        // 2. Buscar rol de Administrador sin nombre
        const adminRoleWithoutName = roles.find(r =>
            !r.name && r.permissions?.length === PERMISSIONS.length
        );

        const adminRoleWithName = roles.find(r => r.name === "Administrador");

        let fixed = false;
        let message = "";

        // 3. Corregir si es necesario
        if (adminRoleWithoutName && !adminRoleWithName) {
            // Actualizar el rol existente
            const roleRef = doc(db, "roles", adminRoleWithoutName.id);
            await updateDoc(roleRef, {
                name: "Administrador",
                description: "Acceso completo al sistema"
            });
            fixed = true;
            message = `✅ Rol de Administrador actualizado (ID: ${adminRoleWithoutName.id})`;
            console.log(message);
        } else if (adminRoleWithName) {
            message = `✅ Rol de Administrador ya existe correctamente (ID: ${adminRoleWithName.id})`;
            console.log(message);
        } else if (!adminRoleWithoutName && !adminRoleWithName) {
            message = "⚠️ No se encontró ningún rol de Administrador. Ejecuta initializeDefaultRoles()";
            console.warn(message);
        }

        return {
            success: true,
            roles,
            fixed,
            message
        };
    } catch (error) {
        console.error("Error al verificar roles:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error desconocido"
        };
    }
}
