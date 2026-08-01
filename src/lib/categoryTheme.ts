export interface CategoryTheme {
    color: string;
    textColor: string;
    title: string;
    badgeClass: string;
    iconClass: string;
    borderClass: string;
    badgeSolid: string;
    borderColorLight: string;
}

export function getCategoryTheme(item?: { category?: string; equipmentCategory?: string; isContainer?: boolean }): CategoryTheme {
    const isKit = item?.isContainer === true;
    const cat = (item?.category || "").toLowerCase().trim();

    // 1. Lojistik -> YEŞİL (#16A34A)
    if (cat.includes("lojistik")) {
        return {
            color: "#16A34A",
            textColor: "#ffffff",
            title: isKit ? "📦 LOJİSTİK KİTİ" : "🚚 LOJİSTİK",
            badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
            iconClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            borderClass: "border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)]",
            badgeSolid: "bg-emerald-600 text-white",
            borderColorLight: "#DCFCE7"
        };
    }

    // 2. Yönetim Malzemeleri -> MAVİ (#2563EB)
    if (cat.includes("yönetim") || cat.includes("yonetim")) {
        return {
            color: "#2563EB",
            textColor: "#ffffff",
            title: isKit ? "📦 YÖNETİM KİTİ" : "📋 YÖNETİM MALZEMELERİ",
            badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/30",
            iconClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            borderClass: "border-blue-500/30 shadow-[0_0_40px_rgba(37,99,235,0.15)]",
            badgeSolid: "bg-blue-600 text-white",
            borderColorLight: "#DBEAFE"
        };
    }

    // 3. Sağlık / Medikal -> SARI (#D97706 / #EAB308)
    if (cat.includes("medikal") || cat.includes("sağlık") || cat.includes("saglik")) {
        return {
            color: "#D97706",
            textColor: "#ffffff",
            title: isKit ? "📦 SAĞLIK KİTİ" : "🩺 SAĞLIK / MEDİKAL",
            badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
            iconClass: "bg-amber-500/20 text-amber-400 border-amber-500/30",
            borderClass: "border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]",
            badgeSolid: "bg-amber-500 text-black font-extrabold",
            borderColorLight: "#FEF3C7"
        };
    }

    // 4. Arama Kurtarma (Arama / Kurtarma) -> KIRMIZI (#DC2626)
    return {
        color: "#DC2626",
        textColor: "#ffffff",
        title: isKit ? "📦 ARAMA KURTARMA KİTİ" : "🚨 ARAMA KURTARMA",
        badgeClass: "bg-red-500/20 text-red-300 border-red-500/30",
        iconClass: "bg-red-500/20 text-red-400 border-red-500/30",
        borderClass: "border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)]",
        badgeSolid: "bg-red-600 text-white",
        borderColorLight: "#FEE2E2"
    };
}
