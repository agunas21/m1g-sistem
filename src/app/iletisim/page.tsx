"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Send, CheckCircle, Loader2, Globe, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function IletisimPage() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        
        try {
            const { db } = await import("@/lib/firebase");
            const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
            
            await addDoc(collection(db, "messages"), {
                ...form,
                status: "unread",
                createdAt: serverTimestamp(),
            });

            setSending(false);
            setSent(true);
            setTimeout(() => setSent(false), 4000);
            setForm({ name: "", email: "", phone: "", subject: "", message: "" });
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Mesaj gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.");
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
                    <span className="text-red-500 font-bold tracking-[0.3em] uppercase text-xs mb-3 block">Bize Ulaşın</span>
                    <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        İLETİŞ<span className="text-neutral-500">İM</span>
                    </h1>
                    <div className="w-20 h-1 bg-red-600 mx-auto mb-6"></div>
                    <p className="text-neutral-400 max-w-2xl mx-auto">
                        Sorularınız, önerileriniz veya işbirliği talepleriniz için bize ulaşabilirsiniz.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Form */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                        <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8">
                            <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Send size={18} className="text-red-500" /> Mesaj Gönderin
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Ad Soyad *</label>
                                        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500 transition-colors"
                                            placeholder="Adınız Soyadınız" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">E-posta *</label>
                                        <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500 transition-colors"
                                            placeholder="ornek@email.com" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Telefon</label>
                                        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500 transition-colors"
                                            placeholder="+90 5xx xxx xx xx" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Konu *</label>
                                        <select required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500 transition-colors">
                                            <option value="">Seçiniz</option>
                                            <option value="genel">Genel Bilgi</option>
                                            <option value="gonullu">Gönüllülük</option>
                                            <option value="bagis">Bağış & Destek</option>
                                            <option value="isbirligi">İşbirliği</option>
                                            <option value="basin">Basın & Medya</option>
                                            <option value="diger">Diğer</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Mesajınız *</label>
                                    <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                                        rows={5}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500 transition-colors resize-none"
                                        placeholder="Mesajınızı buraya yazabilirsiniz..." />
                                </div>
                                <button type="submit" disabled={sending || sent}
                                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${sent
                                        ? "bg-emerald-600 text-white"
                                        : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                                    } disabled:opacity-60`}>
                                    {sending ? <><Loader2 size={16} className="animate-spin" /> Gönderiliyor...</>
                                        : sent ? <><CheckCircle size={16} /> Mesajınız Alındı!</>
                                        : <><Send size={16} /> Gönder</>}
                                </button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Info & Map */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
                        {/* Contact Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { icon: <MapPin size={20} />, label: "Adres", value: "Sancar Maruflu Sivil Toplum Yerleşkesi, Bahçelievler Mah. 1851/10 Sok. No:3 PK:15 Karşıyaka/İzmir", color: "text-red-400" },
                                { icon: <Phone size={20} />, label: "Telefon", value: "+90 544 727 60 75", color: "text-emerald-400" },
                                { icon: <Mail size={20} />, label: "E-posta", value: "info@m1g.org.tr", color: "text-blue-400" },
                                { icon: <Globe size={20} />, label: "Web", value: "www.m1g.org.tr", color: "text-amber-400" },
                            ].map((item, i) => (
                                <div key={i} className="bg-[#050B14] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
                                    <div className={`${item.color} mb-2`}>{item.icon}</div>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">{item.label}</h3>
                                    <p className="text-white text-sm leading-relaxed">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Map */}
                        <div className="bg-[#050B14] border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/5">
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={14} className="text-red-500" /> Konum
                                </h3>
                            </div>
                            <div className="aspect-video">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3124.1!2d27.1!3d38.46!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDI3JzM2LjAiTiAyN8KwMDYnMDAuMCJF!5e0!3m2!1str!2str!4v1"
                                    width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="w-full h-full"
                                />
                            </div>
                        </div>

                        {/* Social */}
                        <div className="bg-[#050B14] border border-white/10 rounded-xl p-5">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Sosyal Medya</h3>
                            <div className="flex gap-3">
                                {[
                                    { href: "https://instagram.com/m1garamakurtarma", label: "Instagram", color: "hover:bg-pink-600" },
                                    { href: "https://wa.me/905447276075", label: "WhatsApp", color: "hover:bg-green-600" },
                                    { href: "mailto:info@m1g.org.tr", label: "E-posta", color: "hover:bg-blue-600" },
                                ].map((s, i) => (
                                    <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                                        className={`px-4 py-2 rounded-lg bg-white/5 text-neutral-400 text-xs font-bold uppercase tracking-widest ${s.color} hover:text-white transition-all`}>
                                        {s.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
