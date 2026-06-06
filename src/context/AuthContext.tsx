"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    isTestMode: boolean;
    setTestUser: (admin: boolean, customUser?: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    isTestMode: false,
    setTestUser: () => { },
    logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isTestMode, setIsTestMode] = useState(true); // Default to true since user uses mock credentials

    useEffect(() => {
        // 1. JWT Session Persistence Logic
        if (isTestMode) {
            const checkSession = async () => {
                try {
                    const res = await fetch('/api/auth/me');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.authenticated && data.user) {
                            setUser({ 
                                uid: data.user.uid, 
                                email: data.user.email, 
                                displayName: data.user.fullName, 
                                username: data.user.uid, 
                                status: data.user.status, 
                                kimlikToken: data.user.kimlikToken,
                                isSuperAdmin: data.user.isSuperAdmin,
                                role: data.user.role
                            } as any);
                            setIsAdmin(data.user.isAdmin);
                        } else {
                            setUser(null);
                            setIsAdmin(false);
                        }
                    }
                } catch (e) {
                    console.error("Session check failed", e);
                } finally {
                    setLoading(false);
                }
            };
            checkSession();
            return;
        }

        // 2. Exact Firebase Login persistence logic
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists() && docSnap.data().role === "admin") {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                    }
                } catch (error) {
                    console.error("Error fetching user data", error);
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isTestMode]);

    const logout = async () => {
        if (isTestMode) {
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
            } catch (e) { console.error(e) }
            setUser(null);
            setIsAdmin(false);
            if (typeof window !== "undefined") {
                localStorage.removeItem("m1g_test_user");
            }
            return;
        }
        await firebaseSignOut(auth);
    };

    const setTestUser = (admin: boolean, customUser?: any) => {
        setIsTestMode(true);
        const mockUser = customUser || {
            uid: "test-user-123",
            email: admin ? "admin@m1g.org" : "user@m1g.org",
            isAdmin: admin
        };

        setUser(mockUser as any);
        setIsAdmin(admin);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, isTestMode, setTestUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
