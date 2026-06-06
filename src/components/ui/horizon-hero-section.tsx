"use client";
import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import * as THREE from 'three';

export const HorizonHeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      metrics: [{ label: "OPERASYONEL", value: "STANDART" }, { label: "MÜDAHALE", value: "GÜCÜ" }]
    },
    {
      id: "SEC-02",
      stepNumber: "02",
      title: "YANGIN MÜDAHALESİ",
      subtitle: "ALEVLERİN GÖLGESİNDE",
      desc: "Orman yangınları ve zorlu doğa koşullarındaki öncü müdahalelerimizle, yaşam alanlarımızı korumak için alevlerin gölgesinde sarsılmaz bir irade ortaya koyuyoruz.",
      metrics: [{ label: "DOĞA", value: "KORUMA" }, { label: "SARSILMAZ", value: "İRADE" }]
    },
    {
      id: "SEC-03",
      stepNumber: "03",
      title: "EĞİTİM VE DİSİPLİN",
      subtitle: "ASLA GERİDE BIRAKMA",
      desc: "'Asla geride bırakma' disipliniyle yürüttüğümüz kesintisiz saha eğitimleri ve tatbikatlar, afet anlarındaki reflekslerimizi ve ekip koordinasyonumuzu en üst seviyede tutar.",
      metrics: [{ label: "SAHA EĞİTİMİ", value: "7/24" }, { label: "REFLEKS", value: "MAKSİMUM" }]
    },
    {
      id: "SEC-04",
      stepNumber: "04",
      title: "TEKNOLOJİ VE LOJİSTİK",
      subtitle: "HIZLI VE ORGANİZE",
      desc: "Modern lojistik altyapımız, kesintisiz haberleşme sistemlerimiz ve anlık veri takibimiz sayesinde kriz bölgelerine en hızlı ve organize intikali gerçekleştiriyoruz.",
      metrics: [{ label: "HABERLEŞME", value: "KESİNTİSİZ" }, { label: "İNTİKAL", value: "HIZLI" }]
    },
    {
      id: "SEC-05",
      stepNumber: "05",
      title: "GÜVEN VE TOPLULUK",
      subtitle: "GÖNÜLLÜ ORDUMUZ",
      desc: "Profesyonel donanıma sahip gönüllü ordumuzla, her bir can için umut olmaya ve Türkiye'nin afet yönetim gücüne omuz vermeye devam edeceğiz.",
      metrics: [{ label: "AFET YÖNETİMİ", value: "TÜRKİYE" }, { label: "GÖNÜLLÜ", value: "GÜCÜ" }]
    }
  ];
  
  const totalSections = sectionsData.length; 

  const threeRefs = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    particles: THREE.Points | null;
    terrain: THREE.Mesh | null;
    radarLine: THREE.Mesh | null;
    animationId: number | null;
  }>({
    scene: null, camera: null, renderer: null, particles: null, terrain: null, radarLine: null, animationId: null
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const lat = (38.4237 + (Math.random() * 0.01 - 0.005)).toFixed(4);
      const long = (27.1428 + (Math.random() * 0.01 - 0.005)).toFixed(4);
      setCoords(`${lat}° N, ${long}° E`);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Three.js
  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return;

    const initThree = () => {
      const refs = threeRefs.current;
      refs.scene = new THREE.Scene();
      refs.scene.fog = new THREE.FogExp2(0x020617, 0.0004); // Sis azaltıldı ki uzaklar daha net görünsün

      refs.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 8000);
      refs.camera.position.z = 1000;
      refs.camera.position.y = 300;
      refs.camera.lookAt(0, 0, 0);

      refs.renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, antialias: true, alpha: false });
      refs.renderer.setClearColor(0x020617);
      refs.renderer.setSize(window.innerWidth, window.innerHeight);
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // 1. Topografik Arazi (Daha derin ve yayılan bir zemin)
      const terrainGeo = new THREE.PlaneGeometry(8000, 10000, 120, 150);
      const pos = terrainGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        let z = Math.sin(x * 0.002) * Math.cos(y * 0.002) * 250;
        z += Math.sin(x * 0.01 + y * 0.01) * 60;
        z += (Math.random() - 0.5) * 10;
        pos.setZ(i, z);
      }
      terrainGeo.computeVertexNormals();

      const terrainMat = new THREE.MeshBasicMaterial({ color: 0xea1d2c, wireframe: true, transparent: true, opacity: 0.1 });
      refs.terrain = new THREE.Mesh(terrainGeo, terrainMat);
      refs.terrain.rotation.x = -Math.PI / 2;
      refs.terrain.position.y = -200;
      refs.terrain.position.z = -2000; 
      refs.scene.add(refs.terrain);

      // 2. Radar Tarama Çizgisi
      const radarGeo = new THREE.PlaneGeometry(8000, 50);
      const radarMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending });
      refs.radarLine = new THREE.Mesh(radarGeo, radarMat);
      refs.radarLine.rotation.x = -Math.PI / 2;
      refs.radarLine.position.y = -199;
      refs.scene.add(refs.radarLine);

      // 3. Estetik Hologramlar (Kavisli Ekranlar)
      const images = [
        "/images/about/m1g-arama-kurtarma-misyon.jpg",
        "/images/about/m1g-arama-kurtarma-orman-yangini.jpg",
        "/images/about/sualti.jpeg",
        "/images/about/m1g-arama-kurtarma-lojistik.jpg",
        "/images/about/m1gekip.png"
      ];

      const textureLoader = new THREE.TextureLoader();
      images.forEach((url, i) => {
        textureLoader.load(url, (texture: THREE.Texture) => {
          // Kavisli, teknolojik hologram ekran hissi
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.7, // Şeffaf ki hologram hissi versin
            blending: THREE.AdditiveBlending, // Siyahlar silinir, aydınlıklar parlar!
            color: 0xffdddd, // Hafif kırmızımsı bir filtre
            side: THREE.DoubleSide
          });
          
          // Kavisli Ekran Geometrisi (Radius, Height, RadialSegments, HeightSegments, OpenEnded, ThetaStart, ThetaLength)
          const geometry = new THREE.CylinderGeometry(500, 500, 200, 32, 1, true, -0.25, 0.5);
          const mesh = new THREE.Mesh(geometry, material);
          
          // Kameraya çarpmaması için Z ekseninde çok daha geriye yerleştiriyoruz
          const zPos = -800 - (i * 1500); 
          
          // Alternatif X ekseni (biri solda, biri sağda asılı)
          const xPos = i % 2 === 0 ? -250 : 250;
          
          // Daha yüksekte asılı dursun, drone altından/yanından geçsin
          const yPos = 120; 
          
          mesh.position.set(xPos, yPos, zPos);
          
          // Kameraya doğru biraz eğik dursun
          mesh.rotation.y = i % 2 === 0 ? 0.3 : -0.3;
          
          refs.scene!.add(mesh);
          
          // Çerçeve Kenarları (Glow)
          const edges = new THREE.EdgesGeometry(geometry);
          const lineMat = new THREE.LineBasicMaterial({ color: 0xff0033, transparent: true, opacity: 0.8 });
          const line = new THREE.LineSegments(edges, lineMat);
          mesh.add(line);

          // Dağdan yukarı vuran "Projeksiyon Işını" (Hologram kaynağı)
          const beamGeo = new THREE.CylinderGeometry(200, 10, 400, 16, 1, true);
          const beamMat = new THREE.MeshBasicMaterial({ 
            color: 0xea1d2c, 
            transparent: true, 
            opacity: 0.05, 
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
          });
          const beam = new THREE.Mesh(beamGeo, beamMat);
          beam.position.y = -200; // Ekrandan dağa doğru iniyor
          mesh.add(beam);
        });
      });

      // 4. Yıldız / Veri Partikülleri
      const particleCount = 1500;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 6000;
        pPos[i * 3 + 1] = Math.random() * 1500 - 200;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 8000 - 2000;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending });
      refs.particles = new THREE.Points(pGeo, pMat);
      refs.scene.add(refs.particles);

      animate();
    };

    const animate = () => {
      const refs = threeRefs.current;
      refs.animationId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      if (refs.particles) refs.particles.rotation.y = time * 0.01;
      if (refs.radarLine) refs.radarLine.position.z = (time * 400) % 8000 - 4000;

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

  // Smooth Scroll & Cinematic Flight
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

      const refs = threeRefs.current;
      if (refs.camera) {
        // İleri uçuş (Drone)
        // Başlangıç 1000'den, en son -6500'e gidiyor.
        const targetZ = 1000 - (progress * 7500); 
        
        // Kamera yüksekliği: Dağa yakın uçuyor ama fotoğrafların hizasına tam çarpmıyor (altlarından / yanlarından geçiyor)
        const targetY = 80 + Math.sin(progress * Math.PI * 6) * 40;
        
        // Sağa Sola yavaş kavisler (Panoramik his)
        const targetX = Math.cos(progress * Math.PI * 4) * 150;

        refs.camera.position.z += (targetZ - refs.camera.position.z) * 0.08;
        refs.camera.position.y += (targetY - refs.camera.position.y) * 0.08;
        refs.camera.position.x += (targetX - refs.camera.position.x) * 0.05;
        
        // Kamera hafif yukarı bakıyor ki haşmetli hologramları görelim
        const targetRotX = 0.15; 
        const targetRotY = (targetX * 0.0005);
        refs.camera.rotation.x += (targetRotX - refs.camera.rotation.x) * 0.1;
        refs.camera.rotation.y += (targetRotY - refs.camera.rotation.y) * 0.1;
        
        // Drone türbülans sarsıntısı
        refs.camera.position.x += Math.sin(Date.now() * 0.003) * 0.5;
        refs.camera.position.y += Math.cos(Date.now() * 0.004) * 0.5;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSections]);

  return (
    <div ref={containerRef} style={{ height: '700vh' }} className="w-full bg-[#020617] relative">
      <div ref={stickyRef} className="sticky top-0 left-0 w-full h-screen overflow-hidden text-white font-sans bg-black">
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />
        
        {/* HUD Sistem Arayüzü */}
        <div className="absolute inset-0 z-20 pointer-events-none select-none">
          <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-red-600/30" />
          <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-red-600/30" />
          <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-red-600/30" />
          <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-red-600/30" />

          <div className="absolute top-10 left-10 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_red]" />
              <span className="text-red-500 font-mono text-[10px] tracking-widest font-bold">M1G_SYS // HOLOGRAPHIC_MODE</span>
            </div>
            <span className="text-white/40 font-mono text-[10px] tracking-wider pl-4">{coords}</span>
          </div>

          <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1">
            <span className="text-white/30 font-mono text-[10px] tracking-[0.3em]">DRONE SPD: {Math.floor(scrollProgress * 450)} KNOTS</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-6 h-1 rounded-sm ${i < (scrollProgress * 5) ? 'bg-red-600 shadow-[0_0_8px_#ea1d2c]' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Sinematik Metinler */}
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
            
            const translateZ = (scrollProgress - center) * 300;
            const scale = 1 + (opacity * 0.05);

            // Resimler sağda/soldaysa, metin ortada ama estetik dursun
            return (
              <div 
                key={i} 
                className="absolute w-full max-w-4xl flex flex-col items-center justify-center"
                style={{ 
                  opacity: opacity,
                  transform: `translateZ(${translateZ}px) scale(${scale})`,
                  transition: 'opacity 0.1s linear, transform 0.1s linear'
                }}
              >
                {/* Taktiksel Metin Kutusu (Cam Efekti / Glassmorphism) */}
                <div className="text-center bg-[#020617]/60 p-8 md:p-12 rounded-3xl backdrop-blur-md border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.8)] w-full relative overflow-hidden">
                  
                  {/* Dekoratif Işık Yansıması */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
                  
                  <div className="flex flex-col items-center mb-6">
                    <span className="text-red-500 font-mono text-xl md:text-2xl font-black mb-2 tracking-widest">{data.stepNumber}</span>
                    <h3 className="text-white/60 font-mono tracking-[0.3em] uppercase text-xs md:text-sm">
                      {data.subtitle}
                    </h3>
                  </div>

                  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-6 drop-shadow-lg">
                    {data.title}
                  </h2>
                  <p className="text-base md:text-lg font-light text-slate-300 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
                    {data.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
