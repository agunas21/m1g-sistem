"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ShieldAlert, AlertCircle, Loader2, KeyRound, Mail, Phone, CreditCard, ArrowLeft, CheckCircle2, Send } from "lucide-react";
import Link from "next/link";

export default function Login() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword]     = useState("");
    const [error, setError]           = useState("");
    const [loading, setLoading]       = useState(false);
    const [mode, setMode]             = useState<"login" | "reset" | "resetSuccess">("login");
    const [resetEmail, setResetEmail] = useState("");
    const [resetMsg, setResetMsg]     = useState("");

    const { setTestUser } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Giriş başarısız.");
                setLoading(false);
                return;
            }

            // Session'ı localStorage'a kaydet
            if (typeof window !== "undefined") {
                localStorage.setItem("m1g_test_user", JSON.stringify(data.user));
            }

            setTestUser(data.user.isAdmin, data.user);

            if (data.user.isAdmin) {
                router.push("/admin");
            } else {
                router.push("/portal");
            }
        } catch {
            setError("Sunucuya bağlanılamadı.");
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResetMsg("");

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            });
            const data = await res.json();
            setResetMsg(data.message || "İşlem tamamlandı.");
            setMode("resetSuccess");
        } catch {
            setResetMsg("Sunucu hatası. Tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md mt-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center flex-col items-center gap-4"
                >
                    <div className="relative group cursor-pointer">
                        <div className="absolute inset-0 bg-red-600 blur-xl opacity-60 rounded-full animate-[pulse_2s_infinite]"></div>
                        <img src="/m1g-logo.png" alt="M1G Logo" className="w-[80px] h-[80px] object-contain relative z-10 group-hover:rotate-180 transition-transform duration-700" />
                    </div>
                    <h2 className="text-center text-3xl font-extrabold text-white">
                        {mode === "login" ? "M1G Portalı Giriş" : "Şifre Sıfırlama"}
                    </h2>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
            >
                <div className="bg-white/5 border border-white/10 py-8 px-4 shadow-2xl backdrop-blur-xl sm:rounded-2xl sm:px-10">

                    <AnimatePresence mode="wait">
                        {/* ═══ GİRİŞ FORMU ═══ */}
                        {mode === "login" && (
                            <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="space-y-5" onSubmit={handleLogin}
                            >
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-3 text-red-400 text-sm">
                                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                {/* Giriş yöntemleri açıklaması */}
                                <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl">
                                    <p className="text-[11px] text-blue-400 font-medium mb-2">Aşağıdakilerden biriyle giriş yapabilirsiniz:</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="flex items-center gap-1 text-[10px] bg-white/5 text-neutral-300 px-2 py-1 rounded-full border border-white/10">
                                            <CreditCard size={10} /> TC Kimlik No
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] bg-white/5 text-neutral-300 px-2 py-1 rounded-full border border-white/10">
                                            <Mail size={10} /> E-posta
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] bg-white/5 text-neutral-300 px-2 py-1 rounded-full border border-white/10">
                                            <Phone size={10} /> Telefon
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] bg-white/5 text-neutral-300 px-2 py-1 rounded-full border border-white/10">
                                            <KeyRound size={10} /> Üye ID
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="identifier" className="block text-sm font-medium text-neutral-300 mb-1">
                                        TC / E-posta / Telefon / Üye ID
                                    </label>
                                    <input
                                        id="identifier"
                                        type="text"
                                        required
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 border border-white/10 rounded-xl placeholder-neutral-600 bg-black/50 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                                        placeholder="Örn: 12345678901 veya user@mail.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1">
                                        Şifre
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 border border-white/10 rounded-xl placeholder-neutral-600 bg-black/50 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                                        placeholder="İlk giriş: TC Kimlik No"
                                    />
                                    <p className="text-[10px] text-neutral-600 mt-1.5">İlk girişte şifreniz TC Kimlik Numaranızdır.</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-white/10 rounded bg-white/5" />
                                        <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-400">
                                            Beni Hatırla
                                        </label>
                                    </div>
                                    <button type="button" onClick={() => setMode("reset")} className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors">
                                        Şifremi Unuttum
                                    </button>
                                </div>

                                <button
                                    type="submit" disabled={loading}
                                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-all uppercase tracking-widest"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Giriş Yap"}
                                </button>
                            </motion.form>
                        )}

                        {/* ═══ ŞİFRE SIFIRLAMA ═══ */}
                        {mode === "reset" && (
                            <motion.form key="reset" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="space-y-5" onSubmit={handlePasswordReset}
                            >
                                <button type="button" onClick={() => setMode("login")} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-2">
                                    <ArrowLeft size={14} /> Giriş ekranına dön
                                </button>

                                <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                                    <p className="text-xs text-amber-400">
                                        Kayıtlı e-posta adresinizi girin. Şifre sıfırlama talimatları e-postanıza gönderilecektir.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="reset-email" className="block text-sm font-medium text-neutral-300 mb-1">
                                        Kayıtlı E-posta Adresi
                                    </label>
                                    <input
                                        id="reset-email" type="email" required
                                        value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 border border-white/10 rounded-xl placeholder-neutral-600 bg-black/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                                        placeholder="ornek@mail.com"
                                    />
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-black text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-all uppercase tracking-widest"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={16} /> Sıfırlama Gönder</>}
                                </button>
                            </motion.form>
                        )}

                        {/* ═══ SIFIRLAMA BAŞARILI ═══ */}
                        {mode === "resetSuccess" && (
                            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="text-center py-6 space-y-5"
                            >
                                <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
                                <h3 className="text-xl font-bold text-white">İşlem Tamamlandı</h3>
                                <p className="text-neutral-400 text-sm">{resetMsg}</p>
                                <button onClick={() => { setMode("login"); setResetEmail(""); }}
                                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors"
                                >
                                    Giriş Ekranına Dön
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
