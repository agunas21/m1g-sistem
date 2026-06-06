"use client";
import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const VisualHeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  
  // Koordinat simülasyonu
  const [coords, setCoords] = useState("38.4237° N, 27.1428° E");

  const sectionsData = [
    {
      id: "SEC-01",
      stepNumber: "01",
      title: "MİSYONUMUZ",
      subtitle: "M1G ARAMA KURTARMA DERNEĞİ",
      desc: "M1G Arama Kurtarma Derneği olarak, doğal afetler ve acil durumlarda en ileri operasyonel standartlarla hayata tutunan bir köprü inşa ediyoruz.",
      image: "/images/about/IMG-20230806-WA0134(1).jpg",
      metrics: [
        { label: "OPERASYONEL", value: "STANDART" },
        { label: "MÜDAHALE", value: "GÜCÜ" }
      ]
    },
    {
      id: "SEC-02",
      stepNumber: "02",
      title: "YANGIN MÜDAHALESİ",
      subtitle: "ALEVLERİN GÖLGESİNDE",
      desc: "Orman yangınları ve zorlu doğa koşullarındaki öncü müdahalelerimizle, yaşam alanlarımızı korumak için alevlerin gölgesinde sarsılmaz bir irade ortaya koyuyoruz.",
      image: "/images/about/IMG-20231130-WA0032.jpg",
      metrics: [
        { label: "DOĞA", value: "KORUMA" },
        { label: "SARSILMAZ", value: "İRADE" }
      ]
    },
    {
      id: "SEC-03",
      stepNumber: "03",
      title: "EĞİTİM VE DİSİPLİN",
      subtitle: "ASLA GERİDE BIRAKMA",
      desc: "'Asla geride bırakma' disipliniyle yürüttüğümüz kesintisiz saha eğitimleri ve tatbikatlar, afet anlarındaki reflekslerimizi ve ekip koordinasyonumuzu en üst seviyede tutar.",
      image: "/images/about/IMG-20240324-WA0019.jpg",
      metrics: [
        { label: "SAHA EĞİTİMİ", value: "7/24" },
        { label: "REFLEKS", value: "MAKSİMUM" }
      ]
    },
    {
      id: "SEC-04",
      stepNumber: "04",
      title: "TEKNOLOJİ VE LOJİSTİK",
      subtitle: "HIZLI VE ORGANİZE",
      desc: "Modern lojistik altyapımız, kesintisiz haberleşme sistemlerimiz ve anlık veri takibimiz sayesinde kriz bölgelerine en hızlı ve organize intikali gerçekleştiriyoruz.",
      image: "/images/about/IMG-20240324-WA0031.jpg",
      metrics: [
        { label: "HABERLEŞME", value: "KESİNTİSİZ" },
        { label: "İNTİKAL", value: "HIZLI" }
      ]
    },
    {
      id: "SEC-05",
      stepNumber: "05",
      title: "GÜVEN VE TOPLULUK",
      subtitle: "GÖNÜLLÜ ORDUMUZ",
      desc: "Profesyonel donanıma sahip gönüllü ordumuzla, her bir can için umut olmaya ve Türkiye'nin afet yönetim gücüne omuz vermeye devam edeceğiz.",
      image: "/images/about/IMG-20240718-WA0014.jpg",
      metrics: [
        { label: "AFET YÖNETİMİ", value: "TÜRKİYE" },
        { label: "GÖNÜLLÜ", value: "GÜCÜ" }
      ]
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

  // Sticky Kaydırma Mantığı
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
      
      const newSection = Math.floor(progress * totalSections);
      setCurrentSection(newSection >= totalSections ? totalSections - 1 : newSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSections]);

  return (
    // 500vh ile kaydırma süresini uzatıp sindire sindire akmasını sağlıyoruz
    <div ref={containerRef} style={{ height: '600vh' }} className="w-full bg-[#020617] relative">
      
      {/* Sabit (Sticky) Alan */}
      <div ref={stickyRef} className="sticky top-0 left-0 w-full h-screen overflow-hidden text-white font-sans bg-black">
        
        {/* Parallax Arkaplan Resimleri */}
        {sectionsData.map((data, i) => {
          const sectionStart = i / totalSections;
          const sectionEnd = (i + 1) / totalSections;
          const center = (sectionStart + sectionEnd) / 2;
          
          const dist = Math.abs(scrollProgress - center);
          const threshold = 1 / (totalSections * 1.2);
          
          let opacity = 1 - (dist / threshold);
          if (opacity < 0) opacity = 0;
          if (opacity > 1) opacity = 1;

          // Kaydırdıkça hafif zoom (sinematik his)
          const scale = 1 + (scrollProgress * 0.2);
          
          return (
            <motion.div
              key={`bg-${i}`}
              className="absolute inset-0 w-full h-full z-0 pointer-events-none"
              style={{
                opacity: opacity,
                backgroundImage: `url('${data.image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: `scale(${scale})`,
                transition: 'opacity 0.2s ease-out'
              }}
            >
              {/* Sinematik Karartma Katmanları */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-black/60 to-transparent"></div>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
            </motion.div>
          );
        })}
        
        {/* HUD (Heads Up Display) - Taktiksel Ekran Overlay'i */}
        <div className="absolute inset-0 z-20 pointer-events-none select-none">
          {/* Köşe Nişangahları (Brackets) */}
          <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-red-600/60" />
          <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-red-600/60" />
          <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-red-600/60" />
          <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-red-600/60" />

          {/* Sol Üst - Canlı Bağlantı ve Koordinat */}
          <div className="absolute top-10 left-10 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
              <span className="text-red-500 font-mono text-[10px] tracking-widest font-bold">M1G_SYS_UPLINK // LIVE</span>
            </div>
            <span className="text-white/80 font-mono text-[10px] tracking-wider pl-4 drop-shadow-md">{coords}</span>
          </div>

          {/* Sağ Alt - Operasyon İndikatörü */}
          <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1">
            <span className="text-white/60 font-mono text-[10px] tracking-[0.3em] drop-shadow-md">ALT: {Math.floor(scrollProgress * 1000)}M</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-6 h-1 rounded-sm ${i < (scrollProgress * 5) ? 'bg-red-600 shadow-[0_0_8px_#ea1d2c]' : 'bg-white/30'}`} />
              ))}
            </div>
          </div>
        </div>
        
        {/* İçeriklerin Kaydırmaya Göre Gösterimi */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none px-4 sm:px-8">
          {sectionsData.map((data, i) => {
            const sectionStart = i / totalSections;
            const sectionEnd = (i + 1) / totalSections;
            const center = (sectionStart + sectionEnd) / 2;
            
            const dist = Math.abs(scrollProgress - center);
            const threshold = 1 / (totalSections * 1.5);
            
            let opacity = 1 - (dist / threshold);
            if (opacity < 0) opacity = 0;
            if (opacity > 1) opacity = 1;
            
            // 3D Parallax efekti: Yazılar hafifçe öne arkaya hareket ediyor
            const translateZ = (scrollProgress - center) * 500;
            const scale = 1 + (opacity * 0.05);

            return (
              <div 
                key={`text-${i}`} 
                className="absolute w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-16"
                style={{ 
                  opacity: opacity,
                  transform: `translateZ(${translateZ}px) scale(${scale})`,
                  transition: 'opacity 0.1s linear, transform 0.1s linear'
                }}
              >
                {/* Sol/Üst Kısım: Taktiksel İkon/Kimlik */}
                <div className="flex flex-col items-center lg:items-start opacity-90 drop-shadow-2xl">
                  <span className="text-red-500 font-mono text-xs tracking-[0.4em] mb-2 font-bold">{data.id}</span>
                  <div className="w-16 h-px bg-red-600 mb-6 hidden lg:block shadow-[0_0_10px_red]" />
                  <div className="text-white/40 font-mono text-[80px] lg:text-[120px] font-black leading-none tracking-tighter select-none">
                    {data.stepNumber}
                  </div>
                </div>

                {/* Sağ/Orta Kısım: Ana Metin */}
                <div className="flex-1 text-center lg:text-left mt-[-20px] lg:mt-6 bg-black/20 p-8 rounded-2xl backdrop-blur-sm border border-white/5 shadow-2xl">
                  <h3 className="text-red-500 font-bold tracking-[0.2em] uppercase text-sm md:text-base mb-3 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                    {data.subtitle}
                  </h3>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-6 drop-shadow-lg leading-tight">
                    {data.title}
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl font-light text-slate-200 leading-relaxed max-w-2xl mx-auto lg:mx-0 border-l-4 border-red-600 pl-4 md:pl-6 drop-shadow-md">
                    {data.desc}
                  </p>

                  {/* Varsa Metrikler (WOW Faktörü) */}
                  {data.metrics && (
                    <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-6 md:gap-12 bg-black/30 p-4 rounded-xl border border-white/5">
                      {data.metrics.map((metric, idx) => (
                        <div key={idx} className="flex flex-col items-center lg:items-start">
                          <span className="text-2xl md:text-3xl font-mono font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                            {metric.value}
                          </span>
                          <span className="text-[10px] md:text-xs font-mono tracking-widest text-red-400 mt-1 uppercase font-bold">
                            {metric.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* İlerleme Çubuğu */}
        <div className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3 drop-shadow-2xl">
          <div className="w-[3px] h-48 bg-slate-900/90 rounded-full overflow-hidden relative border border-white/10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9IiMzMzMiLz48L3N2Zz4=')] opacity-30" />
            
            <div 
              className="w-full bg-red-600 rounded-full relative z-10 shadow-[0_0_15px_#ea1d2c]" 
              style={{ height: `${scrollProgress * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono tracking-widest text-white/80 mt-2 font-bold drop-shadow-md">
            {sectionsData[currentSection]?.stepNumber || `0${currentSection + 1}`}/05
          </span>
        </div>
        
        {/* Aşağı Kaydır İpucu */}
        <div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center transition-opacity duration-700 pointer-events-none drop-shadow-xl"
          style={{ opacity: scrollProgress < 0.02 ? 1 : 0 }}
        >
          <span className="text-[10px] tracking-[0.3em] font-mono uppercase text-white mb-3 animate-pulse font-bold">
            Aşağı Kaydır
          </span>
          <div className="w-px h-16 bg-gradient-to-b from-red-600 to-transparent relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-white rounded-full animate-[bounce_2s_infinite] shadow-[0_0_10px_white]" />
          </div>
        </div>

      </div>
    </div>
  );
};
