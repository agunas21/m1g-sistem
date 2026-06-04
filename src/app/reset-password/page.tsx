"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!token) {
            setError("Geçersiz veya eksik sıfırlama tokeni.");
            return;
        }

        if (password.length < 6) {
            setError("Şifre en az 6 karakter olmalıdır.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Şifreler uyuşmuyor.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Şifre sıfırlanamadı.");
                setLoading(false);
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch {
            setError("Sunucu hatası. Lütfen tekrar deneyin.");
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center py-6 space-y-4">
                <AlertCircle size={48} className="mx-auto text-red-500" />
                <h3 className="text-xl font-bold text-white">Geçersiz Bağlantı</h3>
                <p className="text-neutral-400 text-sm">Şifre sıfırlama bağlantısı eksik veya geçersiz.</p>
                <button onClick={() => router.push("/login")} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors">
                    Giriş Ekranına Dön
                </button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center py-6 space-y-4">
                <CheckCircle2 size={48} className="mx-auto text-emerald-500 animate-bounce" />
                <h3 className="text-xl font-bold text-white">Şifreniz Değiştirildi</h3>
                <p className="text-neutral-400 text-sm">Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-3 text-red-400 text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Yeni Şifre
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full px-4 py-3 border border-white/10 rounded-xl placeholder-neutral-600 bg-black/50 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm pr-10"
                        placeholder="En az 6 karakter"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Yeni Şifre Tekrar
                </label>
                <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-white/10 rounded-xl placeholder-neutral-600 bg-black/50 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                    placeholder="Şifreyi tekrar yazın"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-all uppercase tracking-widest"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Şifreyi Güncelle"}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
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
                        <img src="/m1g-logo.png" alt="M1G Logo" className="w-[80px] h-[80px] object-contain relative z-10" />
                    </div>
                    <h2 className="text-center text-3xl font-extrabold text-white">
                        Şifre Sıfırlama
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
                    <Suspense fallback={
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-red-500" size={32} />
                        </div>
                    }>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </motion.div>
        </div>
    );
}
