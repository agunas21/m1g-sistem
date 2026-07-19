import CoordinateLocator from "@/components/home/CoordinateLocator";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Koordinat Çevirici | M1G",
    description: "M1G Arama Kurtarma için profesyonel koordinat dönüştürme ve yön bulma aracı.",
};

export default function KoordinatPage() {
    return (
        <main className="bg-neutral-950 min-h-screen">
            <CoordinateLocator />
        </main>
    );
}
