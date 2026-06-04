"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Menu, X, ShieldAlert, User, LogOut, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NavHeader } from "@/components/ui/nav-header";

export default function Navbar() {
    const { user, isAdmin, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [logo, setLogo] = useState("/m1g-logo.png");
    const pathname = usePathname();

    useEffect(() => {
        fetch('/api/settings/public?t=' + Date.now())
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.siteLogo) {
                    setLogo(data.siteLogo);
                }
            })
            .catch(() => {});
    }, []);

    if (pathname?.startsWith("/admin")) return null;

    const links = [
        { href: "/", label: "Anasayfa" },
        { href: "/hakkimizda", label: "Hakkımızda" },
        { href: "/operasyonlar", label: "Operasyonlar" },
        { href: "/faaliyetler", label: "Faaliyetler" },
        { href: "/etkinlikler", label: "Etkinlikler" },
        { href: "/vizyon", label: "Vizyon" },
        { href: "/iletisim", label: "İletişim" },
    ];

    return (
        <nav className="fixed w-full z-50 transition-all flex flex-col">


            {/* MAIN NAVBAR */}
            <div className="bg-background/80 backdrop-blur-md border-b border-white/10 shadow-sm w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative group-hover:scale-105 transition-transform duration-500">
                                <div className="absolute inset-0 bg-red-600 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 rounded-full"></div>
                                <img src={logo} alt="M1G Logo" className="w-[50px] h-[50px] object-contain relative z-10 group-hover:rotate-180 transition-transform duration-700" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-xl md:text-2xl tracking-tighter text-white uppercase leading-none">
                                    M1<span className="text-red-500">G</span>
                                </span>
                                <span className="text-[9px] md:text-[10px] text-neutral-400 font-bold tracking-widest uppercase mt-0.5">Arama Kurtarma</span>
                            </div>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden lg:flex items-center">
                            <NavHeader links={links} />

                            <div className="ml-4 pl-4 border-l border-white/10 flex items-center gap-3">
                                {user ? (
                                    <>
                                        <Link
                                            href="/portal"
                                            className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-neutral-800 text-white hover:bg-neutral-700 border border-white/5 transition-colors"
                                        >
                                            Üye Portalı
                                        </Link>
                                        {isAdmin && (
                                            <Link
                                                href="/admin"
                                                className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest whitespace-nowrap bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/30 transition-colors"
                                            >
                                                Admin
                                            </Link>
                                        )}
                                        <button
                                            onClick={logout}
                                            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                            title="Çıkış Yap"
                                        >
                                            <LogOut size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="px-5 py-2 rounded-full text-[11px] font-bold tracking-widest whitespace-nowrap uppercase bg-red-600 text-white hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all hover:scale-105"
                                    >
                                        Üye Girişi
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="lg:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-neutral-400 hover:text-white p-2"
                            >
                                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            {links.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={clsx(
                                        "block px-3 py-3 rounded-lg text-base font-medium",
                                        pathname === link.href ? "text-red-500 bg-red-500/10" : "text-neutral-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            <div className="pt-4 mt-2 border-t border-white/10 flex flex-col gap-2">
                                {user ? (
                                    <>
                                        <Link
                                            href="/portal"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block px-3 py-3 rounded-lg text-base font-medium bg-neutral-800 text-white"
                                        >
                                            Üye Portalı
                                        </Link>
                                        {isAdmin && (
                                            <Link
                                                href="/admin"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="block px-3 py-3 rounded-lg text-base font-medium bg-indigo-600/20 text-indigo-400"
                                            >
                                                Admin Paneli
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsMenuOpen(false);
                                            }}
                                            className="block w-full text-left px-3 py-3 rounded-lg text-base font-medium text-red-400 hover:bg-red-400/10"
                                        >
                                            Çıkış Yap
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="block px-3 py-3 text-center rounded-lg text-base font-bold tracking-wider uppercase bg-red-600 text-white"
                                    >
                                        Üye Girişi
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
