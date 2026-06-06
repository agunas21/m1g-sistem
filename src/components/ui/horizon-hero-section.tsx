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
  
  // Koordinat simülasyonu
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

  // Initialize Three.js - Drone Flight & Hologram Photos
  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return;

    const initThree = () => {
      const refs = threeRefs.current;
      refs.scene = new THREE.Scene();
      refs.scene.fog = new THREE.FogExp2(0x020617, 0.0006); // Daha derin görüş mesafesi

      refs.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
      refs.camera.position.z = 800;
      refs.camera.position.y = 200;
      refs.camera.lookAt(0, 0, 0);

      refs.renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, antialias: true, alpha: false });
      refs.renderer.setClearColor(0x020617);
      refs.renderer.setSize(window.innerWidth, window.innerHeight);
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // 1. Topografik Arazi (Uzun Z Eksenli)
      const terrainGeo = new THREE.PlaneGeometry(6000, 8000, 100, 150);
      const pos = terrainGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        let z = Math.sin(x * 0.003) * Math.cos(y * 0.003) * 200;
        z += Math.sin(x * 0.01 + y * 0.01) * 50;
        z += (Math.random() - 0.5) * 10;
        pos.setZ(i, z);
      }
      terrainGeo.computeVertexNormals();

      const terrainMat = new THREE.MeshBasicMaterial({ color: 0xea1d2c, wireframe: true, transparent: true, opacity: 0.15 });
      refs.terrain = new THREE.Mesh(terrainGeo, terrainMat);
      refs.terrain.rotation.x = -Math.PI / 2;
      refs.terrain.position.y = -150;
      refs.terrain.position.z = -1500; // Dağı ileriye doğru uzat
      refs.scene.add(refs.terrain);

      // 2. Radar Tarama Çizgisi
      const radarGeo = new THREE.PlaneGeometry(6000, 40);
      const radarMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending });
      refs.radarLine = new THREE.Mesh(radarGeo, radarMat);
      refs.radarLine.rotation.x = -Math.PI / 2;
      refs.radarLine.position.y = -149;
      refs.scene.add(refs.radarLine);

      // 3. 3D Fotoğraf Hologramları (Bayraklar)
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
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide
          });
          
          // 16:9 Oranında Devasa Tablolar
          const geometry = new THREE.PlaneGeometry(320, 180);
          const mesh = new THREE.Mesh(geometry, material);
          
          // Z'de geriye doğru dizilim: Drone'un uçuş rotasında.
          const zPos = 500 - (i * 1200); 
          
          // X ekseninde sağa-sola yerleştirme
          const xPos = i % 2 === 0 ? -280 : 280;
          
          // Y ekseninde (dağın üzerinde)
          const yPos = 50; 
          
          mesh.position.set(xPos, yPos, zPos);
          // Hafifçe merkeze (kameraya) dönük dursun
          mesh.rotation.y = i % 2 === 0 ? 0.2 : -0.2;
          
          refs.scene!.add(mesh);
          
          // Kırmızı Çerçeve
          const edges = new THREE.EdgesGeometry(geometry);
          const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xea1d2c, linewidth: 2 }));
          mesh.add(line);

          // Altında dikme (direk) hissi vermek için ince bir çizgi (Bayrak direği)
          const poleGeo = new THREE.CylinderGeometry(2, 2, 200, 8);
          const poleMat = new THREE.MeshBasicMaterial({ color: 0xea1d2c, wireframe: true, transparent: true, opacity: 0.5 });
          const pole = new THREE.Mesh(poleGeo, poleMat);
          pole.position.y = -100;
          mesh.add(pole);
        });
      });

      // 4. Partiküller
      const particleCount = 2000;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 4000;
        pPos[i * 3 + 1] = Math.random() * 1000 - 200;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 6000 - 1500;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
      refs.particles = new THREE.Points(pGeo, pMat);
      refs.scene.add(refs.particles);

      animate();
    };

    const animate = () => {
      const refs = threeRefs.current;
      refs.animationId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      if (refs.particles) {
        refs.particles.rotation.y = time * 0.02;
      }

      if (refs.radarLine) {
        refs.radarLine.position.z = (time * 400) % 6000 - 3000;
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

  // Sticky Kaydırma Mantığı ve Kamera Uçuşu
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

      // Scroll'a bağlı Drone Kamera Hareketi (İleri Uçuş)
      const refs = threeRefs.current;
      if (refs.camera) {
        // Z Ekseninde uçuş: 800'den başlayıp -4000'e kadar gitsin.
        const targetZ = 800 - (progress * 5000); 
        
        // Y ekseni (yükseklik): Başlangıçta yüksekte, aralarda hafif inip kalksın
        // Drone'un süzülme hissi
        const targetY = 150 + Math.sin(progress * Math.PI * 4) * 30;
        
        // X ekseni (sağ-sol): Hedef tabloya (bayrağa) doğru hafif kavis yapsın
        // i=0 (-280), i=1 (+280), i=2 (-280)...
        const currentZone = progress * totalSections;
        let targetX = 0;
        
        if (currentZone < 1) targetX = -100; // İlk tabloya (sola) hafif yaklaş
        else if (currentZone < 2) targetX = 100; // Sağa yaklaş
        else if (currentZone < 3) targetX = -100;
        else if (currentZone < 4) targetX = 100;
        else targetX = -100;

        // Smooth geçiş (Lerp)
        refs.camera.position.z += (targetZ - refs.camera.position.z) * 0.1;
        refs.camera.position.y += (targetY - refs.camera.position.y) * 0.1;
        refs.camera.position.x += (targetX - refs.camera.position.x) * 0.05;
        
        // Kamera hafifçe tabloya baksın
        const targetRotY = (targetX * 0.001);
        refs.camera.rotation.y += (targetRotY - refs.camera.rotation.y) * 0.1;
        
        // Kamera sarsıntısı (türbülans)
        refs.camera.position.x += Math.sin(Date.now() * 0.005) * 0.5;
        refs.camera.position.y += Math.cos(Date.now() * 0.003) * 0.5;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSections]);

  return (
    // 600vh ile uçuş süresini uzatıyoruz
    <div ref={containerRef} style={{ height: '700vh' }} className="w-full bg-[#020617] relative">
      
      {/* Sabit (Sticky) Alan */}
      <div ref={stickyRef} className="sticky top-0 left-0 w-full h-screen overflow-hidden text-white font-sans bg-black">
        
        {/* Three.js Arkaplanı */}
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />
        
        {/* HUD (Heads Up Display) */}
        <div className="absolute inset-0 z-20 pointer-events-none select-none">
          <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-red-600/60" />
          <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-red-600/60" />
          <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-red-600/60" />
          <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-red-600/60" />

          <div className="absolute top-10 left-10 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
              <span className="text-red-500 font-mono text-[10px] tracking-widest font-bold">M1G_SYS // DRONE_MODE_ACTIVE</span>
            </div>
            <span className="text-white/40 font-mono text-[10px] tracking-wider pl-4">{coords}</span>
          </div>

          <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1">
            <span className="text-white/30 font-mono text-[10px] tracking-[0.3em]">SPD: {Math.floor(scrollProgress * 250)} KNOTS</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-6 h-1 rounded-sm ${i < (scrollProgress * 5) ? 'bg-red-600 shadow-[0_0_8px_#ea1d2c]' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Yazıların Ekranda Belirmesi */}
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
            
            const translateZ = (scrollProgress - center) * 500;
            const scale = 1 + (opacity * 0.05);

            // Yazıları resmin Zıt yönüne yerleştirelim ki drone fotoğrafın yanından geçerken yazı öbür tarafta kalsın
            // Resimler (i%2==0) soldaydı, o zaman yazı sağda çıksın.
            const isImageLeft = i % 2 === 0;

            return (
              <div 
                key={i} 
                className={`absolute w-full max-w-5xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${isImageLeft ? 'lg:justify-end' : 'lg:justify-start'}`}
                style={{ 
                  opacity: opacity,
                  transform: `translateZ(${translateZ}px) scale(${scale})`,
                  transition: 'opacity 0.1s linear, transform 0.1s linear'
                }}
              >
                {/* Ana Metin Kutusu (Sadeleştirilmiş Taktiksel Görünüm) */}
                <div className="text-center lg:text-left mt-[-20px] lg:mt-6 bg-black/40 p-6 md:p-8 rounded-2xl backdrop-blur-md border border-red-600/30 shadow-[0_0_30px_rgba(234,29,44,0.1)] w-full max-w-xl">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-red-500 font-mono text-2xl md:text-3xl font-black">{data.stepNumber}</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-red-600 to-transparent" />
                  </div>

                  <h3 className="text-red-500 font-bold tracking-[0.2em] uppercase text-sm md:text-base mb-2">
                    {data.subtitle}
                  </h3>
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-4">
                    {data.title}
                  </h2>
                  <p className="text-sm md:text-base font-light text-slate-300 leading-relaxed border-l-2 border-red-600/50 pl-4">
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
