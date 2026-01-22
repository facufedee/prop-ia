import { app, db, auth } from "@/infrastructure/firebase/client";
import {
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auditLogService } from "@/infrastructure/services/auditLogService";

// ============================================================================
// BREAKPOINT 5: Save User to Firestore
// ============================================================================
// ============================================================================
// BREAKPOINT 5: Save User to Firestore
// ============================================================================
export const saveUserToFirestore = async (user: User, additionalData?: { agencyName?: string }) => {
    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const { roleService } = await import("@/infrastructure/services/roleService");
            let defaultRole = await roleService.getDefaultRole();

            // If "Cliente" role doesn't exist, initialize and retry
            if (!defaultRole) {
                console.log("Default role 'Cliente Free' not found. Initializing roles...");
                await roleService.initializeDefaultRoles();
                defaultRole = await roleService.getDefaultRole();
            }

            // Fallback: If still no role, we can't properly assign permissions, but we create the user.
            // Ideally, we should error out or ensure at least one role.
            if (!defaultRole) {
                console.error("CRITICAL: Failed to retrieve default role 'Cliente Free' even after initialization.");
            }

            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || additionalData?.agencyName || "",
                agencyName: additionalData?.agencyName || "",
                photoURL: user.photoURL || "",
                roleId: defaultRole?.id || null, // Can be null if really failed
                createdAt: new Date(),
                emailVerified: user.emailVerified,
            });

            // Notify Admins of New User
            try {
                const { notificationService } = await import("@/infrastructure/services/notificationService");
                await notificationService.createNotification(
                    "Nuevo Usuario Registrado",
                    `El usuario ${user.email} se ha unido a la plataforma.`,
                    "info",
                    "Administrador",
                    "/dashboard/admin/usuarios"
                );
            } catch (notifyError) {
                console.warn("Failed to notify admins of new user:", notifyError);
            }
        }
    } catch (error: any) {
        console.warn("Error saving user to Firestore (likely offline):", error.message);
        throw error; // Rethrow so we know if it failed
    }
};

// ============================================================================
// BREAKPOINT 6: Google Login
// ============================================================================
export const loginWithGoogle = async () => {
    if (!auth) throw new Error('Auth not available');

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: "select_account"
    });
    const result = await signInWithPopup(auth, provider);

    // Await this to ensure role is assigned before UI redirects
    await saveUserToFirestore(result.user);

    await auditLogService.logAuth(
        result.user.uid,
        result.user.email || '',
        result.user.displayName || result.user.email || 'Usuario',
        'login',
        result.user.uid
    );

    return result;
};

// ============================================================================
// BREAKPOINT 7: Email Registration
// ============================================================================
export const registerEmail = async (email: string, pass: string, displayName: string, agencyName: string) => {
    if (!auth) throw new Error('Auth not available');

    const result = await createUserWithEmailAndPassword(auth, email, pass);

    // Await this to ensure role is assigned before UI redirects
    await saveUserToFirestore(result.user, { agencyName });

    await auditLogService.logAuth(
        result.user.uid,
        email,
        displayName || email,
        'register',
        result.user.uid
    );

    return result;
};

// ============================================================================
// BREAKPOINT 8: Email Login
// ============================================================================
export const loginEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error('Auth not available');

    const result = await signInWithEmailAndPassword(auth, email, pass);
    // Note: loginEmail is for existing users, but saveUserToFirestore checks existence.
    // It's safe to await it to ensure consistency, though typically login assumes existence.
    await saveUserToFirestore(result.user);

    await auditLogService.logAuth(
        result.user.uid,
        email,
        result.user.displayName || email,
        'login',
        result.user.uid
    );

    return result;
};

export const logoutUser = () => {
    if (!auth) throw new Error('Auth not available');
    return signOut(auth);
};