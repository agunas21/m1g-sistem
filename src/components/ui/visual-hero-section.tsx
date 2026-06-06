"use client";
import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

export const VisualHeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [coords, setCoords] = useState("38.4237° N, 27.1428° E");

  const sectionsData = [
    {
      id: "SEC-01",
      stepNumber: "01",
      title: "MİSYONUMUZ",
      subtitle: "M1G ARAMA KURTARMA DERNEĞİ",
      desc: "M1G Arama Kurtarma Derneği olarak, doğal afetler ve acil durumlarda en ileri operasyonel standartlarla hayata tutunan bir köprü inşa ediyoruz.",
      image: "/images/about/m1g-arama-kurtarma-temel-misyon-operasyon.jpg",
      metrics: [{ label: "OPERASYONEL", value: "STANDART" }, { label: "MÜDAHALE", value: "GÜCÜ" }]
    },
    {
      id: "SEC-02",
      stepNumber: "02",
      title: "YANGIN MÜDAHALESİ",
      subtitle: "ALEVLERİN GÖLGESİNDE",
      desc: "Orman yangınları ve zorlu doğa koşullarındaki öncü müdahalelerimizle, yaşam alanlarımızı korumak için alevlerin gölgesinde sarsılmaz bir irade ortaya koyuyoruz.",
      image: "/images/about/m1g-arama-kurtarma-orman-yangini-mudahale.jpg",
      metrics: [{ label: "DOĞA", value: "KORUMA" }, { label: "SARSILMAZ", value: "İRADE" }]
    },
    {
      id: "SEC-03",
      stepNumber: "03",
      title: "EĞİTİM VE DİSİPLİN",
      subtitle: "ASLA GERİDE BIRAKMA",
      desc: "'Asla geride bırakma' disipliniyle yürüttüğümüz kesintisiz saha eğitimleri ve tatbikatlar, afet anlarındaki reflekslerimizi ve ekip koordinasyonumuzu en üst seviyede tutar.",
      image: "/images/about/m1g-arama-kurtarma-saha-egitimi-tatbikat.jpg",
      metrics: [{ label: "SAHA EĞİTİMİ", value: "7/24" }, { label: "REFLEKS", value: "MAKSİMUM" }]
    },
    {
      id: "SEC-04",
      stepNumber: "04",
      title: "TEKNOLOJİ VE LOJİSTİK",
      subtitle: "HIZLI VE ORGANİZE",
      desc: "Modern lojistik altyapımız, kesintisiz haberleşme sistemlerimiz ve anlık veri takibimiz sayesinde kriz bölgelerine en hızlı ve organize intikali gerçekleştiriyoruz.",
      image: "/images/about/m1g-arama-kurtarma-teknoloji-lojistik-altyapi.jpg",
      metrics: [{ label: "HABERLEŞME", value: "KESİNTİSİZ" }, { label: "İNTİKAL", value: "HIZLI" }]
    },
    {
      id: "SEC-05",
      stepNumber: "05",
      title: "GÜVEN VE TOPLULUK",
      subtitle: "GÖNÜLLÜ ORDUMUZ",
      desc: "Profesyonel donanıma sahip gönüllü ordumuzla, her bir can için umut olmaya ve Türkiye'nin afet yönetim gücüne omuz vermeye devam edeceğiz.",
      image: "/images/about/m1g-arama-kurtarma-gonullu-ekip-guven.jpg",
      metrics: [{ label: "AFET YÖNETİMİ", value: "TÜRKİYE" }, { label: "GÖNÜLLÜ", value: "GÜCÜ" }]
    }
  ];
  
  const totalSections = sectionsData.length; 

  useEffect(() => {
    const interval = setInterval(() => {
      const lat = (38.4237 + (Math.random() * 0.01 - 0.005)).toFixed(4);
      const long = (27.1428 + (Math.random() * 0.01 - 0.005)).toFixed(4);
      setCoords(`${lat}° N, ${long}° E`);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScroll = rect.height - windowHeight;
      const currentScroll = -rect.top;
      
      let progress = currentScroll / totalScroll;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;
      
      setScrollProgress(progress);
      
      // Calculate current section correctly (0 to 4)
      let section = 0;
      if (progress > 0.1) section = 0;
      if (progress > 0.25) section = 1;
      if (progress > 0.45) section = 2;
      if (progress > 0.65) section = 3;
      if (progress > 0.85) section = 4;
      setCurrentSection(section);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSections]);

  // Framer Motion Mappings
  const panX = scrollProgress < 0.1 
    ? -200 + (scrollProgress * 10 * 200) // 0 to 0.1 -> Moves from -200vw to 0vw
    : scrollProgress <= 0.9 
      ? 0 - ((scrollProgress - 0.1) / 0.8 * 400) // 0.1 to 0.9 -> Moves from 0vw to -400vw
      : -400;

  const scaleVal = scrollProgress < 0.1 
    ? 0.2 + (scrollProgress * 10 * 0.8) // Zooms from 0.2 to 1.0
    : 1;

  // Add slight Z translation and rotation for 3D feel during panning
  const rotationY = scrollProgress < 0.1 ? 0 : Math.sin((scrollProgress - 0.1) * Math.PI * 5) * -5;
  const translateZ = scrollProgress < 0.1 ? 0 : Math.sin((scrollProgress - 0.1) * Math.PI * 5) * -100;

  return (
    <div ref={containerRef} style={{ height: '700vh' }} className="w-full bg-[#020617] relative">
      
      {/* Sabit (Sticky) Alan */}
      <div ref={stickyRef} className="sticky top-0 left-0 w-full h-screen overflow-hidden text-white font-sans bg-[#020617] perspective-[1200px]">
        
        {/* Parallax Arkaplan (Uzay/Karanlık Hissi) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black z-0" />
        
        {/* 3D Kamera ve Galeri Dünyası */}
        <motion.div 
          className="absolute inset-0 z-10 flex items-center"
          style={{
            x: `${panX}vw`,
            scale: scaleVal,
            rotateY: rotationY,
            z: translateZ,
            transformStyle: "preserve-3d"
          }}
        >
          {sectionsData.map((data, i) => {
            return (
              <div 
                key={`gallery-${i}`}
                className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                style={{ 
                  left: `${i * 100}vw`,
                  width: '100vw',
                  height: '100vh',
                }}
              >
                {/* Fotoğraf Çerçevesi (Sündürmeden Orijinal Kalitede) */}
                <div className="relative w-[90vw] md:w-[60vw] max-w-4xl h-[60vh] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 bg-black">
                  <img 
                    src={data.image} 
                    alt={data.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  {/* Fotoğrafın Üzerine Hafif Karanlık/Sinematik Katman */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute inset-0 border-[4px] border-white/5 rounded-xl pointer-events-none" />
                </div>
              </div>
            );
          })}
        </motion.div>
        
        {/* Metin İçerik Katmanı (Kamera dışında sabit durur, Fade In/Out yapar) */}
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-4 sm:px-8">
          <AnimatePresence mode="wait">
            {scrollProgress > 0.05 && (
              <motion.div 
                key={`text-${currentSection}`}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 1.05 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-end gap-8 lg:gap-16 pt-[30vh] lg:pt-[40vh]"
              >
                {/* Sol Taraf */}
                <div className="flex flex-col items-center lg:items-start opacity-90 drop-shadow-2xl">
                  <span className="text-red-500 font-mono text-xs tracking-[0.4em] mb-2 font-bold">{sectionsData[currentSection].id}</span>
                  <div className="w-16 h-px bg-red-600 mb-2 hidden lg:block shadow-[0_0_10px_red]" />
                  <div className="text-white/30 font-mono text-[60px] lg:text-[100px] font-black leading-none tracking-tighter select-none">
                    {sectionsData[currentSection].stepNumber}
                  </div>
                </div>

                {/* Sağ Taraf - İçerik Kutusu */}
                <div className="flex-1 text-center lg:text-left bg-black/60 p-6 md:p-8 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
                  <h3 className="text-red-500 font-bold tracking-[0.2em] uppercase text-sm md:text-base mb-2 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                    {sectionsData[currentSection].subtitle}
                  </h3>
                  <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-4 drop-shadow-lg leading-tight">
                    {sectionsData[currentSection].title}
                  </h2>
                  <p className="text-base md:text-lg font-light text-slate-200 leading-relaxed max-w-2xl mx-auto lg:mx-0 border-l-4 border-red-600 pl-4 drop-shadow-md">
                    {sectionsData[currentSection].desc}
                  </p>

                  {/* Metrikler */}
                  <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-6 md:gap-10">
                    {sectionsData[currentSection].metrics.map((metric, idx) => (
                      <div key={idx} className="flex flex-col items-center lg:items-start">
                        <span className="text-xl md:text-2xl font-mono font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                          {metric.value}
                        </span>
                        <span className="text-[10px] md:text-xs font-mono tracking-widest text-red-400 mt-1 uppercase font-bold">
                          {metric.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* HUD Sistem Arayüzü */}
        <div className="absolute inset-0 z-30 pointer-events-none select-none">
          {/* Köşeler */}
          <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/20" />
          <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/20" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/20" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/20" />

          {/* Sol Üst */}
          <div className="absolute top-10 left-10 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_red]" />
              <span className="text-red-500 font-mono text-[10px] tracking-widest font-bold">M1G_SYS // PANORAMA_MODE</span>
            </div>
            <span className="text-white/60 font-mono text-[10px] tracking-wider pl-4">{coords}</span>
          </div>
          
          {/* İlerleme */}
          <div className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 drop-shadow-2xl">
            <div className="w-[2px] h-32 bg-slate-800 rounded-full overflow-hidden relative">
              <div 
                className="w-full bg-red-600 rounded-full relative z-10 shadow-[0_0_10px_#ea1d2c]" 
                style={{ height: `${scrollProgress * 100}%` }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
