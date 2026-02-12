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
                lastLogin: new Date(),
                loginCount: 1,
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

            // Trigger Email Notification (Email to Admin)
            fetch('/api/notifications/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'newUser',
                    data: { email: user.email, uid: user.uid, agency: additionalData?.agencyName },
                    subject: 'Nuevo Usuario Registrado',
                    message: `Un nuevo usuario se ha registrado en la plataforma:<br/><strong>Email:</strong> ${user.email}<br/><strong>Agencia:</strong> ${additionalData?.agencyName || 'N/A'}`
                })
            }).catch(err => console.error("Failed to trigger admin email notification:", err));

            // Trigger Welcome Email (to User)
            fetch('/api/notifications/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'welcomeEmail',
                    data: {
                        email: user.email,
                        name: user.displayName || additionalData?.agencyName || user.email
                    }
                })
            }).catch(err => console.error("Failed to trigger welcome email:", err));
        } else {
            // User exists: Update login stats
            // We want to increment loginCount. To avoid race conditions, we could use increment field value, 
            // but for simple login stats, reading and updating is acceptable or using setDoc with merge.
            // Let's use simple merge for now as we already read the doc.

            const currentCount = userSnap.data().loginCount || 0;

            await setDoc(userRef, {
                lastLogin: new Date(),
                loginCount: currentCount + 1
            }, { merge: true });
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