import { HorizonHeroSection } from "@/components/ui/horizon-hero-section";
import { getSiteSettingsDB } from "@/lib/settings";

export const metadata = {
  title: "Hakkımızda | M1G Arama Kurtarma",
  description: "M1G Arama Kurtarma Derneği hakkında detaylı bilgiler, vizyonumuz ve misyonumuz.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AboutUsPage() {
  const settings = await getSiteSettingsDB();
  const sections = settings.aboutSections && settings.aboutSections.length > 0 ? settings.aboutSections : null;

  const vizyonBadge = settings.vizyonBadge || "Stratejik Doktrin";
  const vizyonTitle = settings.vizyonTitle || "ASLA GERİDE BIRAKMA";
  const vizyonDesc = settings.vizyonDesc || "M1G Arama Kurtarma Derneği, doğa ve afet koşullarında profesyonel standartlarla hareket eden gönüllü bir güçtür.";
  const vizyonText = settings.vizyonText || "Türkiye'de ve uluslararası arenada arama kurtarma, insani yardım ve ekoloji alanlarında en güvenilir, teknolojik donanımı en yüksek sivil toplum kuruluşlarından biri olmak.";
  const misyonText = settings.misyonText || "Doğal afetler, kayıp vakaları ve acil durumlarda 7/24 kesintisiz teyakkuz halinde kalarak, bilimsel ve taktiksel yöntemlerle insan ve canlı hayatını kurtarmak.";
  const degerlerList: string[] = Array.isArray(settings.degerlerList) && settings.degerlerList.some((d: string) => d && d.trim())
    ? settings.degerlerList.filter((d: string) => d && d.trim())
    : ["Karşılıksız Gönüllülük", "Taktiksel Disiplin", "Şeffaflık & Hesap Verebilirlik", "İnsana ve Doğaya Saygı"];

  return (
    <main className="w-full bg-black min-h-screen">
      <HorizonHeroSection sections={sections} />

      {/* CMS Vizyon, Misyon ve Değerlerimiz Bölümü */}
      <section className="relative z-10 bg-[#020617] border-t border-white/10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-[0.25em] mb-4">
              {vizyonBadge}
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
              {vizyonTitle}
            </h2>
            <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
              {vizyonDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#050B14] border border-white/10 rounded-3xl p-8 space-y-4 hover:border-red-500/30 transition-colors">
              <span className="text-xs font-black text-red-500 uppercase tracking-widest block">01 // Gelecek Hedefimiz</span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Vizyonumuz</h3>
              <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-line">{vizyonText}</p>
            </div>
            <div className="bg-[#050B14] border border-white/10 rounded-3xl p-8 space-y-4 hover:border-red-500/30 transition-colors">
              <span className="text-xs font-black text-red-500 uppercase tracking-widest block">02 // Görev Doktrinimiz</span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Misyonumuz</h3>
              <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-line">{misyonText}</p>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-[0.25em] text-center mb-6">Temel Değerlerimiz</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {degerlerList.map((val, idx) => (
                <div key={idx} className="bg-[#050B14] border border-white/10 rounded-2xl p-5 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-red-600/15 border border-red-500/30 text-red-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
                    0{idx + 1}
                  </span>
                  <span className="text-white font-bold text-sm">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
