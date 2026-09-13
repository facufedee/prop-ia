import { db } from "@/infrastructure/firebase/client";
import { doc, updateDoc } from "firebase/firestore";

// Stores only the portal-assigned "código de inmobiliaria" per user — never
// a password. Zonaprop/Argenprop don't accept third-party logins for
// automated publishing; real publishing requires Zeta Prop to become a
// registered software partner with each portal first (see
// PLAN_APP_MOVIL.md-adjacent notes / conversation on 2026-09-12). Until
// that's in place, this code is just saved for when the real integration
// is ready — it isn't used for anything yet.
export type PortalId = "zonaprop" | "argenprop";

export const portalIntegrationService = {
    async saveCode(uid: string, portal: PortalId, code: string): Promise<void> {
        if (!db) throw new Error("Firestore not initialized");
        // Dot-path update targets only this one nested field, so it never
        // clobbers the sibling portal's saved code the way
        // setDoc(..., {merge:true}) with a plain nested object would.
        await updateDoc(doc(db, "users", uid), { [`portalIds.${portal}`]: code.trim() });
    },
};
