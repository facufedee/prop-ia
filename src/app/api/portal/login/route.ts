import { NextRequest, NextResponse } from "next/server";
// Admin SDK: `alquileres` is closed to unauthenticated client SDK access by Firestore rules.
import { adminDb } from "@/infrastructure/firebase/admin";
import { SignJWT } from "jose";
import { BRAND_COLORS } from "@/lib/email/brandColors";

function getPortalSecret(): string {
    const secret = process.env.PORTAL_JWT_SECRET;
    if (!secret) throw new Error("PORTAL_JWT_SECRET env var must be set");
    return secret;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { dni, contractCode } = body;

        if (!dni || !contractCode) {
            return NextResponse.json({ message: "DNI y Código son requeridos" }, { status: 400 });
        }

        // 1. Find Contract (Alquiler) by contractCode
        const querySnapshot = await adminDb
            .collection("alquileres")
            .where("contractCode", "==", contractCode)
            .get();

        if (querySnapshot.empty) {
            return NextResponse.json({ message: "Contrato no encontrado o código inválido" }, { status: 401 });
        }

        const alquilerDoc = querySnapshot.docs[0];
        const alquilerData = alquilerDoc.data();

        // 2. Validate DNI matches (Simple check, assumes dniInquilino is stored on Alquiler)
        // Adjust field name based on Alquiler model. Model says 'dniInquilino'.
        if (alquilerData.dniInquilino !== dni) {
            return NextResponse.json({ message: "El DNI no coincide con el contrato" }, { status: 401 });
        }

        // 3. Fetch Agency Branding (White Label)
        // The contract belongs to a User (Agency).
        const agencyUserId = alquilerData.userId;
        let branding = {
            agencyName: "Zeta Prop",
            logoUrl: "",
            primaryColor: BRAND_COLORS.accent // Default: Zeta Prop bronze (not read by the portal UI today)
        };

        if (agencyUserId) {
            const userDocSnap = await adminDb.collection("users").doc(agencyUserId).get();
            if (userDocSnap.exists) {
                const userData = userDocSnap.data()!;
                // Check if Agency is PRO (Role based) to enable White Label
                const roleId = userData.roleId;
                let isPro = false;

                if (roleId) {
                    const roleDocSnap = await adminDb.collection("roles").doc(roleId).get();
                    if (roleDocSnap.exists) {
                        const roleName = roleDocSnap.data()!.name;
                        // Check for "Pro" in name or specific ID. Ideally Use a constant.
                        // Flexible check: Contains "Pro" (case insensitive)
                        isPro = /pro/i.test(roleName);
                    }
                }

                if (isPro) {
                    branding.agencyName = userData.agencyName || userData.displayName || "Inmobiliaria";
                    branding.logoUrl = userData.logoUrl || "";
                } else {
                    // Logic: If NOT Pro, enforce Zeta Prop defaults (already set in init)
                    // Explicitly clearing just in case logic changes
                    branding.agencyName = "Zeta Prop (Versión Gratuita)";
                    branding.logoUrl = ""; // No custom logo
                }
            }
        }

        // 4. Create Session Token (JWT)
        // We use 'jose' for edge compatible JWT
        const token = await new SignJWT({
            role: 'tenant',
            contractId: alquilerDoc.id,
            tenantName: alquilerData.nombreInquilino
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(new TextEncoder().encode(getPortalSecret()));

        // 5. Return success
        const response = NextResponse.json({
            success: true,
            contractId: alquilerDoc.id,
            tenantName: alquilerData.nombreInquilino,
            branding
        });

        // Set cookie for session
        response.cookies.set('portal_all_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/portal',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return response;

    } catch (error: any) {
        console.error("Portal Login Error:", error.message);
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
    }
}
