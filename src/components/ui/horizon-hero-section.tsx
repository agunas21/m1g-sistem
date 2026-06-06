"use client";
import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import * as THREE from 'three';

const themes = [
  { terrain: 0xea1d2c, beam: 0xea1d2c, pColor: 0xffffff, pSpeed: 1, yWave: 250 }, // 0: Misyon (Kırmızı - Standart)
  { terrain: 0xff4500, beam: 0xff2200, pColor: 0xffaa00, pSpeed: 3, yWave: 350 }, // 1: Yangın (Turuncu - Alevli ve Hızlı)
  { terrain: 0x0066ff, beam: 0x00aaff, pColor: 0x00ffff, pSpeed: 0.5, yWave: 150 }, // 2: Dalış/Eğitim (Mavi - Dalgalı ve Sakin)
  { terrain: 0x00ff44, beam: 0x00ff88, pColor: 0xaaffaa, pSpeed: 5, yWave: 100 }, // 3: Lojistik (Yeşil - Matrix hızlı)
  { terrain: 0xffcc00, beam: 0xffaa00, pColor: 0xffffee, pSpeed: 0.8, yWave: 200 }  // 4: Ekip/Kamp (Altın - Huzurlu)
];

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
      subtitle: "M1G ARAMA KURTARMA",
      desc: "Doğal afetler ve acil durumlarda en ileri operasyonel standartlarla hayata tutunan bir köprü inşa ediyoruz."
    },
    {
      id: "SEC-02",
      stepNumber: "02",
      title: "YANGIN MÜDAHALESİ",
      subtitle: "ALEVLERİN GÖLGESİNDE",
      desc: "Orman yangınları ve zorlu doğa koşullarındaki öncü müdahalelerimizle yaşam alanlarımızı koruyoruz."
    },
    {
      id: "SEC-03",
      stepNumber: "03",
      title: "EĞİTİM VE DİSİPLİN",
      subtitle: "ASLA GERİDE BIRAKMA",
      desc: "Saha eğitimleri ve tatbikatlar, afet anlarındaki reflekslerimizi ve ekip koordinasyonumuzu en üst seviyede tutar."
    },
    {
      id: "SEC-04",
      stepNumber: "04",
      title: "LOJİSTİK VE TEKNOLOJİ",
      subtitle: "HIZLI VE ORGANİZE",
      desc: "Modern lojistik altyapımız ve kesintisiz veri takibimiz sayesinde kriz bölgelerine hızlı intikal ediyoruz."
    },
    {
      id: "SEC-05",
      stepNumber: "05",
      title: "GÜVEN VE TOPLULUK",
      subtitle: "GÖNÜLLÜ ORDUMUZ",
      desc: "Profesyonel donanıma sahip gönüllü ordumuzla Türkiye'nin afet yönetim gücüne omuz vermeye devam ediyoruz."
    }
  ];
  
  const totalSections = sectionsData.length; 

  const threeRefs = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    particles: THREE.Points | null;
    terrain: THREE.Mesh | null;
    terrainMat: THREE.MeshBasicMaterial | null;
    particlesMat: THREE.PointsMaterial | null;
    beamsMats: THREE.MeshBasicMaterial[];
    framesMats: THREE.LineBasicMaterial[];
    animationId: number | null;
    progress: number;
    clock: THREE.Clock;
    terrainGeo: THREE.PlaneGeometry | null;
  }>({
    scene: null, camera: null, renderer: null, particles: null, terrain: null, 
    terrainMat: null, particlesMat: null, beamsMats: [], framesMats: [],
    animationId: null, progress: 0, clock: new THREE.Clock(), terrainGeo: null
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
      refs.scene.fog = new THREE.FogExp2(0x01030b, 0.0004); 

      refs.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 8000);
      refs.camera.position.z = 1000;
      refs.camera.position.y = 300;
      refs.camera.lookAt(0, 0, 0);

      refs.renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, antialias: true, alpha: false });
      refs.renderer.setClearColor(0x01030b);
      refs.renderer.setSize(window.innerWidth, window.innerHeight);
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // 1. Dinamik Topografik Arazi
      refs.terrainGeo = new THREE.PlaneGeometry(8000, 10000, 120, 150);
      refs.terrainMat = new THREE.MeshBasicMaterial({ color: 0xea1d2c, wireframe: true, transparent: true, opacity: 0.15 });
      refs.terrain = new THREE.Mesh(refs.terrainGeo, refs.terrainMat);
      refs.terrain.rotation.x = -Math.PI / 2;
      refs.terrain.position.y = -200;
      refs.terrain.position.z = -2000; 
      refs.scene.add(refs.terrain);

      // 2. Hologram Resimler (Kavisli)
      const images = [
        "/images/about/m1g-arama-kurtarma-misyon-enkaz.jpg",
        "/images/about/m1g-arama-kurtarma-yangin-mudahalesi.jpg",
        "/images/about/m1g-arama-kurtarma-sualti-dalis-egitimi.jpg",
        "/images/about/m1g-arama-kurtarma-lojistik-drone.jpg",
        "/images/about/m1g-arama-kurtarma-topluluk-kamp.jpg"
      ];

      const textureLoader = new THREE.TextureLoader();
      images.forEach((url, i) => {
        textureLoader.load(url, (texture: THREE.Texture) => {
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.75, 
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
          });
          
          const geometry = new THREE.CylinderGeometry(400, 400, 160, 32, 1, true, -0.3, 0.6);
          const mesh = new THREE.Mesh(geometry, material);
          
          const zPos = -500 - (i * 1500); 
          const xPos = i % 2 === 0 ? -300 : 300;
          const yPos = 100; 
          
          mesh.position.set(xPos, yPos, zPos);
          mesh.rotation.y = i % 2 === 0 ? 0.4 : -0.4;
          refs.scene!.add(mesh);
          
          const edges = new THREE.EdgesGeometry(geometry);
          const lineMat = new THREE.LineBasicMaterial({ color: 0xff0033, transparent: true, opacity: 0.6 });
          const line = new THREE.LineSegments(edges, lineMat);
          mesh.add(line);
          refs.framesMats.push(lineMat);

          const beamGeo = new THREE.CylinderGeometry(200, 10, 400, 16, 1, true);
          const beamMat = new THREE.MeshBasicMaterial({ 
            color: 0xea1d2c, 
            transparent: true, 
            opacity: 0.05, 
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
          });
          const beam = new THREE.Mesh(beamGeo, beamMat);
          beam.position.y = -200; 
          mesh.add(beam);
          refs.beamsMats.push(beamMat);
        });
      });

      // 3. Tematik Partiküller
      const particleCount = 2000;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 6000;
        pPos[i * 3 + 1] = Math.random() * 2000 - 500;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 8000 - 2000;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      refs.particlesMat = new THREE.PointsMaterial({ color: 0xffffff, size: 3, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
      refs.particles = new THREE.Points(pGeo, refs.particlesMat);
      refs.scene.add(refs.particles);

      animate();
    };

    const animate = () => {
      const refs = threeRefs.current;
      refs.animationId = requestAnimationFrame(animate);
      const delta = refs.clock.getDelta();
      const time = refs.clock.getElapsedTime();

      // DİNAMİK TEMA İNTERPOLASYONU
      const themeProgress = refs.progress * (totalSections - 1);
      const sectionIdx = Math.floor(themeProgress);
      const nextSectionIdx = Math.min(sectionIdx + 1, totalSections - 1);
      const lerpFactor = themeProgress - sectionIdx;

      const currentTheme = themes[sectionIdx];
      const nextTheme = themes[nextSectionIdx];

      const cTerrain = new THREE.Color(currentTheme.terrain).lerp(new THREE.Color(nextTheme.terrain), lerpFactor);
      const cBeam = new THREE.Color(currentTheme.beam).lerp(new THREE.Color(nextTheme.beam), lerpFactor);
      const cParticle = new THREE.Color(currentTheme.pColor).lerp(new THREE.Color(nextTheme.pColor), lerpFactor);
      const pSpeed = currentTheme.pSpeed + (nextTheme.pSpeed - currentTheme.pSpeed) * lerpFactor;
      const yWaveAmp = currentTheme.yWave + (nextTheme.yWave - currentTheme.yWave) * lerpFactor;

      if (refs.terrainMat) refs.terrainMat.color.copy(cTerrain);
      if (refs.particlesMat) refs.particlesMat.color.copy(cParticle);
      refs.beamsMats.forEach(mat => mat.color.copy(cBeam));
      refs.framesMats.forEach(mat => mat.color.copy(cBeam));

      // Dağ Dalgası Dinamik Hız/Genlik
      if (refs.terrainGeo) {
        const pos = refs.terrainGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          // Hız ve dalga boyutları temaya göre değişiyor
          let z = Math.sin(x * 0.002 + time * pSpeed * 0.5) * Math.cos(y * 0.002 + time * pSpeed * 0.5) * yWaveAmp;
          z += Math.sin(x * 0.01 + y * 0.01) * 60;
          pos.setZ(i, z);
        }
        refs.terrainGeo.attributes.position.needsUpdate = true;
      }

      // Partikül Dinamik Hareketi (Örn: Yangında yukarı uçar)
      if (refs.particles) {
         // Partiküller time'a göre rotation veya pozisyonla hareket edebilir
         refs.particles.rotation.y = time * 0.01 * pSpeed;
         if(currentTheme.pSpeed > 2) {
            refs.particles.position.y = (time * 100 * pSpeed) % 1000;
         } else {
            refs.particles.position.y = Math.sin(time) * 50;
         }
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
      threeRefs.current.progress = progress; // Update ref for animation loop
      
      const newSection = Math.floor(progress * totalSections);
      setCurrentSection(newSection >= totalSections ? totalSections - 1 : newSection);

      const refs = threeRefs.current;
      if (refs.camera) {
        // İleri uçuş (Drone)
        const targetZ = 1000 - (progress * 7500); 
        
        // Kamera yüksekliği
        const targetY = 120 + Math.sin(progress * Math.PI * 6) * 40;
        
        // Sağa Sola yavaş kavisler
        const targetX = Math.cos(progress * Math.PI * 4) * 150;

        refs.camera.position.z += (targetZ - refs.camera.position.z) * 0.08;
        refs.camera.position.y += (targetY - refs.camera.position.y) * 0.08;
        refs.camera.position.x += (targetX - refs.camera.position.x) * 0.05;
        
        const targetRotX = 0.1; 
        const targetRotY = (targetX * 0.0005);
        refs.camera.rotation.x += (targetRotX - refs.camera.rotation.x) * 0.1;
        refs.camera.rotation.y += (targetRotY - refs.camera.rotation.y) * 0.1;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSections]);

  return (
    <div ref={containerRef} style={{ height: '700vh' }} className="w-full bg-[#01030b] relative">
      <div ref={stickyRef} className="sticky top-0 left-0 w-full h-screen overflow-hidden text-white font-sans bg-black">
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />
        
        {/* HUD Sistem Arayüzü */}
        <div className="absolute inset-0 z-20 pointer-events-none select-none">
          <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-white/20" />
          <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-white/20" />
          <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-white/20" />
          <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-white/20" />

          <div className="absolute top-10 left-10 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-white/70 rounded-full animate-pulse shadow-[0_0_10px_white]" />
              <span className="text-white/70 font-mono text-[10px] tracking-widest font-bold">M1G_SYS // DYNAMIC_ENV</span>
            </div>
            <span className="text-white/40 font-mono text-[10px] tracking-wider pl-4">{coords}</span>
          </div>

          <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1">
            <span className="text-white/40 font-mono text-[10px] tracking-[0.3em]">DRONE SPD: {Math.floor(scrollProgress * 450)} KNOTS</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-6 h-1 rounded-sm ${i <= currentSection ? 'bg-white/70 shadow-[0_0_8px_white]' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Sinematik Metinler */}
        <div className="absolute inset-0 z-10 flex items-end justify-center pb-24 pointer-events-none px-4 sm:px-8">
          {sectionsData.map((data, i) => {
            const sectionStart = i / totalSections;
            const sectionEnd = (i + 1) / totalSections;
            const center = (sectionStart + sectionEnd) / 2;
            
            const dist = Math.abs(scrollProgress - center);
            const threshold = 1 / (totalSections * 1.5);
            
            let opacity = 1 - (dist / threshold);
            if (opacity < 0) opacity = 0;
            if (opacity > 1) opacity = 1;
            
            const translateZ = (scrollProgress - center) * 150; // Daha sakin hareket
            const scale = 1 + (opacity * 0.02);

            // Yazı kutusu boyutunu küçült (max-w-2xl) ve ekranın daha altına hizala (pb-24 ile parent'tan yapıldı)
            return (
              <div 
                key={i} 
                className="absolute w-full max-w-2xl flex flex-col items-center justify-center"
                style={{ 
                  opacity: opacity,
                  transform: `translateY(${-translateZ}px) scale(${scale})`, // Z yerine Y'de hafif kaysın
                  transition: 'opacity 0.1s linear, transform 0.1s linear'
                }}
              >
                {/* Taktiksel Metin Kutusu (Cam Efekti / Glassmorphism) */}
                <div className="text-center bg-[#01030b]/70 p-6 md:p-8 rounded-2xl backdrop-blur-md border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.8)] w-full relative overflow-hidden">
                  
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50" />
                  
                  <div className="flex flex-col items-center mb-4">
                    <span className="text-white/80 font-mono text-lg md:text-xl font-black mb-1 tracking-widest">{data.stepNumber}</span>
                    <h3 className="text-white/50 font-mono tracking-[0.2em] uppercase text-[10px] md:text-xs">
                      {data.subtitle}
                    </h3>
                  </div>

                  <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white mb-3 drop-shadow-md">
                    {data.title}
                  </h2>
                  <p className="text-sm md:text-base font-light text-slate-300 leading-relaxed mx-auto">
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
