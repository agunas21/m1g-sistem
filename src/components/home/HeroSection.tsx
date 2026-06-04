"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Truck, Mountain, Play } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const slides = [
    {
        image: "/images/m1gekip.png",
        fallbackClass: "bg-gradient-to-br from-red-900 via-stone-900 to-black",
        title: "BİRLİKTE",
        subtitle: "ASLA GERİDE BIRAKMA"
    },
    {
        image: "/images/Çalışma yüzeyi 1.png",
        fallbackClass: "bg-gradient-to-tr from-stone-900 via-neutral-900 to-zinc-950",
        title: "ÇAMURA",
        subtitle: "DİRENİŞ VE AZİM"
    },
    {
        image: "/images/Başlıksız (2).png",
        fallbackClass: "bg-gradient-to-tl from-slate-900 via-gray-900 to-black",
        title: "HAYATA",
        subtitle: "KARANLIĞI DELEN IŞIK"
    }
];

function getYouTubeEmbedUrl(url?: string): string {
    if (!url) return "https://www.youtube.com/embed/LpRqC213ZLU?autoplay=0&controls=1&showinfo=0&rel=0&modestbranding=1";
    const trimmed = url.trim();
    if (!trimmed) return "https://www.youtube.com/embed/LpRqC213ZLU?autoplay=0&controls=1&showinfo=0&rel=0&modestbranding=1";

    if (trimmed.includes("/embed/")) {
        return trimmed;
    }
    
    let videoId = "";
    try {
        if (trimmed.includes("youtu.be/")) {
            const parts = trimmed.split("youtu.be/");
            if (parts[1]) {
                videoId = parts[1].split(/[?#]/)[0];
            }
        } else if (trimmed.includes("youtube.com/watch")) {
            const parts = trimmed.split("?");
            if (parts[1]) {
                const searchParams = new URLSearchParams(parts[1]);
                videoId = searchParams.get("v") || "";
            }
        } else if (trimmed.includes("youtube.com/shorts/")) {
            const parts = trimmed.split("/shorts/");
            if (parts[1]) {
                videoId = parts[1].split(/[?#]/)[0];
            }
        } else if (trimmed.length === 11) {
            videoId = trimmed;
        }
    } catch (e) {
        console.error("Error parsing YouTube URL:", e);
    }
    
    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&showinfo=0&rel=0&modestbranding=1`;
    }
    
    return trimmed;
}

export default function HeroSection({ title, subtitle, heroBg, heroImages, heroBadge, heroDesc, aboutText, aboutBadge, aboutTitle, aboutTag1, aboutTag2, heroVideoUrl }: {
    title?: string;
    subtitle?: string;
    heroBg?: string;       // eski uyumluluk
    heroImages?: string[]; // yeni: çoklu görsel
    heroBadge?: string;
    heroDesc?: string;
    aboutText?: string;
    aboutBadge?: string;
    aboutTitle?: string;
    aboutTag1?: string;
    aboutTag2?: string;
    heroVideoUrl?: string;
}) {
    const renderAboutTitle = () => {
        const titleText = aboutTitle || "M1G Arama & Kurtarma Ekibi";
        const lines = titleText.split('\n');
        if (lines.length > 1) {
            return (
                <>
                    {lines[0]} <br />
                    {lines[1] && (
                        <>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-500 to-neutral-700">
                                {lines[1]}
                            </span>
                            <br />
                        </>
                    )}
                    {lines.slice(2).join('\n')}
                </>
            );
        }
        const words = titleText.split(' ');
        if (words.length > 2) {
            const first = words[0];
            const middle = words.slice(1, -1).join(' ');
            const last = words[words.length - 1];
            return (
                <>
                    {first} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-500 to-neutral-700">
                        {middle}
                    </span>
                    <br />
                    {last}
                </>
            );
        }
        return titleText;
    };
    // CMS'den gelen görseller varsa onları slider'a entegre et
    const cmsImages = heroImages && heroImages.length > 0
        ? heroImages
        : heroBg ? [heroBg] : [];

    const activeSlides = cmsImages.length > 0
        ? cmsImages.map((img, i) => ({ image: img, fallbackClass: slides[i % slides.length].fallbackClass, title: slides[i % slides.length].title, subtitle: slides[i % slides.length].subtitle }))
        : slides;

    const [currentSlide, setCurrentSlide] = useState(0);
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [activeSlides.length]);

    return (
        <>
            <div ref={containerRef} className="relative h-[100vh] flex items-center justify-center overflow-hidden bg-black perspective-1000">

                {/* Parallax Background Slider */}
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, scale: 1.2 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, transition: { duration: 1.5 } }}
                        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ y }}
                        className="absolute inset-0 z-0"
                    >
                        <div
                            className={`w-full h-full bg-cover bg-center bg-no-repeat ${activeSlides[currentSlide].fallbackClass}`}
                            style={{ backgroundImage: `url(${activeSlides[currentSlide].image})` }}
                        />
                        {/* Extremely dark cinematic vignette overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-black/50 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/90 via-transparent to-transparent"></div>
                    </motion.div>
                </AnimatePresence>

                {/* Cinematic Content */}
                <motion.div
                    style={{ opacity, y: useTransform(scrollYProgress, [0, 1], ["0%", "30%"]) }}
                    className="container relative z-10 px-4 sm:px-6 lg:px-8 pt-20 w-full"
                >
                    <div className="max-w-5xl">

                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                            className="flex items-center gap-4 mb-6 sm:mb-8"
                        >
                            <div className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-2 sm:gap-3">
                                <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-600"></span>
                                </span>
                                <span className="text-white text-[10px] sm:text-sm font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase">
                                    {heroBadge || "M1G Arazi & Dağ Operasyonu"}
                                </span>
                            </div>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`text-${currentSlide}`}
                                initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -50, filter: "blur(10px)", transition: { duration: 0.5 } }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="mb-6"
                            >
                                <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40 tracking-tighter leading-[0.85] mb-4 sm:mb-6 uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                    {title || activeSlides[currentSlide].title}
                                </h1>
                                {/* Subtitle: ince, küçük, zarif — sadece CMS'den geliyorsa göster */}
                                {subtitle && (
                                    <p className="text-sm md:text-base text-neutral-400 font-light leading-relaxed max-w-sm tracking-normal normal-case border-l-2 border-red-600/60 pl-4 ml-1 mt-4">
                                        {subtitle}
                                    </p>
                                )}
                                {/* Slide subtitle: dinamik, şik */}
                                {!subtitle && (
                                    <p className="text-lg sm:text-xl md:text-2xl font-light text-neutral-300 tracking-[0.15em] uppercase max-w-xl leading-snug drop-shadow-xl">
                                        {activeSlides[currentSlide].subtitle}
                                    </p>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                            className="max-w-2xl"
                        >
                            <p className="text-sm sm:text-base md:text-lg text-neutral-200 font-light leading-relaxed mb-6 sm:mb-10 border-l-4 border-red-600 pl-4 sm:pl-6 bg-black/40 backdrop-blur-md rounded-r-2xl py-4 sm:py-5 pr-4 sm:pr-6 shadow-2xl">
                                {heroDesc || "Sadece düzlüklerde değil; sarp vadilerde, kanyonlarda ve en ağır arazilerde profesyonel müdahale. Biz durduğumuzda zaman durur."}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
                                <Link
                                    href="/gonullu-ol"
                                    className="relative group overflow-hidden rounded-xl px-6 sm:px-8 py-3 sm:py-4 flex items-center justify-center bg-red-600 shadow-[0_0_20px_rgba(234,29,44,0.3)] hover:shadow-[0_0_40px_rgba(234,29,44,0.6)] transition-all"
                                >
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                    <span className="relative z-10 text-white font-black tracking-widest uppercase flex items-center gap-3 text-sm">
                                        Gönüllü Ol <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                    </span>
                                </Link>

                                <a
                                    href="#tanitim"
                                    className="px-6 sm:px-8 py-3 sm:py-4 flex items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/30 transition-all group"
                                >
                                    <Play className="w-5 h-5 text-red-500 group-hover:scale-110 group-hover:text-red-400 transition-colors" />
                                    <span className="text-white font-bold tracking-widest uppercase text-sm">Operasyonlar</span>
                                </a>
                            </div>
                        </motion.div>

                    </div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3"
                >
                    <span className="text-[10px] text-white/50 tracking-[0.3em] uppercase font-bold">Keşfet</span>
                    <div className="w-[1px] h-16 bg-white/10 relative overflow-hidden">
                        <motion.div
                            initial={{ y: "-100%" }}
                            animate={{ y: "100%" }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            className="absolute inset-0 bg-red-500"
                        />
                    </div>
                </motion.div>

            </div>

            {/* Cinematic Tanıtım Filmi */}
            <section id="tanitim" className="relative py-16 sm:py-24 md:py-32 bg-[#020617] overflow-hidden">
                {/* Subtle decorative mountain wireframe */}
                <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                    <Mountain size={800} strokeWidth={0.2} />
                </div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row gap-12 items-center">

                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="w-full md:w-1/3"
                        >
                            <h2 className="text-red-600 font-bold tracking-[0.2em] mb-4 text-sm uppercase">{aboutBadge || "Kurumsal Kimlik"}</h2>
                            <h3 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6 uppercase tracking-tighter">
                                {renderAboutTitle()}
                            </h3>
                            <p className="text-neutral-400 mb-6 leading-relaxed font-light whitespace-pre-line">
                                {aboutText || "2022 yılında insan hayatının değerini bilen, gönüllülük esasını benimsemiş, fedakar, güvenilir, doğaya ve çevreye saygılı bireylerle yola çıkmış; 2.02.2023 tarihinde dernek statüsüne ulaşmıştır.\n\nM1G Ekibi ulusal ve uluslararası alanda yaşamı tehdit eden bütün felaketlerde, enkaz altında kalmış insanlara ulaşmak için arama kurtarma operasyonları gerçekleştirmekte, ihtiyaç halinde tıbbi ve insani yardım faaliyetleri sürdürmektedir."}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                            className="w-full md:w-2/3"
                        >
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="bg-red-600/10 border border-red-500/20 px-4 py-2 rounded-lg text-red-500 font-bold text-sm tracking-widest uppercase">
                                    {aboutTag1 || "\"Asla Geride Bırakma\""}
                                </div>
                                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-neutral-300 font-bold text-sm tracking-widest uppercase">
                                    {aboutTag2 || "\"Sıfır Hata, %100 Disiplin\""}
                                </div>
                            </div>
                            <div className="relative aspect-video rounded-none md:rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(234,29,44,0.15)] border border-white/5 bg-black">
                                <iframe
                                    className="w-full h-full absolute inset-0"
                                    src={getYouTubeEmbedUrl(heroVideoUrl)}
                                    title="M1G Tanıtım Filmi"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>
        </>
    );
}
