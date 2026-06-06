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

  return (
    <main className="w-full bg-black min-h-screen">
      <HorizonHeroSection sections={sections} />
    </main>
  );
}
