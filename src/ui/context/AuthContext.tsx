"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/infrastructure/firebase/client";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import Cookies from "js-cookie";
import { roleService, Role } from "@/infrastructure/services/roleService";

interface AuthContextType {
  user: User | null;
  /** true once onAuthStateChanged has fired at least once — does NOT wait for Firestore */
  authReady: boolean;
  /** true while role/userData are still loading from Firestore */
  loading: boolean;
  userRole: Role | null;
  userPermissions: string[];
  userData: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userData, setUserData] = useState<any | null>(null);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthReady(true); // auth state is known — guards can act immediately

      if (u) {
        try {
          const token = await u.getIdToken();
          Cookies.set("authToken", token, { expires: 7, secure: true, sameSite: "strict" });
        } catch {
          Cookies.set("authToken", "logged", { expires: 7 });
        }
      } else {
        Cookies.remove("authToken");
        setUserRole(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // Fetch role + userData from Firestore when user is known
  useEffect(() => {
    if (!user || !db) {
      // If there's no user or no db, nothing to load — unblock loading
      if (!user) setLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsubSnapshot = onSnapshot(
      userRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);

          if (data.roleId) {
            try {
              const role = await roleService.getRoleById(data.roleId);
              if (data.logoUrl && role) {
                (role as any).logoUrl = data.logoUrl;
              }
              setUserRole(role);
            } catch {
              setUserRole(null);
            }
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error("AuthContext snapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubSnapshot();
  }, [user]);

  const userPermissions = userRole?.permissions || [];

  return (
    <AuthContext.Provider value={{ user, authReady, loading, userRole, userPermissions, userData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
