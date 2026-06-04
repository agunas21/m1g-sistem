"use client";

/**
 * M1G — MFA Kurulum Sayfası
 *
 * Yönetim Kurulu için zorunlu, diğer üyeler için isteğe bağlı.
 * Google Authenticator & Microsoft Authenticator ile QR tarama.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, QrCode, Copy, CheckCircle, Loader2, AlertCircle, Download, ArrowRight, Key } from "lucide-react";

type Step = "intro" | "qr" | "verify" | "backup" | "done";

export default function MfaKurulumPage() {
    const [step, setStep] = useState<Step>("intro");
    const [qrData, setQrData] = useState<{
        qrCodeDataUrl: string;
        secret: string;
        backupCodes: string[];
    } | null>(null);
    const [totpCode, setTotpCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [backupCopied, setBackupCopied] = useState(false);

    // Adım 1 → 2: Setup API'yi çağır
    async function startSetup() {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/totp?action=setup", {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Kurulum başlatılamadı.");
                return;
            }
            setQrData(data);
            setStep("qr");
        } catch {
            setError("Bağlantı hatası. Tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    }

    // Adım 3: Kodu doğrula
    async function verifyCode() {
        if (totpCode.length !== 6 || !/^\d{6}$/.test(totpCode)) {
            setError("6 haneli rakam kodu girin.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/totp?action=verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ totpCode }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Kod doğrulanamadı.");
                return;
            }
            setStep("backup");
        } catch {
            setError("Bağlantı hatası.");
        } finally {
            setLoading(false);
        }
    }

    function copySecret() {
        if (qrData?.secret) {
            navigator.clipboard.writeText(qrData.secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    function copyBackupCodes() {
        if (qrData?.backupCodes) {
            navigator.clipboard.writeText(qrData.backupCodes.join("\n"));
            setBackupCopied(true);
            setTimeout(() => setBackupCopied(false), 2000);
        }
    }

    function downloadBackupCodes() {
        if (!qrData?.backupCodes) return;
        const content = `M1G ARAMA & KURTARMA — MFA YEDEK KODLARI\n` +
            `Oluşturulma: ${new Date().toLocaleString("tr-TR")}\n\n` +
            `BU KODLARI GÜVENLİ BİR YERDE SAKLAYIN!\n\n` +
            qrData.backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
            `\n\nHer kod yalnızca bir kez kullanılabilir.`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "m1g-mfa-yedek-kodlar.txt";
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="min-h-screen bg-[#050b14] flex items-center justify-center p-4">
            {/* Arka plan efekti */}
            <div className="fixed inset-0 bg-gradient-to-br from-purple-900/10 via-[#050b14] to-blue-900/10 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Başlık */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-4">
                        <Shield className="w-8 h-8 text-purple-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">İki Faktörlü Doğrulama</h1>
                    <p className="text-neutral-400 text-sm mt-1">Hesabınızı güvence altına alın</p>
                </div>

                {/* Adım Göstergesi */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {["intro", "qr", "verify", "backup", "done"].map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full transition-all ${
                                step === s ? "bg-purple-400 w-6" :
                                ["intro", "qr", "verify", "backup", "done"].indexOf(step) > i
                                    ? "bg-purple-600" : "bg-white/10"
                            }`} />
                        </div>
                    ))}
                </div>

                {/* Kart */}
                <div className="bg-white/3 backdrop-blur-sm border border-white/8 rounded-2xl p-6">
                    <AnimatePresence mode="wait">

                        {/* Adım 1: Giriş */}
                        {step === "intro" && (
                            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h2 className="text-lg font-semibold text-white mb-3">Neden MFA?</h2>
                                <div className="space-y-3 mb-6">
                                    {[
                                        "Hesabınıza yetkisiz erişimi engeller",
                                        "Şifreniz çalınsa bile güvendesiniz",
                                        "KVKK kapsamında üye verilerini korur",
                                        "30 saniyede bir yenilenen kod"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                            <span className="text-neutral-300 text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-5">
                                    <p className="text-amber-400 text-xs">
                                        📱 Google Authenticator veya Microsoft Authenticator uygulamasını indirin, ardından devam edin.
                                    </p>
                                </div>
                                <button
                                    onClick={startSetup}
                                    disabled={loading}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                    Kurulumu Başlat
                                </button>
                            </motion.div>
                        )}

                        {/* Adım 2: QR Kod */}
                        {step === "qr" && qrData && (
                            <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <QrCode className="w-5 h-5 text-purple-400" />
                                    QR Kodu Tarayın
                                </h2>
                                <p className="text-neutral-400 text-sm mb-4">
                                    Authenticator uygulamanızı açın ve bu QR kodu tarayın.
                                </p>

                                {/* QR Kod */}
                                <div className="flex justify-center mb-4">
                                    <div className="bg-white p-3 rounded-xl">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={qrData.qrCodeDataUrl} alt="TOTP QR Code" width={200} height={200} />
                                    </div>
                                </div>

                                {/* Manuel kod */}
                                <div className="bg-white/5 rounded-xl p-3 mb-4">
                                    <p className="text-[10px] text-neutral-500 mb-1 uppercase tracking-widest">QR tarayamıyorsanız, kodu manuel girin:</p>
                                    <div className="flex items-center gap-2">
                                        <code className="text-purple-300 text-xs font-mono flex-1 break-all">{qrData.secret}</code>
                                        <button
                                            onClick={copySecret}
                                            className="shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 transition-colors"
                                        >
                                            {copied ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep("verify")}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                                >
                                    Kodu Taradım <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}

                        {/* Adım 3: Doğrulama */}
                        {step === "verify" && (
                            <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <Key className="w-5 h-5 text-purple-400" />
                                    Kodu Doğrulayın
                                </h2>
                                <p className="text-neutral-400 text-sm mb-4">
                                    Authenticator uygulamanızdaki 6 haneli kodu girin.
                                </p>

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={totpCode}
                                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white text-center text-3xl font-mono tracking-[1rem] focus:outline-none focus:border-purple-500 mb-4"
                                    autoFocus
                                />

                                {error && (
                                    <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
                                        <AlertCircle size={14} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    onClick={verifyCode}
                                    disabled={loading || totpCode.length !== 6}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Doğrula ve Etkinleştir
                                </button>
                            </motion.div>
                        )}

                        {/* Adım 4: Yedek Kodlar */}
                        {step === "backup" && qrData && (
                            <motion.div key="backup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h2 className="text-lg font-semibold text-white mb-2">Yedek Kodlarınız</h2>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                                    <p className="text-red-400 text-xs font-semibold">
                                        ⚠️ Bu kodları güvenli bir yerde saklayın! Her kod yalnızca bir kez kullanılabilir.
                                        Uygulamaya erişimi kaybederseniz bunları kullanacaksınız.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {qrData.backupCodes.map((code, i) => (
                                        <div key={i} className="bg-white/5 rounded-lg px-3 py-2 font-mono text-sm text-white/80 text-center">
                                            {code}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={copyBackupCodes}
                                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {backupCopied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                                        {backupCopied ? "Kopyalandı" : "Kopyala"}
                                    </button>
                                    <button
                                        onClick={downloadBackupCodes}
                                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Download size={14} />
                                        İndir (.txt)
                                    </button>
                                </div>

                                <button
                                    onClick={() => setStep("done")}
                                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Kodları Kaydettim, Tamamla
                                </button>
                            </motion.div>
                        )}

                        {/* Adım 5: Tamamlandı */}
                        {step === "done" && (
                            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                                <div className="text-center py-4">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                                        <Shield className="w-10 h-10 text-green-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">MFA Etkinleştirildi!</h2>
                                    <p className="text-neutral-400 text-sm mb-6">
                                        Hesabınız artık iki faktörlü doğrulama ile korunuyor.
                                        Bir sonraki girişinizde Authenticator uygulamanızdaki kodu gireceksiniz.
                                    </p>
                                    <a
                                        href="/portal"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-colors"
                                    >
                                        Portala Dön <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* Yardım */}
                <p className="text-center text-neutral-600 text-xs mt-4">
                    Sorun mu yaşıyorsunuz? <a href="mailto:info@m1g.org.tr" className="text-purple-400 hover:underline">info@m1g.org.tr</a>
                </p>
            </motion.div>
        </div>
    );
}
