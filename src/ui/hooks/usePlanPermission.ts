import { useState, useEffect } from 'react';
import { subscriptionService } from '@/infrastructure/services/subscriptionService';
// import { useAuth } from '@/infrastructure/auth/AuthContext'; // Commented out to prevent build error if missing

// If AuthContext doesn't exist, we'll use a simplified version for now reading from session/state
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/infrastructure/firebase/client';

export type FeatureKey =
    | 'whatsapp_bot'
    | 'ai_tasacion'
    | 'portal_inverso'
    | 'export_pdf'
    | 'api_access';

export type LimitKey = 'properties' | 'users' | 'clients';

export function usePlanPermission() {
    const [userId, setUserId] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]); // Access to features
    const [limits, setLimits] = useState<Record<string, number | 'unlimited'>>({}); // Numeric limits
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) return;
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                await loadPermissions(user.uid);
            } else {
                setUserId(null);
                setPermissions([]);
                setLimits({});
                setLoading(false);
            }
        });
        return () => unsub();
    }, []);

    const loadPermissions = async (uid: string) => {
        try {
            const subscription = await subscriptionService.getUserSubscription(uid);
            if (subscription && subscription.planId) {
                const plan = await subscriptionService.getPlanById(subscription.planId);
                if (plan) {
                    // Extract active features
                    // New Plan Model has 'features' as an object of booleans: { whatsapp_bot: true, ... }
                    // We convert valid true keys to permissions array
                    const activeFeatures = Object.entries(plan.features || {})
                        .filter(([_, enabled]) => enabled === true)
                        .map(([key]) => key);

                    setPermissions(activeFeatures);

                    // Set limits
                    // @ts-ignore
                    setLimits(plan.limits || {});
                }
            }
        } catch (err) {
            console.error("Error loading permissions:", err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Check if a boolean feature is enabled
     */
    const canAccess = (feature: FeatureKey): boolean => {
        return permissions.includes(feature);
    };

    /**
     * Check if user can add more items (usage < limit)
     * For this usage, it just returns if the limit allows it. 
     * CAUTION: Doesn't check ACTUAL usage count here to remain fast (use checkUsageLimit in service for blocking actions).
     * This is mostly for UI rendering (e.g. showing "Upgrade" banner).
     */
    const getLimit = (resource: LimitKey): number | 'unlimited' => {
        return limits[resource] ?? 0; // Default 0 if not found
    };

    return {
        loading,
        canAccess,
        getLimit
    };
}
