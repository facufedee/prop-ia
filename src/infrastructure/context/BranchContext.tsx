"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/infrastructure/firebase/client";
import { doc, getDoc, onSnapshot, collection, query, where } from "firebase/firestore";
import { branchService } from "@/infrastructure/services/branchService";
import { Branch } from "@/domain/models/Branch";

interface BranchContextType {
    selectedBranchId: string; // 'all' or specific branch ID
    branches: Branch[];
    loadingDetails: boolean;
    setSelectedBranchId: (id: string) => void;
    currentContextLabel: string; // "Todas las Sucursales" or "Sucursal Norte"
}

const BranchContext = createContext<BranchContextType>({
    selectedBranchId: 'all',
    branches: [],
    loadingDetails: true,
    setSelectedBranchId: () => { },
    currentContextLabel: "..."
});

export const useBranchContext = () => useContext(BranchContext);

export const BranchProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(true);

    // 1. Auth & User Profile Listener
    useEffect(() => {
        if (!auth) {
            setLoadingDetails(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    }
                } catch (err) {
                    console.error("Error fetching user data", err);
                }
            } else {
                setUserData(null);
                setBranches([]);
            }
            if (!currentUser) setLoadingDetails(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Real-time Branch Subscription
    useEffect(() => {
        if (!user || !userData) {
            return;
        }

        const orgId = userData.organizationId || user.uid;
        const q = query(collection(db, "branches"), where("organizationId", "==", orgId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const branchList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            } as Branch));

            setBranches(branchList);

            // Force selection if user is restricted
            if (userData.branchId) {
                setSelectedBranchId(userData.branchId);
            }

            setLoadingDetails(false);
        });

        return () => unsubscribe();
    }, [user, userData]); // Re-run when user/userData changes

    const currentContextLabel = selectedBranchId === 'all'
        ? "Todas las Sucursales"
        : branches.find(b => b.id === selectedBranchId)?.name || "Sucursal Desconocida";

    return (
        <BranchContext.Provider value={{
            selectedBranchId,
            branches,
            loadingDetails,
            setSelectedBranchId,
            currentContextLabel
        }}>
            {children}
        </BranchContext.Provider>
    );
};
