"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { Video, BookOpen, Star, Box, User, Menu, X, LogOut, ShieldCheck, Home, CreditCard } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";

const SidebarContent = ({ setSidebarOpen, user, isAdmin, logout, pathname, navItems }: any) => (
    <div className="flex flex-col h-full">
        {/* Logo / Başlık */}
        <div className="mb-8 pl-2 flex items-center justify-between">
            <div>
                <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-500 uppercase tracking-widest flex items-center gap-2">
                    <Star className="text-red-500 w-4 h-4" /> Üye Portalı
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5 truncate max-w-[160px]">{user?.displayName || user?.email || "Kayıtlı Üye"}</p>
            </div>
            {/* Mobil kapatma butonu */}
            <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
            {navItems.map((item: any) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                        pathname === item.href
                            ? "bg-red-500/15 text-red-400 border border-red-500/30 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]"
                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    <span className={pathname === item.href ? "text-red-500" : ""}>{item.icon}</span>
                    {item.label}
                </Link>
            ))}
        </nav>

        {/* Alt kısım */}
        <div className="mt-6 pt-4 border-t border-white/5 space-y-1">
            {user?.kimlikToken && (
                <a href={`/kimlik/${user.kimlikToken}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-white hover:bg-red-500/10 rounded-xl transition-all">
                    <ShieldCheck size={18} className="text-red-500" /> Dijital Kimliğim
                </a>
            )}
            <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                <Home size={18} /> Ana Sayfaya Dön
            </Link>
            {isAdmin && (
                <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all">
                    <ShieldCheck size={18} /> Admin Paneli
                </Link>
            )}
            <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-left"
            >
                <LogOut size={18} /> Çıkış Yap
            </button>
        </div>
    </div>
);

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, isAdmin, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Sayfa değişince sidebar kapansın
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Body scroll kilitle sidebar açıkken
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [sidebarOpen]);

    const navItems = [
        { href: "/portal", label: "Eğitim Videoları", icon: <Video size={20} /> },
        { href: "/portal/profil", label: "Profilim", icon: <User size={20} /> },
        { href: "/portal/aidat", label: "Aidat & Bağış", icon: <CreditCard size={20} /> },
        { href: "/portal/sertifikalar", label: "Sertifikalarım", icon: <Star size={20} /> },
        { href: "/portal/dokumanlar", label: "Dökümanlar", icon: <BookOpen size={20} /> },
        { href: "/portal/envanter", label: "Malzeme Arşivi", icon: <Box size={20} /> },
    ];

    return (
        <ProtectedRoute adminOnly={false}>
            <div className="min-h-screen bg-[#020617] flex flex-col">


                {/* MOBİL HEADER BAR */}
                <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#050B14]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-xl bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                        >
                            <Menu size={22} />
                        </button>
                        <div>
                            <span className="text-white font-bold text-sm uppercase tracking-wider">Üye Portalı</span>
                            <p className="text-[10px] text-neutral-500 leading-none mt-0.5">
                                {navItems.find(n => n.href === pathname)?.label || "M1G"}
                            </p>
                        </div>
                    </div>
                    <img src="/m1g-logo.png" alt="M1G" className="w-8 h-8 object-contain opacity-80" />
                </header>

                {/* MOBİL OVERLAY */}
                {sidebarOpen && (
                    <div
                        className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <div className="flex flex-1 md:pt-0 pt-[57px]">
                    {/* DESKTOP SIDEBAR — sabit */}
                    <aside className="hidden md:flex w-64 bg-[#050B14] border-r border-white/5 flex-shrink-0 flex-col p-5 sticky top-0 h-screen overflow-y-auto">
                        <SidebarContent 
                            setSidebarOpen={setSidebarOpen} 
                            user={user} 
                            isAdmin={isAdmin} 
                            logout={logout} 
                            pathname={pathname} 
                            navItems={navItems} 
                        />
                    </aside>

                    {/* MOBİL DRAWER SIDEBAR — slide-in */}
                    <aside className={clsx(
                        "md:hidden fixed top-0 left-0 h-full w-72 z-[60] bg-[#050B14] border-r border-white/10 p-5 flex flex-col",
                        "transition-transform duration-300 ease-in-out shadow-2xl",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}>
                        <SidebarContent 
                            setSidebarOpen={setSidebarOpen} 
                            user={user} 
                            isAdmin={isAdmin} 
                            logout={logout} 
                            pathname={pathname} 
                            navItems={navItems} 
                        />
                    </aside>

                    {/* İÇERİK */}
                    <main className="flex-1 min-w-0 overflow-y-auto">
                        <div className="p-4 md:p-8 max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
