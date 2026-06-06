export const dynamic = "force-dynamic";
export const revalidate = 0;

import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import AnnouncementSlider from "@/components/home/AnnouncementSlider";
import { ArrowRight, HeartHandshake, AlertTriangle, Radio, Mountain } from "lucide-react";
import Link from "next/link";
import * as motion from "framer-motion/client";
import SeismicTracker from "@/components/home/SeismicTracker";
import GlobalDisasterIntel from "@/components/home/GlobalDisasterIntel";
import { GlowCard } from "@/components/ui/spotlight-card";
import { CircularGallery } from "@/components/ui/circular-gallery";
import { SparklesCore } from "@/components/ui/sparkles";
import { prisma } from "@/lib/prisma";
import { getSiteSettingsDB, getSiteImagesDB } from "@/lib/settings";

async function getSiteSettings() {
  const settings = await getSiteSettingsDB();
  const images = await getSiteImagesDB();
  return {
    ...settings,
    siteLogo: images.siteLogo || '',
    heroImages: images.heroImages || [],
    sponsors: (images.sponsors && images.sponsors.length > 0) ? images.sponsors : (settings.sponsors || []),
  };
}


async function getLiveEarthquakes() {
  try {
    const res = await fetch("https://api.orhanaydogdu.com.tr/deprem/kandilli/live", {
      next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.result ? data.result.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const boardRoles = ["Yönetim Kurulu Başkanı", "Başkan Yardımcısı", "Genel Sekreter", "Sayman", "Yönetim Kurulu Üyesi"];

  // Perform parallel fetching for faster load times
  const [earthquakes, s, boardMembers] = await Promise.all([
    getLiveEarthquakes(),
    getSiteSettings(),
    prisma.member.findMany({
      where: { 
        OR: [
          { role: { in: boardRoles } },
          { memberType: { in: boardRoles } }
        ],
        isSuperAdmin: false,
        status: { notIn: ["Pasif", "Banlı"] }
      }
    })
  ]);

  // Sıralama
  boardMembers.sort((a, b) => {
    const roleA = a.role || a.memberType;
    const roleB = b.role || b.memberType;
    return boardRoles.indexOf(roleA as string) - boardRoles.indexOf(roleB as string);
  });

  return (
    <div className="w-full bg-[#020617] relative">
      {/* Global Fixed Sparkles Background */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-[1]">
          <SparklesCore
              id="tsparticles-global-red"
              background="transparent"
              minSize={0.6}
              maxSize={2}
              particleDensity={30}
              className="w-full h-full absolute inset-0"
              particleColor="#dc2626"
              speed={1.5}
          />
          <SparklesCore
              id="tsparticles-global-white"
              background="transparent"
              minSize={0.4}
              maxSize={1.5}
              particleDensity={20}
              className="w-full h-full absolute inset-0"
              particleColor="#ffffff"
              speed={1}
          />
      </div>

      <div className="relative z-10">
        <HeroSection 
          title={s.heroTitle} 
          subtitle={s.heroSubtitle} 
          heroBg={s.heroBg} 
          heroImages={s.heroImages} 
          heroBadge={s.heroBadge}
          heroDesc={s.heroDesc}
          aboutText={s.aboutText}
          aboutBadge={s.aboutBadge}
          aboutTitle={s.aboutTitle}
          aboutTag1={s.aboutTag1}
          aboutTag2={s.aboutTag2}
          heroVideoUrl={s.heroVideoUrl}
        />

      {/* Rakamlarla M1G — Dinamik İstatistikler */}
      <StatsSection />



      {/* Son Haberler & Duyurular */}
      <AnnouncementSlider />

      <GlobalDisasterIntel />

      {/* Sismik İzleme */}
      <section className="py-20 relative bg-transparent border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-10 text-center">
            <span className="text-blue-500 font-bold tracking-[0.2em] uppercase text-xs mb-2 flex items-center justify-center gap-2">
              <Radio size={14} className="animate-pulse" /> Sismik İzleme Merkezi
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
              AFAD & Kandilli <span className="text-neutral-600">Canlı İzleme</span>
            </h2>
          </div>
          <SeismicTracker initialData={earthquakes} />
        </div>
      </section>

      {/* Faaliyetler — CMS'den */}
      <section className="py-16 sm:py-24 md:py-32 relative bg-black/20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}
            className="text-center mb-16"
          >
            <span className="text-red-500 font-bold tracking-[0.3em] uppercase text-xs mb-3 block">
              {s.activitiesBadge || "Uzmanlık Alanlarımız"}
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6">
              {s.activitiesTitle ? (
                s.activitiesTitle.endsWith("lerimiz") ? (
                  <>
                    {s.activitiesTitle.replace("lerimiz", "")}
                    <span className="text-neutral-600">lerimiz</span>
                  </>
                ) : s.activitiesTitle.includes(" ") ? (
                  <>
                    {s.activitiesTitle.split(" ").slice(0, -1).join(" ")}{" "}
                    <span className="text-neutral-600">{s.activitiesTitle.split(" ").slice(-1)[0]}</span>
                  </>
                ) : (
                  s.activitiesTitle
                )
              ) : (
                <>
                  Faaliyet<span className="text-neutral-600">lerimiz</span>
                </>
              )}
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(s.activities && s.activities.length > 0 ? s.activities : [
              { id: 1, title: "Arama Kurtarma", desc: "Afet ve acil durumlarda profesyonel teçhizat ve eğitimli personelle 7/24 sahada hayat kurtarma operasyonları." },
              { id: 2, title: "Sosyal Sorumluluk", desc: "Toplumsal dayanışma kampanyaları ile ihtiyaç sahiplerine umut ışığı olmaya devam ediyoruz." },
              { id: 3, title: "Ekoloji Faaliyetleri", desc: "Doğayı koruma, ağaçlandırma ve çevre temizliği bilincini artırma projeleri." },
              { id: 4, title: "M1G Eğitimleri", desc: "Arama kurtarma personeli yetiştirmek için uluslararası standartlarda teorik ve pratik eğitimler." },
              { id: 5, title: "İnsani Yardım", desc: "Afet bölgelerinde ve kriz anlarında tıbbi, barınma ve gıda yardımı temini." },
              { id: 6, title: "Depremle Birlikte Yaşam", desc: "Halkı bilinçlendirme seminerleri ile deprem öncesi, anı ve sonrasında yapılması gerekenler." },
            ]).map((item: any, i: number) => (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: i * 0.1 }}
                className="h-full"
              >
                <GlowCard customSize glowColor="red" className="h-full bg-[#020617] !border-white/5 p-8 group hover:!border-red-500/50 transition-colors duration-500 !aspect-auto flex flex-col justify-start">
                  <div className="mb-6 bg-white/5 w-16 h-16 z-10 relative rounded-lg flex items-center justify-center border border-white/10 group-hover:bg-red-600/10 transition-colors">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider mb-3 z-10 relative">{item.title}</h3>
                  <p className="text-neutral-400 text-sm font-light leading-relaxed z-10 relative">{item.desc}</p>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Yönetim Kurulu — CMS'den */}
      <section className="py-16 sm:py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}
            className="text-center mb-24 flex flex-col items-center"
          >
            <span className="text-red-500 font-bold tracking-[0.3em] uppercase text-xs mb-3">Liderlik</span>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6">
              Yönetim <span className="text-neutral-600">Kurulu</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mb-6"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {boardMembers.map((member: any, i: number) => (
              <motion.div
                key={member.id || i}
                initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, delay: i * 0.2 }}
                className="h-full"
              >
                <GlowCard customSize glowColor="red" className="h-full bg-[#050B14] !border-white/5 p-4 group hover:!border-red-500/50 transition-colors duration-500 !aspect-auto">
                  <div className="relative h-80 mb-6 overflow-hidden bg-neutral-900 border border-white/10 z-10">
                    <div className="absolute inset-0 bg-red-600 mix-blend-color opacity-0 group-hover:opacity-40 transition-opacity duration-700 z-10"></div>
                    {member.avatar ? (
                      <img
                        src={member.avatar} alt={member.fullName}
                        className="w-full h-full object-cover filter grayscale opacity-70 group-hover:scale-110 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                        <span className="text-7xl font-black text-white/10">{member.fullName?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2 z-10 relative">{member.fullName}</h3>
                  <p className="text-red-500 text-xs font-bold tracking-[0.2em] uppercase mb-4 z-10 relative">{member.role || member.memberType}</p>
                  <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent mb-4 z-10 relative"></div>
                  <p className="text-neutral-400 text-sm font-light leading-relaxed z-10 relative">
                      {member.profession ? `${member.profession}` : "M1G Arama Kurtarma Derneği Yönetim Kurulu"}
                  </p>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Destekçiler — CMS'den */}
      <section className="py-24 relative bg-transparent border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-red-500 font-bold tracking-[0.3em] uppercase text-xs mb-3 block">
            {s.sponsorsBadge || "Gücümüze Güç Katanlar"}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-16">
            {s.sponsorsTitle ? (
              s.sponsorsTitle.includes(" ") ? (
                <>
                  {s.sponsorsTitle.split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="text-neutral-600">{s.sponsorsTitle.split(" ").slice(-1)[0]}</span>
                </>
              ) : (
                s.sponsorsTitle
              )
            ) : (
              <>
                Destek <span className="text-neutral-600">Verenler</span>
              </>
            )}
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {s.sponsors && s.sponsors.length > 0 ? (
              s.sponsors.map((sponsor: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="w-32 h-32 md:w-40 md:h-40 bg-zinc-900 rounded-2xl flex items-center justify-center p-4 shadow-xl border border-white/5 group hover:bg-black hover:border-red-600/30 transition-all duration-500 relative overflow-hidden"
                  title={sponsor.name + " - " + sponsor.role}
                >
                  <img
                    src={sponsor.logo || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=300"}
                    alt={sponsor.name}
                    className="w-full h-full object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 relative z-10"
                  />
                  <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl mix-blend-screen"></div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-center p-1 text-[10px] text-white opacity-0 group-hover:opacity-100 z-20 transition-opacity">{sponsor.name}</div>
                </motion.div>
              ))
            ) : (
              <p className="text-neutral-500 italic text-sm">Henüz destekçi eklenmemiş.</p>
            )}
          </div>
        </div>
      </section>

      {/* Gönüllü Ol — CMS'den */}
      <section className="py-24 sm:py-32 md:py-40 relative flex items-center justify-center overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=2500')] bg-cover bg-fixed bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-[#020617]"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-10 max-w-4xl mx-auto px-4 text-center"
        >
          <HeartHandshake className="w-20 h-20 text-red-600 mx-auto mb-8 drop-shadow-[0_0_30px_rgba(234,29,44,0.8)]" />
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter drop-shadow-2xl">
            {s.volunteerTitle || "Sahada Bir El De Sen Uzat"}
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-neutral-300 font-light mb-8 sm:mb-12 leading-relaxed">
            {s.volunteerSubtitle || "Profesyonel bir arama kurtarma personeli olmak için adım at. Eğitimlerimize katıl, sertifikalarını al ve umut ışığı ol."}
          </p>
          <div className="flex justify-center relative">
            <div className="absolute inset-0 bg-red-600 blur-3xl opacity-30 rounded-full"></div>
            <Link href="/gonullu-ol" className="relative z-10 px-12 py-6 bg-red-600 hover:bg-white hover:text-red-600 text-white text-lg font-black tracking-widest uppercase transition-all duration-300 group overflow-hidden">
              <span className="relative z-10 flex items-center gap-4">Bize Katıl <ArrowRight className="group-hover:translate-x-2 transition-transform" /></span>
            </Link>
          </div>
        </motion.div>
      </section>

      </div>
    </div>
  );
}
