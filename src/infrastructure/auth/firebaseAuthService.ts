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

export const saveUserToFirestore = async (user: User, additionalData?: { agencyName?: string }) => {
    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // Get default role (Cliente)
            const { roleService } = await import("@/infrastructure/services/roleService");
            let defaultRole = await roleService.getDefaultRole();

            // If default role doesn't exist, try to initialize roles
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
                roleId: defaultRole?.id || null, // Assign default role
                createdAt: new Date(),
            });
        }
    } catch (error: any) {
        console.warn("Error saving user to Firestore (likely offline):", error.message);
        // We do not throw here to allow the auth flow to continue even if Firestore is unreachable
    }
};

export const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await saveUserToFirestore(result.user);

    // Log authentication
    await auditLogService.logAuth(
        result.user.uid,
        result.user.email || '',
        result.user.displayName || result.user.email || 'Usuario',
        'login',
        result.user.uid
    );

    return result;
};

export const registerEmail = async (email: string, pass: string, displayName: string, agencyName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    // Ideally we should also update the auth profile:
    // await updateProfile(result.user, { displayName });

    await saveUserToFirestore(result.user, { agencyName });

    // Log registration
    await auditLogService.logAuth(
        result.user.uid,
        email,
        displayName || email,
        'register',
        result.user.uid
    );

    return result;
};

export const loginEmail = async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    await saveUserToFirestore(result.user);

    // Log login
    await auditLogService.logAuth(
        result.user.uid,
        email,
        result.user.displayName || email,
        'login',
        result.user.uid
    );

    return result;
};

export const logoutUser = () => signOut(auth);