"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { app, auth, db } from "@/infrastructure/firebase/client"; // Added db
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore"; // Added firestore imports
import Cookies from "js-cookie";
import { roleService, Role } from "@/infrastructure/services/roleService"; // Import Role service

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: Role | null;
  userPermissions: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<Role | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);

      if (u) {
        Cookies.set("authToken", "logged", { expires: 7 });
      } else {
        Cookies.remove("authToken");
        setUserRole(null);
        setLoading(false); // If no user, stop loading
      }
    });

    return () => unsub();
  }, []);

  // Effect to fetch Role when user changes
  useEffect(() => {
    if (!user || !db) return;

    const userRef = doc(db, "users", user.uid);
    const unsubSnapshot = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.roleId) {
          try {
            const role = await roleService.getRoleById(userData.roleId);
            // Optional: Merge logoUrl if stored in user doc
            if (userData.logoUrl && role) {
              // We cast to any to attach logoUrl if Role type doesn't support it native yet, 
              // or we expect Role to generally match what we need.
              (role as any).logoUrl = userData.logoUrl;
            }
            setUserRole(role);
          } catch (error) {
            console.error("Error fetching role:", error);
          }
        }
      } else {
        // User doc might not exist yet if just registered?
      }
      setLoading(false);
    });

    return () => unsubSnapshot();
  }, [user]);

  // Derived permissions
  const userPermissions = userRole?.permissions || [];

  return (
    <AuthContext.Provider value={{ user, loading, userRole, userPermissions }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
