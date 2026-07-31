"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { registerAuthAccessors } from "@/lib/api/apiClient";
import { ConnectionStatus } from "@/components/ui/ConnectionBadge";

interface MemoryAuth {
    accessToken: string | null;
    accessTokenExpiresAt: number | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    isTestMode: boolean;
    accessToken: string | null;
    connectionStatus: ConnectionStatus;
    setTestUser: (admin: boolean, customUser?: any) => void;
    logout: () => void;
}

const MAX_OFFLINE_HOURS = 24;

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    isTestMode: false,
    accessToken: null,
    connectionStatus: "connected",
    setTestUser: () => { },
    logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isTestMode, setIsTestMode] = useState(true);
    const [authMemory, setAuthMemory] = useState<MemoryAuth>({ accessToken: null, accessTokenExpiresAt: null });
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connected");
    const lastSuccessfulAuthCheckRef = useRef<number>(Date.now());

    const updateAccessToken = useCallback((token: string | null, expiresAt: number | null) => {
        setAuthMemory({ accessToken: token, accessTokenExpiresAt: expiresAt });
        if (token) {
            lastSuccessfulAuthCheckRef.current = Date.now();
            setConnectionStatus("connected");
        }
    }, []);

    // Register accessors for apiClient.ts
    useEffect(() => {
        registerAuthAccessors(
            () => authMemory.accessToken,
            updateAccessToken
        );
    }, [authMemory.accessToken, updateAccessToken]);

    // 24 saatlik offline güvenlik sınırı kontrolü
    useEffect(() => {
        const interval = setInterval(() => {
            if (Date.now() - lastSuccessfulAuthCheckRef.current > MAX_OFFLINE_HOURS * 3600 * 1000) {
                setConnectionStatus("session_expired");
            }
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Silent Refresh Effect (Token bitmeden 60s önce)
    useEffect(() => {
        if (!authMemory.accessTokenExpiresAt) return;
        const msUntilRefresh = authMemory.accessTokenExpiresAt - Date.now() - 60_000;
        if (msUntilRefresh <= 0) return;

        const timer = setTimeout(async () => {
            try {
                const res = await fetch("/api/auth/refresh", { 
                    method: "POST", 
                    credentials: "include" 
                });
                if (res.ok) {
                    const data = await res.json();
                    updateAccessToken(data.accessToken, Date.now() + data.expiresIn * 1000);
                    setConnectionStatus("connected");
                } else if (res.status === 401) {
                    // GERÇEK oturum sonu
                    setConnectionStatus("session_expired");
                }
            } catch {
                // Network hatası — OTURUMU KESİNLİKLE SONLANDIRMA
                setConnectionStatus("offline_queued");
                setTimeout(() => {
                    updateAccessToken(authMemory.accessToken, Date.now() + 30000); // 30s sonra tekrar dene
                }, 5000);
            }
        }, msUntilRefresh);

        return () => clearTimeout(timer);
    }, [authMemory.accessTokenExpiresAt, authMemory.accessToken, updateAccessToken]);

    // Network status listener
    useEffect(() => {
        const handleOnline = () => {
            setConnectionStatus("connected");
        };
        const handleOffline = () => {
            setConnectionStatus("offline_queued");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
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
                            lastSuccessfulAuthCheckRef.current = Date.now();
                        } else {
                            setUser(null);
                            setIsAdmin(false);
                        }
                    }
                } catch (e) {
                    // Network Error — keep existing user, do not logout!
                    setConnectionStatus("offline_queued");
                } finally {
                    setLoading(false);
                }
            };
            checkSession();
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(userDocRef);
                    setIsAdmin(docSnap.exists() && docSnap.data().role === "admin");
                    lastSuccessfulAuthCheckRef.current = Date.now();
                } catch {
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
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch { }
        setAuthMemory({ accessToken: null, accessTokenExpiresAt: null });
        setUser(null);
        setIsAdmin(false);
        setConnectionStatus("session_expired");
        if (!isTestMode) {
            await firebaseSignOut(auth);
        }
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
        setConnectionStatus("connected");
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            isAdmin, 
            isTestMode, 
            accessToken: authMemory.accessToken,
            connectionStatus,
            setTestUser, 
            logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
