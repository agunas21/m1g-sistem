"use client";

import { motion } from "framer-motion";
import { HeartHandshake, ShieldCheck, Loader2, Send } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function GonulluOl() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form gönderim işlemi — gerçek API'ye gönderir
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const form = e.currentTarget;
        const formData = new FormData(form);
        const payload: Record<string, any> = {};
        formData.forEach((val, key) => { payload[key] = val; });

        try {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSuccess(true);
            } else {
                alert('Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        } catch {
            alert('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pt-12 pb-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Title */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <HeartHandshake className="w-10 h-10 text-red-500" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-extrabold text-white mb-4"
                    >
                        Gönüllü Başvuru Formu
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-neutral-400 text-lg"
                    >
                        Başvurunuz İnsan Kaynakları Bölümü tarafından değerlendirildikten sonra tanışma toplantısı ya da mülakata çağırılacaksınız.
                    </motion.p>
                    <p className="text-red-500 text-sm mt-4 font-bold tracking-widest uppercase">*Not: Bu form önbaşvuru içindir.</p>
                </div>

                {/* Form Container */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="bg-neutral-900 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
                >
                    {success ? (
                        <div className="text-center py-20">
                            <ShieldCheck className="w-24 h-24 text-emerald-500 mx-auto mb-6" />
                            <h2 className="text-3xl font-bold text-white mb-4">Başvurunuz Alındı!</h2>
                            <p className="text-neutral-400 mb-8 max-w-md mx-auto">
                                Gönüllülük başvurunuz M1G yönetim merkezine başarıyla iletildi. Formda belirttiğiniz e-posta ve telefon üzerinden sizinle iletişime geçeceğiz. Seminer ve ilk eğitimlerde görüşmek üzere.
                            </p>
                            <Link href="/" className="px-8 py-3 bg-red-600 font-bold hover:bg-red-700 text-white rounded-xl transition-all">
                                Anasayfaya Dön
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Adınız</label>
                                    <input type="text" name="isim" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" placeholder="Ahmet" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Soyadınız</label>
                                    <input type="text" name="soyisim" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" placeholder="Yılmaz" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">E-Posta Adresi</label>
                                    <input type="email" name="email" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" placeholder="ornek@mail.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Telefon Numarası</label>
                                    <input type="tel" name="telefon" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" placeholder="05XX XXX XX XX" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Kan Grubu</label>
                                    <select name="kan_grubu" defaultValue="" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors appearance-none">
                                        <option value="" disabled>Seçiniz</option>
                                        <option value="A+">A Rh (+)</option>
                                        <option value="A-">A Rh (-)</option>
                                        <option value="B+">B Rh (+)</option>
                                        <option value="B-">B Rh (-)</option>
                                        <option value="0+">0 Rh (+)</option>
                                        <option value="0-">0 Rh (-)</option>
                                        <option value="AB+">AB Rh (+)</option>
                                        <option value="AB-">AB Rh (-)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Bulunduğunuz Şehir</label>
                                    <input type="text" name="sehir" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" placeholder="Örn: İstanbul" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Geçmiş Deneyimleriniz veya Neden Katılmak İstiyorsunuz?</label>
                                <textarea name="deneyim_notu" rows={4} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors resize-none" placeholder="Varsa arama kurtarma, ilkyardım ve dağcılık gibi deneyimlerinizden bahsediniz..."></textarea>
                            </div>

                            <div className="flex items-start gap-3 mt-4 bg-[#020617] p-4 rounded-xl border border-red-500/20">
                                <input type="checkbox" id="afad_cert" name="afad_cert" className="mt-1 w-5 h-5 accent-red-600 bg-black/50 border-white/10 rounded" />
                                <label htmlFor="afad_cert" className="text-sm font-medium text-neutral-300 leading-snug cursor-pointer">
                                    <strong className="text-red-500 block mb-1">Afad Online Temel Eğitim Sertifikaları Sahibiyim</strong>
                                    Eğer bu sertifikalara sahipseniz lütfen işaretleyin, öncelikli değerlendirme sebebidir.
                                </label>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 text-lg font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {loading ? (
                                        <><Loader2 className="animate-spin w-6 h-6" /> Gönderiliyor...</>
                                    ) : (
                                        <>Başvuruyu Tamamla <Send className="w-5 h-5 ml-1" /></>
                                    )}
                                </button>
                            </div>

                            <p className="text-xs text-neutral-600 text-center mt-6">
                                Başvuruyu tamamlayarak Gizlilik Politikası'nı kabul etmiş sayılırsınız. Form verileri doğrudan yönetim e-posta adresine iletilir.
                            </p>
                        </form>
                    )}

                </motion.div>
            </div>
        </div>
    );
}
