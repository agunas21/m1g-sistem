"use client";
import React, { useEffect, useRef, useState } from 'react';

export const HorizonHeroSection = ({ sections }: { sections?: any[] | null }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [coords, setCoords] = useState("38.4237° N, 27.1428° E");

  const sectionsData = sections || [
    {
      id: "SEC-01",
      stepNumber: "01",
      title: "MİSYONUMUZ",
      subtitle: "M1G ARAMA KURTARMA",
      desc: "Doğal afetler ve acil durumlarda en ileri operasyonel standartlarla hayata tutunan bir köprü inşa ediyoruz.",
      img: "/images/about/m1g-arama-kurtarma-misyon-enkaz.jpg"
    },
    {
      id: "SEC-02",
      stepNumber: "02",
      title: "YANGIN MÜDAHALESİ",
      subtitle: "ALEVLERİN GÖLGESİNDE",
      desc: "Orman yangınları ve zorlu doğa koşullarındaki öncü müdahalelerimizle yaşam alanlarımızı koruyoruz.",
      img: "/images/about/m1g-arama-kurtarma-yangin-mudahalesi.jpg"
    },
    {
      id: "SEC-03",
      stepNumber: "03",
      title: "EĞİTİM VE DİSİPLİN",
      subtitle: "ASLA GERİDE BIRAKMA",
      desc: "Saha eğitimleri ve tatbikatlar, afet anlarındaki reflekslerimizi ve ekip koordinasyonumuzu en üst seviyede tutar.",
      img: "/images/about/m1g-arama-kurtarma-sualti-dalis-egitimi.jpg"
    },
    {
      id: "SEC-04",
      stepNumber: "04",
      title: "LOJİSTİK VE TEKNOLOJİ",
      subtitle: "HIZLI VE ORGANİZE",
      desc: "Modern lojistik altyapımız ve kesintisiz veri takibimiz sayesinde kriz bölgelerine hızlı intikal ediyoruz.",
      img: "/images/about/m1g-arama-kurtarma-lojistik-drone.jpg"
    },
    {
      id: "SEC-05",
      stepNumber: "05",
      title: "GÜVEN VE TOPLULUK",
      subtitle: "GÖNÜLLÜ ORDUMUZ",
      desc: "Profesyonel donanıma sahip gönüllü ordumuzla Türkiye'nin afet yönetim gücüne omuz vermeye devam ediyoruz.",
      img: "/images/about/m1g-arama-kurtarma-topluluk-kamp.jpg"
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

  // Smooth Scroll Logic
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
    <div ref={containerRef} style={{ height: `${totalSections * 150}vh` }} className="w-full bg-[#01030b] relative">
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden text-white font-sans bg-[#01030b]">
        
        {/* AMBIENT GLOW EFEKTİ (Dinamik Bulanık Arka Plan) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {sectionsData.map((data, i) => {
            const sectionStart = i / totalSections;
            const sectionEnd = (i + 1) / totalSections;
            const center = (sectionStart + sectionEnd) / 2;
            const dist = Math.abs(scrollProgress - center);
            const threshold = 1 / (totalSections * 1.2);
            let opacity = 1 - (dist / threshold);
            if (opacity < 0) opacity = 0;
            if (opacity > 1) opacity = 1;

            return (
              <div 
                key={`glow-${i}`}
                className="absolute inset-0 transition-opacity duration-700 ease-out bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${data.img})`,
                  opacity: opacity * 0.4, // Parlaklığı ayarla
                  filter: 'blur(100px) saturate(200%)', // Muazzam erime efekti
                  transform: 'scale(1.1)' // Kenar taşmalarını engeller
                }}
              />
            );
          })}
        </div>

        {/* DEV LOGO WATERMARK (Arkaplan) */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.03] md:opacity-[0.06] mix-blend-overlay">
          <img 
            src="/images/m1g-logo-watermark.png" 
            alt="M1G Logo Watermark" 
            className="w-[150%] max-w-none md:w-[800px] md:max-w-[800px] object-contain grayscale blur-[1px]"
          />
        </div>
        
        {/* HUD Sistem Arayüzü */}
        <div className="absolute inset-0 z-30 pointer-events-none select-none">
          <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-white/10" />
          <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-white/10" />
          <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-white/10" />
          <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-white/10" />

          <div className="absolute top-10 left-10 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_red]" />
              <span className="text-white/70 font-mono text-[10px] tracking-widest font-bold">M1G_SYS // OPERATIONAL_DB</span>
            </div>
            <span className="text-white/40 font-mono text-[10px] tracking-wider pl-4">{coords}</span>
          </div>

          <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1">
            <span className="text-white/40 font-mono text-[10px] tracking-[0.3em]">SEC_SYNC: {Math.floor(scrollProgress * 100)}%</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-6 h-1 rounded-sm ${i <= currentSection ? 'bg-red-600 shadow-[0_0_8px_red]' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        </div>
        
        {/* SİNEMATİK HTML KATMANI (RESİMLER + METİNLER) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {sectionsData.map((data, i) => {
            const sectionStart = i / totalSections;
            const sectionEnd = (i + 1) / totalSections;
            const center = (sectionStart + sectionEnd) / 2;
            
            const dist = Math.abs(scrollProgress - center);
            const threshold = 1 / (totalSections * 1.5);
            
            let opacity = 1 - (dist / threshold);
            if (opacity < 0) opacity = 0;
            if (opacity > 1) opacity = 1;
            
            // Metinler için 3D uçuş hissi
            const translateZ = (scrollProgress - center) * 600; 

            // Resim Sağda mı Solda mı?
            const isImageLeft = i % 2 === 0;

            return (
              <div 
                key={i} 
                className="absolute inset-0 flex items-center transition-opacity duration-75"
                style={{ opacity: opacity }}
              >
                {/* 1) SİNEMATİK ARKA PLAN RESMİ (Erimiş Kenarlar) */}
                <div className="absolute inset-0 z-0">
                  <div 
                    className={`absolute top-0 bottom-0 ${isImageLeft ? 'left-0' : 'right-0'} w-full md:w-3/5 bg-cover bg-center`}
                    style={{ 
                      backgroundImage: `url(${data.img})`,
                      // Resmin içi temiz, kenarı karanlığa (ortadaki dev logoya doğru) eriyor (CSS Mask)
                      WebkitMaskImage: isImageLeft 
                        ? 'linear-gradient(to right, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)' 
                        : 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
                      maskImage: isImageLeft 
                        ? 'linear-gradient(to right, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)' 
                        : 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
                      // Çok hafif bir siyah filtre
                      boxShadow: 'inset 0 0 100px rgba(1,3,11,0.5)'
                    }}
                  />
                </div>
                
                {/* 2) ŞIK METİN KUTUSU (Uçuş Animasyonlu) */}
                <div 
                  className="absolute inset-0 z-10 flex items-center justify-center px-6 md:px-16 lg:px-24"
                  style={{ transform: `translateZ(${translateZ}px) scale(${1 + opacity * 0.02})` }}
                >
                  {/* Kutu, resmin ters tarafına yaslanır */}
                  <div className={`w-full max-w-7xl flex ${isImageLeft ? 'justify-end' : 'justify-start'}`}>
                    
                    {/* Cam Efektli Modern Kutu */}
                    <div className="text-left bg-black/60 p-8 md:p-12 rounded-2xl backdrop-blur-md border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)] w-full max-w-lg lg:max-w-xl relative overflow-hidden">
                      
                      {/* Accent Line */}
                      <div className={`absolute top-0 bottom-0 ${isImageLeft ? 'left-0' : 'right-0'} w-1 bg-gradient-to-b from-red-600 to-transparent opacity-80`} />

                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-red-500 font-mono text-2xl font-black">{data.stepNumber}</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                      </div>

                      <h3 className="text-white/50 font-mono tracking-[0.2em] uppercase text-xs mb-2">
                        {data.subtitle}
                      </h3>
                      
                      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mb-4 drop-shadow-lg">
                        {data.title}
                      </h2>
                      
                      <p className="text-base md:text-lg font-light text-slate-300 leading-relaxed drop-shadow-md">
                        {data.desc}
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
