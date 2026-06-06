import { VisualHeroSection } from "@/components/ui/visual-hero-section";
// B PLAN: import { HorizonHeroSection } from "@/components/ui/horizon-hero-section";

export const metadata = {
  title: "Hakkımızda | M1G Arama Kurtarma",
  description: "M1G Arama Kurtarma Derneği hakkında detaylı bilgiler, vizyonumuz ve misyonumuz.",
};

export default function AboutUsPage() {
  return (
    <main className="w-full bg-black min-h-screen">
      <VisualHeroSection />
      {/* B PLANI (Eski 3D Dijital Dağ Sistemi):
      <HorizonHeroSection /> 
      */}
    </main>
  );
}
