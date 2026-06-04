"use client";

import { motion } from "framer-motion";
import { Tv, Users, Presentation, Calendar, ExternalLink } from "lucide-react";

export default function CanliYayin() {
    return (
        <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col pb-10">
            <div className="mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-white mb-2 flex items-center gap-3 uppercase tracking-tight">
                    <Tv size={28} className="text-indigo-500" /> Canlı Eğitimler
                </h1>
                <p className="text-neutral-500 text-sm md:text-lg font-light italic">Konferans ve interaktif eğitimlere buradan katılın.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Interface */}
                <div className="lg:col-span-2 flex flex-col bg-neutral-900 border border-white/10 p-2 rounded-2xl md:rounded-3xl shadow-2xl relative overflow-hidden h-[300px] md:h-[500px]">
                    {/* Simulated Live Interface container */}
                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 text-center z-0">
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-16 h-16 md:w-24 md:h-24 bg-red-600/20 rounded-full flex items-center justify-center mb-4 md:mb-6"
                        >
                            <Presentation size={32} className="md:size-48 text-red-500" />
                        </motion.div>
                        <h2 className="text-lg md:text-2xl font-bold text-white mb-2 uppercase tracking-wide">Yayın Henüz Başlamadı</h2>
                        <p className="text-neutral-500 text-xs md:text-sm mb-6 md:mb-8 max-w-md">Aktif yayın olduğunda arayüz burada görüntülenecektir.</p>

                        <a
                            href="https://meet.google.com/new"
                            target="_blank"
                            rel="noreferrer"
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-widest uppercase rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs md:text-sm"
                        >
                            <ExternalLink size={16} /> Uygulama İle Katıl
                        </a>
                    </div>
                </div>

                {/* Schedule */}
                <div className="lg:col-span-1 border border-white/5 bg-neutral-900 rounded-3xl p-6 relative">
                    <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-emerald-500" />
                        Canlı Eğitim Takvimi
                    </h3>

                    <div className="space-y-4">
                        {/* Event 1 */}
                        <div className="bg-black/40 border border-white/5 p-4 rounded-xl relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                            <p className="text-xs text-red-400 font-bold mb-1">BU AKŞAM - 20:00</p>
                            <h4 className="text-sm text-white font-semibold mb-1">Afet Psikolojisi ve İletişim</h4>
                            <p className="text-xs text-neutral-500 flex items-center gap-1"><Users size={12} /> Konuk: Prof. Dr. Ayfer Tan</p>
                        </div>

                        {/* Event 2 */}
                        <div className="bg-black/40 border border-white/5 p-4 rounded-xl relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                            <p className="text-xs text-indigo-400 font-bold mb-1">12 NİSAN - 14:00</p>
                            <h4 className="text-sm text-white font-semibold mb-1">Harita Okuma ve Yön Bulma</h4>
                            <p className="text-xs text-neutral-500 flex items-center gap-1"><Users size={12} /> Eğitmen: Operasyon Şefi</p>
                        </div>

                        {/* Event 3 */}
                        <div className="bg-black/40 border border-white/5 p-4 rounded-xl relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-600"></div>
                            <p className="text-xs text-neutral-400 font-bold mb-1">18 NİSAN - 19:30</p>
                            <h4 className="text-sm text-white font-semibold mb-1">Temel Deniz Kurtarma</h4>
                            <p className="text-xs text-neutral-500 flex items-center gap-1"><Users size={12} /> Sahil Güvenlik Personeli</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
