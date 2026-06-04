"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Ban } from "lucide-react";

export default function ProtectedRoute({
    children,
    adminOnly = false
}: {
    children: React.ReactNode,
    adminOnly?: boolean
}) {
    const { user, loading, isAdmin, logout } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !loading) {
            if (!user) {
                router.push("/login");
                return;
            }
            // Ban / Pasif kontrolü
            const userStatus = (user as any)?.status;
            if (userStatus === 'Banlı' || userStatus === 'Pasif') {
                logout();
                router.push("/login");
            }
        }
    }, [user, loading, router, mounted]);

    if (!mounted || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Shield className="w-12 h-12 text-red-600 animate-pulse" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Ban/Pasif kontrol
    const userStatus = (user as any)?.status;
    if (userStatus === 'Banlı' || userStatus === 'Pasif') {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-center p-4">
                <Ban className="w-24 h-24 text-red-600 mb-6 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
                <h1 className="text-4xl font-black text-white uppercase tracking-widest mb-2">Erişim Engellendi</h1>
                <p className="text-neutral-400 max-w-md mx-auto mb-8">
                    Hesabınız {userStatus === 'Banlı' ? 'askıya alınmıştır' : 'pasif durumdadır'}. Lütfen M1G yönetimi ile iletişime geçiniz.
                </p>
                <button
                    onClick={() => { logout(); router.push("/login"); }}
                    className="px-8 py-3 bg-red-600 hover:bg-neutral-800 text-white font-bold uppercase tracking-widest rounded-xl transition-colors border border-transparent hover:border-white/10"
                >
                    Çıkış Yap
                </button>
            </div>
        );
    }

    if (adminOnly && !isAdmin) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-center p-4">
                <Shield className="w-24 h-24 text-red-600 mb-6 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
                <h1 className="text-4xl font-black text-white uppercase tracking-widest mb-2">Yetkiniz Yok</h1>
                <p className="text-neutral-400 max-w-md mx-auto mb-8">
                    Bu alana (Komuta ve Kontrol Merkezi) erişim sadece **Yönetici Personel** için aktiftir. Güvenlik protokolü gereği erişiminiz reddedildi.
                </p>
                <button
                    onClick={() => router.push("/portal")}
                    className="px-8 py-3 bg-red-600 hover:bg-neutral-800 text-white font-bold uppercase tracking-widest rounded-xl transition-colors border border-transparent hover:border-white/10"
                >
                    Akademiye Geri Dön
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
