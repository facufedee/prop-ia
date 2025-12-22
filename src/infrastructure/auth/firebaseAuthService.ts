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
export const saveUserToFirestore = async (user: User, additionalData?: { agencyName?: string }) => {
    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const { roleService } = await import("@/infrastructure/services/roleService");
            let defaultRole = await roleService.getDefaultRole();

            if (!defaultRole) {
                await roleService.initializeDefaultRoles();
                defaultRole = await roleService.getDefaultRole();
            }

            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || additionalData?.agencyName || "",
                agencyName: additionalData?.agencyName || "",
                photoURL: user.photoURL || "",
                roleId: defaultRole?.id || null,
                createdAt: new Date(),
            });
        }
    } catch (error: any) {
        console.warn("Error saving user to Firestore (likely offline):", error.message);
    }
};

// ============================================================================
// BREAKPOINT 6: Google Login
// ============================================================================
export const loginWithGoogle = async () => {
    if (!auth) throw new Error('Auth not available');

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // Fire and forget user creation/update to prevent blocking redirect
    saveUserToFirestore(result.user).catch(e => console.error("Background user sync failed:", e));

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
    saveUserToFirestore(result.user, { agencyName }).catch(e => console.error("Background user creation failed:", e));

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
    saveUserToFirestore(result.user).catch(e => console.error("Background user sync failed:", e));

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