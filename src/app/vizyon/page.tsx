"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crosshair, Globe, Shield, Zap } from "lucide-react";

export default function Vizyon() {
    const [vizyonTitle, setVizyonTitle] = useState("ASLA GERİDE \n BIRAKMA");
    const [vizyonBadge, setVizyonBadge] = useState("Stratejik Doktrin");
    const [vizyonDesc, setVizyonDesc] = useState("M1G'nin varoluş sebebi sadece hayat kurtarmak değildir; ulaşılamaz sanılan yere ulaşıp, o ilk umut ışığını yakmaktır. Stratejimiz, hızımız ve tecrübemizdir.");
    const [vizyonText, setVizyonText] = useState("Türkiye'de ve uluslararası arenada; arazi kurtarma donanımı, uzmanlığı ve reaksiyon hızıyla örnek gösterilen, dünyanın en prestijli arama kurtarma otoritelerinden biri olmak.");
    const [misyonText, setMisyonText] = useState("Doğal afetler, kayıp vakaları ve ekstrem dağcılık kazalarında dil, din, ırk ayrımı gözetmeksizin, ölümle burun buruna gelen herkese maksimum 45 dakika içinde ilk teması sağlamak.");
    const [degerlerList, setDegerlerList] = useState<string[]>([
        "Koşulsuz Yaşama Saygı",
        "Askeri Düzeyde Disiplin",
        "Sürekli Saha Eğitimi",
        "Kopmaz Takım Ruhu"
    ]);

    useEffect(() => {
        fetch("/api/settings/public?t=" + Date.now())
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    if (data.vizyonTitle) setVizyonTitle(data.vizyonTitle);
                    if (data.vizyonBadge) setVizyonBadge(data.vizyonBadge);
                    if (data.vizyonDesc) setVizyonDesc(data.vizyonDesc);
                    if (data.vizyonText) setVizyonText(data.vizyonText);
                    if (data.misyonText) setMisyonText(data.misyonText);
                    if (data.degerlerList && data.degerlerList.length > 0) {
                        setDegerlerList(data.degerlerList);
                    }
                }
            })
            .catch(err => console.error(err));
    }, []);

    const renderTitle = () => {
        const lines = vizyonTitle.split('\n');
        if (lines.length > 1) {
            return (
                <>
                    {lines[0]} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                        {lines.slice(1).join('\n')}
                    </span>
                </>
            );
        }
        const words = vizyonTitle.split(' ');
        if (words.length > 1) {
            const lastWord = words.pop();
            return (
                <>
                    {words.join(' ')}{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                        {lastWord}
                    </span>
                </>
            );
        }
        return vizyonTitle;
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
    };

    return (
        <div className="min-h-screen bg-[#020617] pt-32 pb-24 relative overflow-hidden">
            {/* Dark topographic grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-500/20 text-red-500 rounded-full mb-8"
                    >
                        <Crosshair size={16} className="animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em] pt-0.5">{vizyonBadge}</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-6xl md:text-8xl font-black text-white uppercase tracking-tighter mb-8 max-w-5xl mx-auto leading-none"
                    >
                        {renderTitle()}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 1 }}
                        className="max-w-3xl mx-auto text-xl md:text-2xl text-neutral-400 font-light leading-relaxed border-l-4 border-red-600 pl-6 text-left"
                    >
                        {vizyonDesc}
                    </motion.p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {/* VİZYON */}
                    <motion.div variants={item} className="bg-black border border-white/5 p-6 sm:p-10 hover:border-red-500/50 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Globe size={180} />
                        </div>
                        <div className="text-red-500 mb-8 border-b border-white/10 pb-6 w-16">
                            <span className="text-5xl font-black">01</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-wider">Vizyon</h3>
                        <p className="text-neutral-400 leading-relaxed font-light text-lg">
                            {vizyonText}
                        </p>
                    </motion.div>

                    {/* MİSYON */}
                    <motion.div variants={item} className="bg-black border border-white/5 p-6 sm:p-10 hover:border-red-500/50 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Shield size={180} />
                        </div>
                        <div className="text-red-500 mb-8 border-b border-red-500/50 pb-6 w-16">
                            <span className="text-5xl font-black">02</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-wider">Misyon</h3>
                        <p className="text-neutral-400 leading-relaxed font-light text-lg">
                            {misyonText}
                        </p>
                    </motion.div>

                    {/* DEĞERLER */}
                    <motion.div variants={item} className="bg-red-600 border border-red-500 p-10 hover:bg-red-700 transition-all duration-500 group relative overflow-hidden shadow-[0_0_50px_rgba(234,29,44,0.2)]">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Zap size={180} />
                        </div>
                        <div className="text-white mb-8 border-b border-white/30 pb-6 w-16">
                            <span className="text-5xl font-black opacity-80">03</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-wider">Değerler</h3>
                        <ul className="text-red-100 leading-relaxed space-y-4 font-medium text-lg">
                            {degerlerList.map((val, idx) => (
                                <li key={idx} className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-white rotate-45"></div> {val}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </motion.div>

            </div>
        </div>
    );
}
