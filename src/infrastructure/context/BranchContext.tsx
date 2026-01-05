"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/infrastructure/firebase/client";
import { doc, getDoc } from "firebase/firestore";
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
    const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoadingDetails(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    // Fetch user details to see if they are restricted to a branch (Agent)
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    const userData = userDoc.data();

                    // Fetch all branches for the organization (assuming currentUser is part of one)
                    // If the user is an AGENT, their organizationId should be set to the Agency Owner.
                    // If the user is the OWNER, organizationId is their own uid (conceptually).
                    // For simplicity in this iteration: We assume currentUser.uid is the organization owner ID 
                    // OR we check organizationId field.
                    const orgId = userData?.organizationId || currentUser.uid;
                    const branchList = await branchService.getBranches(orgId);
                    setBranches(branchList);

                    // Logic: If user has a 'branchId' assigned (e.g. Agent), FORCE selection
                    if (userData?.branchId) {
                        setSelectedBranchId(userData.branchId);
                    } else if (selectedBranchId === 'all' && branchList.length === 0) {
                        // Keep 'all' or logic for default
                    }
                } catch (err) {
                    console.error("Error initializing branch context", err);
                }
            }
            setLoadingDetails(false);
        });
        return () => unsubscribe();
    }, []);

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
