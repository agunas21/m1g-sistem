"use client";
import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import * as THREE from 'three';
import { gsap } from 'gsap';

export const HorizonHeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  
  // HUD ve Koordinat simülasyonu için state
  const [coords, setCoords] = useState("38.4237° N, 27.1428° E"); // İzmir koordinatları

  // Yeni "WOW" İçerikleri - State
  const defaultSections = [
    {
      id: "SEC-01",
      stepNumber: "01",
      title: "KURULUŞUMUZ",
      subtitle: "BİR UMUT YOLCULUĞU",
      desc: "M1G Arama Kurtarma Derneği, 2023 yılında, afetlere karşı en zorlu koşullarda bile bir cana daha ulaşabilmek sevdasıyla, tamamen gönüllülük esasıyla kuruldu.",
      metrics: [],
      icon: "M1G-BASE"
    },
    {
      id: "SEC-02",
      stepNumber: "02",
      title: "KARARLILIK",
      subtitle: "BİLİNÇ VE EĞİTİM",
      desc: "Sadece sahada olmakla yetinmedik. Doğada, kentsel alanlarda ve su altındaki her türlü senaryoya karşı profesyonel uluslararası standartlarda eğitimlerimizi tamamladık.",
      metrics: [
        { label: "EĞİTİMLİ GÖNÜLLÜ", value: "300+" },
        { label: "BRANŞ", value: "5" }
      ],
      icon: "TRG-OP"
    },
    {
      id: "SEC-03",
      stepNumber: "03",
      title: "GÜCÜMÜZ",
      subtitle: "OPERASYONEL KAPASİTE",
      desc: "Özel donanımlı araçlarımız, sismik dinleme cihazlarımız, termal dronlarımız ve medikal müdahale kitlerimiz ile karanlığın çöktüğü her yerde ışık olmaya hazırız.",
      metrics: [
        { label: "HAZIRLIK SÜRESİ", value: "7/24" },
        { label: "MÜDAHALE EKİPMANI", value: "FULL" }
      ],
      icon: "RDY-ST"
    },
    {
      id: "SEC-04",
      stepNumber: "04",
      title: "OPERASYONLAR",
      subtitle: "SAHADA İZİMİZ VAR",
      desc: "Depremler, kayıp vakaları ve büyük doğa felaketlerinde yüzlerce arama kurtarma faaliyetine katıldık. Geri dönmeyen tek bir can kalmayana dek durmayacağız.",
      metrics: [
        { label: "GÖREV", value: "150+" },
        { label: "KURTARILAN", value: "HAYATLAR" }
      ],
      icon: "FLD-EX"
    }
  ];
  
  const [sectionsData, setSectionsData] = useState(defaultSections);
  const totalSections = sectionsData.length; 
  
  // Sistem Verileri State
  const [systemStats, setSystemStats] = useState({
    memberCount: 300,
    reportCount: 150,
    branchCount: 5
  });
  
  useEffect(() => {
    // Admin ayarlarını ve etkinlik raporlarını çek
    fetch("/api/settings/public?t=" + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.aboutSections && data.aboutSections.length > 0) {
          setSectionsData(data.aboutSections);
        }
        if (data.activityReports && Array.isArray(data.activityReports)) {
          setSystemStats(prev => ({ ...prev, reportCount: data.activityReports.length > 0 ? data.activityReports.length : 150 }));
        }
      })
      .catch(console.error);

    // Üye sayısını çek
    fetch("/api/members")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const activeMembers = data.filter((m: any) => m.status === "Aktif" || !m.status);
          setSystemStats(prev => ({ ...prev, memberCount: activeMembers.length > 0 ? activeMembers.length : 300 }));
        }
      })
      .catch(console.error);
  }, []);

  // Metrik değerlerini dinamik olarak ezme (senkronizasyon)
  const getDynamicMetricValue = (label: string, originalValue: string) => {
    const l = label.toUpperCase();
    if (l.includes("GÖNÜLLÜ") || l.includes("ÜYE")) return `${systemStats.memberCount}+`;
    if (l.includes("GÖREV") || l.includes("OPERASYON") || l.includes("FAALİYET")) return `${systemStats.reportCount}+`;
    if (l.includes("BRANŞ")) return `${systemStats.branchCount}`;
    return originalValue;
  };


  const threeRefs = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    particles: THREE.Points | null;
    terrain: THREE.Mesh | null;
    radarLine: THREE.Mesh | null;
    animationId: number | null;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    particles: null,
    terrain: null,
    radarLine: null,
    animationId: null
  });

  // Rastgele koordinat üretici (taktiksel his için)
  useEffect(() => {
    const interval = setInterval(() => {
      const lat = (38.4237 + (Math.random() * 0.01 - 0.005)).toFixed(4);
      const long = (27.1428 + (Math.random() * 0.01 - 0.005)).toFixed(4);
      setCoords(`${lat}° N, ${long}° E`);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Three.js - Arama Kurtarma Temalı (Topografik & Radar)
  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return;

    const initThree = () => {
      const refs = threeRefs.current;
      
      refs.scene = new THREE.Scene();
      // Çok koyu lacivert/siyah bir boşluk
      refs.scene.fog = new THREE.FogExp2(0x020617, 0.001);

      refs.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);
      refs.camera.position.z = 800;
      refs.camera.position.y = 200;
      refs.camera.lookAt(0, 0, 0);

      refs.renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        antialias: true,
        alpha: false
      });
      refs.renderer.setClearColor(0x020617);
      refs.renderer.setSize(window.innerWidth, window.innerHeight);
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // 1. Topografik Arazi (Wireframe Mountains)
      const terrainGeo = new THREE.PlaneGeometry(3000, 3000, 80, 80);
      const pos = terrainGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        // Dağlık ve engebeli arazi formülü
        let z = Math.sin(x * 0.003) * Math.cos(y * 0.003) * 200;
        z += Math.sin(x * 0.01 + y * 0.01) * 50;
        z += (Math.random() - 0.5) * 10;
        pos.setZ(i, z);
      }
      terrainGeo.computeVertexNormals();

      const terrainMat = new THREE.MeshBasicMaterial({
        color: 0xea1d2c, // M1G Kırmızısı
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });
      refs.terrain = new THREE.Mesh(terrainGeo, terrainMat);
      refs.terrain.rotation.x = -Math.PI / 2;
      refs.terrain.position.y = -150;
      refs.scene.add(refs.terrain);

      // 2. Radar Tarama Çizgisi (Hareketli Işık)
      const radarGeo = new THREE.PlaneGeometry(3000, 20);
      const radarMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending
      });
      refs.radarLine = new THREE.Mesh(radarGeo, radarMat);
      refs.radarLine.rotation.x = -Math.PI / 2;
      refs.radarLine.position.y = -149; // Arazinin hemen üstü
      refs.scene.add(refs.radarLine);

      // 3. Atmosferik Partiküller (Toz/Sis/Kar)
      const particleCount = 1500;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 2000;
        pPos[i * 3 + 1] = Math.random() * 1000 - 200;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 2000;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
      });
      refs.particles = new THREE.Points(pGeo, pMat);
      refs.scene.add(refs.particles);

      animate();
    };

    const animate = () => {
      const refs = threeRefs.current;
      refs.animationId = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;

      // Partikül dönüşü
      if (refs.particles) {
        refs.particles.rotation.y = time * 0.05;
        refs.particles.position.y = Math.sin(time * 0.2) * 20;
      }

      // Radar tarama efekti
      if (refs.radarLine) {
        refs.radarLine.position.z = (time * 200) % 3000 - 1500;
      }

      // Araziye yavaş bir "uçuş" hissi (scroll'dan bağımsız sürekli akış)
      if (refs.terrain) {
        // İsteğe bağlı: Arazinin texture kaydırması yapılabilir, 
        // şimdilik kamera hareketi yeterli.
      }

      if (refs.renderer && refs.scene && refs.camera) {
        refs.renderer.render(refs.scene, refs.camera);
      }
    };

    initThree();

    const handleResize = () => {
      const refs = threeRefs.current;
      if (refs.camera && refs.renderer) {
        refs.camera.aspect = window.innerWidth / window.innerHeight;
        refs.camera.updateProjectionMatrix();
        refs.renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      const refs = threeRefs.current;
      if (refs.animationId) cancelAnimationFrame(refs.animationId);
      window.removeEventListener('resize', handleResize);
      if (refs.renderer) refs.renderer.dispose();
      if (refs.scene) refs.scene.clear();
    };
  }, []);

  // Sticky Kaydırma Mantığı (Sizin sorunsuz çalışan kodunuzla aynı mantık)
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

      // Scroll'a bağlı Three.js Kamera Hareketi (Dalış ve Tarama)
      const refs = threeRefs.current;
      if (refs.camera) {
        // Yüksekten başlayıp, topografyanın içine doğru giriyor
        const targetZ = 800 - (progress * 1200);
        const targetY = 200 - (progress * 100);
        const targetRotX = -0.2 - (progress * 0.3); // Giderek ufka doğru bak

        refs.camera.position.z += (targetZ - refs.camera.position.z) * 0.1;
        refs.camera.position.y += (targetY - refs.camera.position.y) * 0.1;
        
        // Kameraya ufak bir operasyon sarsıntısı ekleyelim
        refs.camera.position.x = Math.sin(Date.now() * 0.002) * 5;
        
        // Bakış açısını yumuşakça değiştir
        refs.camera.rotation.x += (targetRotX - refs.camera.rotation.x) * 0.1;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSections]);

  // Dinamik olarak sectionsData state'inden gelecek, buradaki const silindi.

  return (
    // 500vh ile kaydırma süresini uzatıp sindire sindire akmasını sağlıyoruz
    <div ref={containerRef} style={{ height: '500vh' }} className="w-full bg-[#020617] relative">
      
      {/* Sabit (Sticky) Alan - Tüm sihir burada gerçekleşiyor */}
      <div ref={stickyRef} className="sticky top-0 left-0 w-full h-screen overflow-hidden text-white font-sans">
        
        {/* Three.js Arkaplanı */}
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />
        
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
            <span className="text-white/40 font-mono text-[10px] tracking-wider pl-4">{coords}</span>
          </div>

          {/* Sağ Alt - Operasyon İndikatörü */}
          <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1">
            <span className="text-white/30 font-mono text-[10px] tracking-[0.3em]">ALT: {Math.floor(scrollProgress * 1000)}M</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-6 h-1 rounded-sm ${i < (scrollProgress * 5) ? 'bg-red-600 shadow-[0_0_8px_#ea1d2c]' : 'bg-white/10'}`} />
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
            const scale = 1 + (opacity * 0.05); // Belirginleşirken hafif büyür

            return (
              <div 
                key={i} 
                className="absolute w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-16"
                style={{ 
                  opacity: opacity,
                  transform: `translateZ(${translateZ}px) scale(${scale})`,
                  // perspective: '1000px', // Container düzeyinde eklenebilir
                  transition: 'opacity 0.1s linear, transform 0.1s linear'
                }}
              >
                {/* Sol/Üst Kısım: Taktiksel İkon/Kimlik */}
                <div className="flex flex-col items-center lg:items-start opacity-80">
                  <span className="text-red-500 font-mono text-xs tracking-[0.4em] mb-2">{data.id}</span>
                  <div className="w-16 h-px bg-red-600/50 mb-6 hidden lg:block" />
                  <div className="text-white/20 font-mono text-[80px] lg:text-[120px] font-black leading-none tracking-tighter select-none">
                    {data.stepNumber || `0${i + 1}`}
                  </div>
                </div>

                {/* Sağ/Orta Kısım: Ana Metin */}
                <div className="flex-1 text-center lg:text-left mt-[-20px] lg:mt-6">
                  <h3 className="text-red-500 font-bold tracking-[0.2em] uppercase text-sm md:text-base mb-3 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                    {data.subtitle}
                  </h3>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white mb-6 drop-shadow-lg">
                    {data.title}
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl font-light text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 border-l-2 border-red-600/30 pl-4 md:pl-6">
                    {data.desc}
                  </p>

                  {/* Varsa Metrikler (WOW Faktörü) */}
                  {data.metrics && (
                    <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-8 md:gap-16">
                      {data.metrics.map((metric, idx) => (
                        <div key={idx} className="flex flex-col items-center lg:items-start">
                          <span className="text-4xl md:text-5xl font-mono font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                            {getDynamicMetricValue(metric.label, metric.value)}
                          </span>
                          <span className="text-xs md:text-sm font-mono tracking-widest text-red-400 mt-2 uppercase">
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

        {/* İlerleme Çubuğu (Geliştirilmiş) */}
        <div className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3">
          <div className="w-[2px] h-48 bg-slate-800/80 rounded-full overflow-hidden relative">
            {/* Arka plan tarama çizgisi */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9IiMzMzMiLz48L3N2Zz4=')] opacity-30" />
            
            <div 
              className="w-full bg-red-600 rounded-full relative z-10 shadow-[0_0_12px_#ea1d2c]" 
              style={{ height: `${scrollProgress * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono tracking-widest text-white/50 mt-2">
            {sectionsData[currentSection]?.stepNumber || `0${currentSection + 1}`}/{totalSections < 10 ? `0${totalSections}` : totalSections}
          </span>
        </div>
        
        {/* Aşağı Kaydır İpucu */}
        <div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center transition-opacity duration-700 pointer-events-none"
          style={{ opacity: scrollProgress < 0.02 ? 1 : 0 }}
        >
          <span className="text-[10px] tracking-[0.3em] font-mono uppercase text-white/60 mb-3 animate-pulse">
            Sistemi Başlat
          </span>
          <div className="w-px h-16 bg-gradient-to-b from-red-600 to-transparent relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-white rounded-full animate-[bounce_2s_infinite]" />
          </div>
        </div>

      </div>
    </div>
  );
};
