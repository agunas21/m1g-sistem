"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Video, Image as ImageIcon, Users, LayoutDashboard, Factory, PenTool, Award, Menu, X, Home, LogOut, Bell, Mail, Activity, FolderArchive, Shield, BookOpen, ShieldAlert } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const SidebarContent = ({ setSidebarOpen, pathname, navItems, logout }: any) => (
    <div className="flex flex-col h-full pb-8 md:pb-0">
        {/* Başlık */}
        <div className="mb-8 flex items-center justify-between">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <h2 className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-500 uppercase tracking-widest">
                        Admin Panel
                    </h2>
                </div>
                <p className="text-[10px] text-neutral-600 uppercase tracking-widest">M1G Yönetim Sistemi</p>
            </div>
            <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
                <X size={18} />
            </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 pr-2 pb-6">
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
                    <span className={pathname === item.href ? "text-red-500" : "text-neutral-600"}>{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge > 0 && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 bg-amber-500 text-black text-[10px] font-black rounded-full flex items-center justify-center px-1.5 animate-pulse">
                            {item.badge}
                        </span>
                    )}
                </Link>
            ))}
        </nav>

        {/* Alt kısım */}
        <div className="mt-6 pt-4 border-t border-white/5 space-y-1">
            <Link href="/portal" className="flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                <Home size={18} /> Üye Portalına Dön
            </Link>
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-600 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                <Home size={18} /> Ana Sayfa
            </Link>
            <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-left"
            >
                <LogOut size={18} /> Çıkış Yap
            </button>
        </div>
    </div>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const checkApprovals = async () => {
            try {
                const res = await fetch('/api/approvals');
                const data = await res.json();
                setPendingCount(data.filter((a: any) => a.status === 'pending').length);
            } catch {}
        };
        checkApprovals();
        const timer = setInterval(checkApprovals, 30000); // her 30sn
        return () => clearInterval(timer);
    }, []);

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

    const isLojistik = (user as any)?.role === 'Lojistik Sorumlusu';
    const isSuperAdmin = (user as any)?.isSuperAdmin === true;

    const allNavItems = [
        { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
        { href: "/admin/operasyonlar", label: "Operasyonlar & Eğitim", icon: <Activity size={20} /> },
        { href: "/admin/sayfalar", label: "Sayfa ve Metin CMS", icon: <PenTool size={20} /> },
        { href: "/admin/sertifikalar", label: "Sertifikalar", icon: <Award size={20} /> },
        { href: "/admin/dokumanlar", label: "Döküman Arşivi", icon: <BookOpen size={20} /> },
        { href: "/admin/icerik", label: "İçerik Yönetimi", icon: <ImageIcon size={20} /> },
        { href: "/admin/videolar", label: "Eğitim Videoları", icon: <Video size={20} /> },
        { href: "/admin/uyeler", label: "Personel & Üye", icon: <Users size={20} /> },
        { href: "/admin/depo", label: "Depo & Lojistik", icon: <Factory size={20} /> },
        { href: "/admin/onaylar", label: "Onay Merkezi", icon: <Bell size={20} />, badge: pendingCount },
        { href: "/admin/mesajlar", label: "Gelen Mesajlar", icon: <Mail size={20} /> },
        { href: "/admin/sistem-kayitlari", label: "Sistem Kayıtları", icon: <Activity size={20} /> },
        { href: "/admin/arsiv", label: "Sistem Arşivi", icon: <FolderArchive size={20} /> },
        { href: "/admin/guvenlik", label: "Siber Güvenlik", icon: <Shield size={20} /> },
        ...(isSuperAdmin ? [{ href: "/admin/sistem", label: "Sistem & Yedek", icon: <ShieldAlert size={20} /> }] : []),
    ];

    const navItems = allNavItems.filter(item => {
        if (isLojistik) {
            return item.href === '/admin' || item.href === '/admin/depo';
        }
        return true;
    });

    const isRestrictedRoute = isLojistik && pathname !== '/admin' && pathname !== '/admin/depo';

    return (
        <ProtectedRoute adminOnly={true}>
            <div className="min-h-[100dvh] bg-[#020617] flex flex-col">


                {/* MOBİL HEADER BAR */}
                <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#050B14]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-xl bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white transition-all active:scale-95 border border-white/5"
                        >
                            <Menu size={22} />
                        </button>
                        <div>
                            <span className="text-white font-bold text-sm uppercase tracking-wider">Admin Panel</span>
                            <p className="text-[10px] text-red-500 leading-none mt-0.5 font-bold uppercase tracking-widest">
                                {navItems.find(n => n.href === pathname)?.label || "Yönetim"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-[9px] text-red-500 font-black uppercase tracking-tighter">Sistem Aktif</span>
                            </div>
                        </div>
                        <img src="/m1g-logo.png" alt="M1G" className="w-8 h-8 object-contain opacity-90" />
                    </div>
                </header>

                {/* MOBİL OVERLAY */}
                {sidebarOpen && (
                    <div
                        className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <div className="flex flex-1 pt-[57px] md:pt-0">
                    {/* DESKTOP SIDEBAR — sabit */}
                    <aside className="hidden md:flex w-60 bg-[#050B14] border-r border-white/5 flex-shrink-0 flex-col p-4 sticky top-0 h-[100dvh] overflow-y-auto">
                        <SidebarContent 
                            setSidebarOpen={setSidebarOpen} 
                            pathname={pathname} 
                            navItems={navItems} 
                            logout={logout} 
                        />
                    </aside>

                    {/* MOBİL DRAWER SIDEBAR — slide-in */}
                    <aside className={clsx(
                        "md:hidden fixed top-0 left-0 h-[100dvh] w-72 z-[60] bg-[#050B14] border-r border-white/10 p-5 flex flex-col overflow-y-auto",
                        "transition-transform duration-300 ease-in-out shadow-2xl",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}>
                        <SidebarContent 
                            setSidebarOpen={setSidebarOpen} 
                            pathname={pathname} 
                            navItems={navItems} 
                            logout={logout} 
                        />
                    </aside>

                    {/* İÇERİK */}
                    <main className="flex-1 min-w-0 overflow-y-auto">
                        <div className="p-4 md:p-8 max-w-7xl mx-auto">
                            {isRestrictedRoute ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center">
                                    <Shield className="w-16 h-16 text-red-600 mb-4" />
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Erişim Engellendi</h2>
                                    <p className="text-neutral-400">Lojistik sorumlusu olarak bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</p>
                                </div>
                            ) : (
                                children
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
