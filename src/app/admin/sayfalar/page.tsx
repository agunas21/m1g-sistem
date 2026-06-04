"use client";

import { useState, useEffect, useRef } from "react";
import {
    PenTool, CheckCircle, Image as ImageIcon, Type, Trash2, Loader2,
    Users, AlertTriangle, Plus, Camera, ChevronDown, ChevronUp,
    HeartHandshake, Save, LayoutTemplate, Megaphone, UserSquare2, Activity, Star,
    MapPin, Calendar, FileText, Edit3, Newspaper, Tag, Target, Clock, Bell, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const REPORT_CATEGORIES = [
    { value: "arama-kurtarma", label: "Arama & Kurtarma" },
    { value: "egitim", label: "Eğitim" },
    { value: "insani-yardim", label: "İnsani Yardım" },
    { value: "ekoloji", label: "Ekoloji" },
    { value: "sosyal", label: "Sosyal Faaliyet" },
];

const REPORT_QUARTERS = [
    { value: "Q1", label: "1. Çeyrek (Ocak–Mart)" },
    { value: "Q2", label: "2. Çeyrek (Nisan–Haziran)" },
    { value: "Q3", label: "3. Çeyrek (Temmuz–Eylül)" },
    { value: "Q4", label: "4. Çeyrek (Ekim–Aralık)" },
];

// ─── SEKMELER ───────────────────────────────────────────────────────────
const ANNOUNCEMENT_CATEGORIES = ["Duyuru", "Eğitim", "Operasyon", "Etkinlik", "Haber"];

const EVENT_CATEGORIES = ["egitim", "operasyon", "toplanti", "sosyal", "tatbikat"];
const EVENT_CAT_LABELS: Record<string, string> = { egitim: "Eğitim", operasyon: "Operasyon", toplanti: "Toplantı", sosyal: "Sosyal", tatbikat: "Tatbikat" };
const OP_TYPES = ["arama-kurtarma", "insani-yardim", "tatbikat", "ekoloji"];
const OP_TYPE_LABELS: Record<string, string> = { "arama-kurtarma": "Arama & Kurtarma", "insani-yardim": "İnsani Yardım", tatbikat: "Tatbikat", ekoloji: "Ekoloji" };
const OP_STATUSES = ["tamamlandi", "devam", "planlandi"];
const OP_STATUS_LABELS: Record<string, string> = { tamamlandi: "Tamamlandı", devam: "Devam Ediyor", planlandi: "Planlandı" };

const TABS = [
    { id: "general",     label: "Genel Ayarlar",     icon: <Globe size={15} /> },
    { id: "hero",        label: "Anasayfa",         icon: <LayoutTemplate size={15} /> },
    { id: "announcements", label: "Duyurular",      icon: <Newspaper size={15} /> },
    { id: "about",       label: "Hakkımızda",        icon: <PenTool size={15} /> },
    { id: "vizyon",      label: "Vizyon & Misyon",   icon: <Target size={15} /> },
    { id: "activities",  label: "Faaliyetler",       icon: <Activity size={15} /> },
    { id: "calendar",    label: "Etkinlik Takvimi",  icon: <Calendar size={15} /> },
    { id: "operations",  label: "Operasyonlar",      icon: <Target size={15} /> },
    { id: "volunteer",   label: "Gönüllü Ol",        icon: <HeartHandshake size={15} /> },
    { id: "sponsors",    label: "Destekçiler",       icon: <Star size={15} /> },
    { id: "social",      label: "Sosyal Medya",      icon: <Globe size={15} /> },
    { id: "live",        label: "Canlı Brifing",     icon: <Megaphone size={15} /> },
];

export default function KolaySiteDuzenleyici() {
    const [activeTab, setActiveTab] = useState("general");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [saved, setSaved] = useState(false);

    // ─── TÜM CMS STATE ───────────────────────────────────────────────────
    const [siteTitle, setSiteTitle]         = useState("");
    const [siteDesc, setSiteDesc]           = useState("");
    const [bankName, setBankName]           = useState("");
    const [iban, setIban]                   = useState("");
    const [heroTitle, setHeroTitle]         = useState("");
    const [heroSubtitle, setHeroSubtitle]   = useState("");
    const [heroBadge, setHeroBadge]         = useState("");
    const [heroDesc, setHeroDesc]           = useState("");
    const [heroImages, setHeroImages]         = useState<string[]>([]);
    const [heroVideoUrl, setHeroVideoUrl]     = useState("");
    const [aboutText, setAboutText]         = useState("");
    const [volunteerTitle, setVolunteerTitle]       = useState("");
    const [volunteerSubtitle, setVolunteerSubtitle] = useState("");
    const [vizyonTitle, setVizyonTitle]     = useState("");
    const [vizyonBadge, setVizyonBadge]     = useState("");
    const [vizyonDesc, setVizyonDesc]       = useState("");
    const [vizyonText, setVizyonText]       = useState("");
    const [misyonText, setMisyonText]       = useState("");
    const [degerlerList, setDegerlerList]   = useState<string[]>([]);
    const [liveSessionMode, setLiveSessionMode]     = useState("offline");
    const [liveSessionTitle, setLiveSessionTitle]   = useState("");
    const [liveSessionUrl, setLiveSessionUrl]       = useState("");
    const [sponsors, setSponsors]           = useState<any[]>([]);
    const [activities, setActivities]       = useState<any[]>([]);
    const [activityGallery, setActivityGallery] = useState<any[]>([]);
    const [activityReports, setActivityReports] = useState<any[]>([]);
    const [editingReport, setEditingReport]     = useState<any | null>(null);
    const [newSponsorLogo, setNewSponsorLogo] = useState("");
    const [announcements, setAnnouncements]   = useState<any[]>([]);
    const [editingAnnouncement, setEditingAnnouncement] = useState<any>({ id: "", title: "", summary: "", category: "Duyuru", date: new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }), image: "" });
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [editingEvent, setEditingEvent]     = useState<any | null>(null);
    const [operations, setOperations]         = useState<any[]>([]);
    const [editingOp, setEditingOp]           = useState<any | null>(null);
    const [socialMedia, setSocialMedia]       = useState({
        website: "", whatsapp: "", email: "", instagram: "", twitter: "", facebook: "", youtube: ""
    });

    const [siteLogo, setSiteLogo]           = useState("");
    const [siteFavicon, setSiteFavicon]     = useState("");
    const [aboutBadge, setAboutBadge]       = useState("");
    const [aboutTitle, setAboutTitle]       = useState("");
    const [aboutTag1, setAboutTag1]         = useState("");
    const [aboutTag2, setAboutTag2]         = useState("");
    const [activitiesBadge, setActivitiesBadge] = useState("");
    const [activitiesTitle, setActivitiesTitle] = useState("");
    const [sponsorsBadge, setSponsorsBadge] = useState("");
    const [sponsorsTitle, setSponsorsTitle] = useState("");

    // ─── ABOUT SECTIONS STATE ────────────────────────────────────────────
    const defaultAboutSections = [
        {
            id: "SEC-01",
            stepNumber: "01",
            title: "KURULUŞUMUZ",
            subtitle: "BİR UMUT YOLCULUĞU",
            desc: "M1G Arama Kurtarma Derneği, 2023 yılında, afetlere karşı en zorlu koşullarda bile bir cana daha ulaşabilmek sevdasıyla, tamamen gönüllülük esasıyla kuruldu.",
            metrics: []
        },
        {
            id: "SEC-02",
            stepNumber: "02",
            title: "KARARLILIK",
            subtitle: "BİLİNÇ VE EĞİTİM",
            desc: "Sadece sahada olmakla yetinmedik. Doğada, kentsel alanlarda ve su altındaki her türlü senaryoya karşı profesyonel uluslararası standartlarda eğitimlerimizi tamamladık.",
            metrics: [{ label: "EĞİTİMLİ GÖNÜLLÜ", value: "300+" }, { label: "BRANŞ", value: "5" }]
        },
        {
            id: "SEC-03",
            stepNumber: "03",
            title: "GÜCÜMÜZ",
            subtitle: "OPERASYONEL KAPASİTE",
            desc: "Özel donanımlı araçlarımız, sismik dinleme cihazlarımız, termal dronlarımız ve medikal müdahale kitlerimiz ile karanlığın çöktüğü her yerde ışık olmaya hazırız.",
            metrics: [{ label: "HAZIRLIK SÜRESİ", value: "7/24" }, { label: "MÜDAHALE EKİPMANI", value: "FULL" }]
        },
        {
            id: "SEC-04",
            stepNumber: "04",
            title: "OPERASYONLAR",
            subtitle: "SAHADA İZİMİZ VAR",
            desc: "Depremler, kayıp vakaları ve büyük doğa felaketlerinde yüzlerce arama kurtarma faaliyetine katıldık. Geri dönmeyen tek bir can kalmayana dek durmayacağız.",
            metrics: [{ label: "GÖREV", value: "150+" }, { label: "KURTARILAN", value: "HAYATLAR" }]
        }
    ];
    const [aboutSections, setAboutSections]   = useState<any[]>(defaultAboutSections);


    // ─── VERİ YÜKLEME (ayrı endpoint'lerden paralel yükle) ───────────────
    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                const [resText, resImages, resActs] = await Promise.all([
                    fetch("/api/settings?t=" + Date.now()).then(r => r.ok ? r.json() : {} as any),
                    fetch("/api/settings/images?t=" + Date.now()).then(r => r.ok ? r.json() : {} as any),
                    fetch("/api/settings/activities?t=" + Date.now()).then(r => r.ok ? r.json() : {} as any)
                ]);

                if (!isMounted) return;

                // 1. Metin Ayarları
                setHeroTitle(resText.heroTitle || "");
                setHeroSubtitle(resText.heroSubtitle || "");
                setHeroBadge(resText.heroBadge || "");
                setHeroDesc(resText.heroDesc || "");
                setHeroVideoUrl(resText.heroVideoUrl || "");
                setAboutText(resText.aboutText || "");
                setVolunteerTitle(resText.volunteerTitle || "");
                setVolunteerSubtitle(resText.volunteerSubtitle || "");
                setVizyonTitle(resText.vizyonTitle || "");
                setSiteTitle(resText.siteTitle || "");
                setSiteDesc(resText.siteDesc || "");
                setBankName(resText.bankName || "");
                setIban(resText.iban || "");
                setVizyonBadge(resText.vizyonBadge || "");
                setVizyonDesc(resText.vizyonDesc || "");
                setVizyonText(resText.vizyonText || "");
                setMisyonText(resText.misyonText || "");
                setDegerlerList(resText.degerlerList || []);
                setAboutBadge(resText.aboutBadge || "");
                setAboutTitle(resText.aboutTitle || "");
                setAboutTag1(resText.aboutTag1 || "");
                setAboutTag2(resText.aboutTag2 || "");
                setActivitiesBadge(resText.activitiesBadge || "");
                setActivitiesTitle(resText.activitiesTitle || "");
                setSponsorsBadge(resText.sponsorsBadge || "");
                setSponsorsTitle(resText.sponsorsTitle || "");
                if (resText.liveSession) {
                    setLiveSessionMode(resText.liveSession.isActive ? "active" : "offline");
                    setLiveSessionTitle(resText.liveSession.title || "");
                    setLiveSessionUrl(resText.liveSession.url || "");
                }
                setActivities(resText.activities || []);
                setAnnouncements(resText.announcements || []);
                setCalendarEvents(resText.calendarEvents || []);
                setOperations(resText.operations || []);
                if (resText.aboutSections && resText.aboutSections.length > 0) {
                    setAboutSections(resText.aboutSections);
                }
                if (resText.socialMedia) {
                    setSocialMedia((prev: any) => ({ ...prev, ...resText.socialMedia }));
                }

                // 2. Görsel Ayarları
                if (resImages.siteLogo) setSiteLogo(resImages.siteLogo);
                if (resImages.siteFavicon) setSiteFavicon(resImages.siteFavicon);
                if (resImages.heroImages?.length) setHeroImages(resImages.heroImages);

                // 3. Sponsor Birleştirme
                const textSponsors = resText.sponsors || [];
                const imgSponsors = resImages.sponsors || [];
                const mergedSponsors = [...textSponsors];
                imgSponsors.forEach((imgS: any) => {
                    const existing = mergedSponsors.find((s: any) => s.id === imgS.id);
                    if (existing) {
                        existing.logo = imgS.logo || existing.logo || "";
                    } else {
                        mergedSponsors.push(imgS);
                    }
                });
                setSponsors(mergedSponsors);

                // 4. Faaliyetler
                setActivityReports(resActs.activityReports || []);
                setActivityGallery(resActs.activityGallery || []);

            } catch (err) {
                console.error("[CMS] Veri yükleme hatası:", err);
            } finally {
                if (isMounted) setFetching(false);
            }
        };

        fetchData();
        return () => {
            isMounted = false;
        };
    }, []);


    // ─── KAYDETME (3 ayrı endpoint'e bölerek kaydet) ────────────────────
    const handleSave = async () => {
        setLoading(true);
        const errors: string[] = [];

        try {
            // 1. Metin ayarları (hafif — görsel yok)
            const textPayload = {
                heroTitle, heroSubtitle, heroBadge, heroDesc, heroVideoUrl, aboutText,
                volunteerTitle, volunteerSubtitle,
                vizyonTitle, vizyonBadge, vizyonDesc, vizyonText, misyonText, degerlerList,
                siteTitle, siteDesc, bankName, iban,
                aboutBadge, aboutTitle, aboutTag1, aboutTag2,
                activitiesBadge, activitiesTitle, sponsorsBadge, sponsorsTitle,
                liveSession: { isActive: liveSessionMode === "active", title: liveSessionTitle, url: liveSessionUrl },
                activities, announcements, calendarEvents, operations, aboutSections, socialMedia,
                // Sponsor meta (logosuz)
                sponsors: sponsors.map((s: any) => ({ id: s.id, name: s.name, role: s.role })),
            };
            const r1 = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(textPayload),
            });
            if (!r1.ok) {
                const err = await r1.json().catch(() => ({ error: `HTTP ${r1.status}` }));
                errors.push("Metin ayarları: " + (err.error || "Hata"));
            }
        } catch (e) {
            errors.push("Metin ayarları bağlantı hatası: " + String(e));
        }

        try {
            // 2. Görseller (siteLogo, heroImages, sponsor logoları)
            const imgPayload = {
                siteLogo,
                siteFavicon,
                heroImages,
                sponsors: sponsors.map((s: any) => ({ id: s.id, name: s.name, role: s.role, logo: s.logo || "" })),
            };
            const r2 = await fetch("/api/settings/images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(imgPayload),
            });
            if (!r2.ok) {
                const err = await r2.json().catch(() => ({ error: `HTTP ${r2.status}` }));
                errors.push("Görseller: " + (err.error || "Hata"));
            }
        } catch (e) {
            errors.push("Görseller bağlantı hatası: " + String(e));
        }

        try {
            // 3. Faaliyet raporları ve galeri
            const actPayload = {
                activityGallery,
                activityReports,
            };
            const r3 = await fetch("/api/settings/activities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(actPayload),
            });
            if (!r3.ok) {
                const err = await r3.json().catch(() => ({ error: `HTTP ${r3.status}` }));
                errors.push("Faaliyetler: " + (err.error || "Hata"));
            }
        } catch (e) {
            errors.push("Faaliyetler bağlantı hatası: " + String(e));
        }

        setLoading(false);

        if (errors.length > 0) {
            alert("Bazı veriler kaydedilemedi:\n" + errors.join("\n"));
        } else {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    // ─── FOTOĞRAF YÜKLEME (HARİCİ SUNUCU) ─────────────────────────────────
    const uploadFileToServer = async (file: File): Promise<string> => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success && data.url) return data.url;
        throw new Error(data.error || 'Yükleme başarısız');
    };

    const handleSiteLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setSiteLogo(await uploadFileToServer(file).catch(err => { alert(err.message); return ""; }));
    };

    const handleSiteFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setSiteFavicon(await uploadFileToServer(file).catch(err => { alert(err.message); return ""; }));
    };

    const handleHeroImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setLoading(true);
        try {
            const urls = await Promise.all(files.map(uploadFileToServer));
            setHeroImages(prev => [...prev, ...urls]);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
            e.target.value = ""; // input'u temizle
        }
    };

    const removeHeroImage = (idx: number) => {
        setHeroImages(prev => prev.filter((_, i) => i !== idx));
    };

    const moveHeroImage = (idx: number, dir: "up" | "down") => {
        setHeroImages(prev => {
            const arr = [...prev];
            const swap = dir === "up" ? idx - 1 : idx + 1;
            if (swap < 0 || swap >= arr.length) return arr;
            [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
            return arr;
        });
    };

    // ─── SPONSOR YÖNETIMI ────────────────────────────────────────────────
    const handleSponsorLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setNewSponsorLogo(await uploadFileToServer(file));
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const handleAddSponsor = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = fd.get("sponsorName") as string;
        const role = fd.get("sponsorRole") as string;
        if (name && role) {
            setSponsors([...sponsors, { id: Date.now(), name, role, logo: newSponsorLogo || "" }]);
            (e.target as HTMLFormElement).reset();
            setNewSponsorLogo("");
        }
    };

    // ─── YÖNETİM KURULU YÖNETIMI ──────────────────────────────────────────
    // Board members CMS logic has been removed as it is now dynamically fetched from members database.

    // ─── FAALİYET YÖNETIMI ───────────────────────────────────────────────
    const updateActivity = (id: number, field: string, value: string) => {
        setActivities(activities.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const handleGalleryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLoading(true);
            try {
                const url = await uploadFileToServer(file);
                setActivityGallery([...activityGallery, {
                    id: Date.now(),
                    common: "Yeni Görsel",
                    binomial: "",
                    photo: { url, text: "Yeni görsel", by: "M1G Ekibi" }
                }]);
            } catch (err: any) {
                alert(err.message);
            } finally {
                setLoading(false);
            }
        }
        e.target.value = "";
    };
    
    const updateGalleryItem = (id: number, field: string, value: string) => {
        setActivityGallery(activityGallery.map(item => {
            if (item.id === id) {
                if (field === "common" || field === "binomial") return { ...item, [field]: value };
                if (field === "by") return { ...item, photo: { ...item.photo, by: value } };
            }
            return item;
        }));
    };

    // ─── FAALİYET RAPORU YÖNETIMI ────────────────────────────────────────
    const createNewReport = () => {
        const newReport = {
            id: Date.now(),
            period: "",
            year: new Date().getFullYear().toString(),
            quarter: "Q1",
            title: "",
            summary: "",
            date: new Date().toISOString().split("T")[0],
            location: "",
            participants: "",
            details: "",
            category: "arama-kurtarma",
            photos: [] as string[],
        };
        setEditingReport(newReport);
    };

    const saveReport = () => {
        if (!editingReport || !editingReport.title) return;
        const exists = activityReports.find((r: any) => r.id === editingReport.id);
        if (exists) {
            setActivityReports(activityReports.map((r: any) => r.id === editingReport.id ? editingReport : r));
        } else {
            setActivityReports([editingReport, ...activityReports]);
        }
        setEditingReport(null);
    };

    const deleteReport = (id: number) => {
        if (confirm("Bu faaliyet raporunu silmek istediğinizden emin misiniz?")) {
            setActivityReports(activityReports.filter((r: any) => r.id !== id));
        }
    };

    const handleReportPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setLoading(true);
        try {
            const urls = await Promise.all(files.map(uploadFileToServer));
            setEditingReport({ ...editingReport, photos: [...(editingReport.photos || []), ...urls] });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
            e.target.value = "";
        }
    };

    const removeReportPhoto = (idx: number) => {
        setEditingReport({
            ...editingReport,
            photos: editingReport.photos.filter((_: string, i: number) => i !== idx)
        });
    };

    if (fetching) return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="animate-spin text-red-500 w-12 h-12" />
            <p className="text-neutral-500 text-sm uppercase tracking-widest">CMS Yükleniyor...</p>
        </div>
    );

    return (
        <div className="space-y-0 pb-20 max-w-7xl mx-auto">

            {/* HEADER + KAYDET BUTONU */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <PenTool className="text-red-500" size={26} /> Site Düzenleyici
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">Değişiklikler siteye anında yansır.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${saved
                        ? "bg-emerald-600 text-white shadow-emerald-500/30"
                        : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/30"
                    } disabled:opacity-50`}
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
                    {loading ? "Kaydediliyor..." : saved ? "Kaydedildi!" : "Tümünü Kaydet"}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Sol Taraf: Sekmeler (Desktop Sidebar) / Dropdown (Mobil) */}
                
                {/* Desktop Sekmeler Sidebar */}
                <div className="hidden lg:flex flex-col w-72 bg-[#050B14] border border-white/10 rounded-2xl p-3 space-y-1.5 shrink-0">
                    <div className="px-3 py-2 border-b border-white/5 mb-2">
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Düzenleme Panelleri</span>
                    </div>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-left transition-all ${
                                activeTab === tab.id
                                    ? "bg-red-600/10 text-red-400 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                                    : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5 border border-transparent"
                            }`}
                        >
                            <span className={activeTab === tab.id ? "text-red-500" : "text-neutral-500"}>{tab.icon}</span>
                            <span className="truncate">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Mobil Sekme Dropdown */}
                <div className="lg:hidden w-full mb-6">
                    <label className="cms-label">Sekme Seçin</label>
                    <div className="relative">
                        <select
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value)}
                            className="w-full bg-[#050B14] border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-white appearance-none focus:border-red-500 focus:outline-none font-sans"
                        >
                            {TABS.map(tab => (
                                <option key={tab.id} value={tab.id} className="bg-[#050B14] text-white">
                                    {tab.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={16} />
                    </div>
                </div>

                {/* Sağ Taraf: Tab İçeriği */}
                <div className="flex-1 w-full min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>


                {/* ═══ GENEL AYARLAR ═══ */}
                {activeTab === "general" && (
                    <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
                            <Globe size={16} className="text-red-500" /> Genel &amp; SEO Ayarları
                        </h2>
                        <div>
                            <label className="cms-label">Site Başlığı (Browser Tab Başlığı)</label>
                            <input 
                                value={siteTitle} 
                                onChange={e => setSiteTitle(e.target.value)} 
                                className="cms-input font-bold" 
                                placeholder="Örn: M1G Arama Kurtarma Derneği | Resmi Web Sitesi" 
                            />
                            <p className="text-neutral-500 text-[10px] mt-1">Tarayıcı sekmesinde ve Google arama sonuçlarında görünen ana başlık.</p>
                        </div>
                        <div>
                            <label className="cms-label">Site Açıklaması (SEO Meta Description)</label>
                            <textarea 
                                rows={3} 
                                value={siteDesc} 
                                onChange={e => setSiteDesc(e.target.value)} 
                                className="cms-input resize-none" 
                                placeholder="Google arama sonuçlarında çıkacak özet açıklama..." 
                            />
                            <p className="text-neutral-500 text-[10px] mt-1">Arama motorlarında başlığın altında görüntülenecek 150-160 karakterlik özet metin.</p>
                        </div>
                        <div>
                            <label className="cms-label flex items-center gap-1"><ImageIcon size={12} /> Resmi Logo Görseli (Navbar &amp; Footer)</label>
                            <input type="file" accept="image/*" onChange={handleSiteLogoUpload} className="cms-file-input" />
                            {siteLogo && (
                                <div className="mt-2 flex items-center gap-4 bg-black/40 border border-white/5 rounded-xl p-3 w-max">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-black flex items-center justify-center p-2">
                                        <img src={siteLogo} alt="Logo Önizleme" className="w-full h-full object-contain" />
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setSiteLogo("")}
                                        className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-500 text-[10px] font-bold uppercase rounded-lg border border-red-500/25 transition-colors"
                                    >
                                        Logoyu Kaldır
                                    </button>
                                </div>
                            )}
                            <p className="text-neutral-500 text-[10px] mt-1">Sitenin sol üst köşesindeki navbar ve alttaki footer kısımlarında görüntülenecek resmi logo.</p>
                        </div>
                        <div>
                            <label className="cms-label flex items-center gap-1"><ImageIcon size={12} /> Tarayıcı Sekme Logosu (Favicon)</label>
                            <input type="file" accept="image/*" onChange={handleSiteFaviconUpload} className="cms-file-input" />
                            {siteFavicon && (
                                <div className="mt-2 flex items-center gap-4 bg-black/40 border border-white/5 rounded-xl p-3 w-max">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-black flex items-center justify-center p-2">
                                        <img src={siteFavicon} alt="Favicon Önizleme" className="w-full h-full object-contain" />
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setSiteFavicon("")}
                                        className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-500 text-[10px] font-bold uppercase rounded-lg border border-red-500/25 transition-colors"
                                    >
                                        Faviconu Kaldır
                                    </button>
                                </div>
                            )}
                            <p className="text-neutral-500 text-[10px] mt-1">Tarayıcı sekmesinde görüntülenecek küçük kare logo (favicon).</p>
                        </div>
                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Resmi Bağış &amp; Hesap Bilgileri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="cms-label">Banka Adı</label>
                                    <input 
                                        value={bankName} 
                                        onChange={e => setBankName(e.target.value)} 
                                        className="cms-input" 
                                        placeholder="Örn: Ziraat Bankası" 
                                    />
                                </div>
                                <div>
                                    <label className="cms-label">IBAN Numarası</label>
                                    <input 
                                        value={iban} 
                                        onChange={e => setIban(e.target.value)} 
                                        className="cms-input font-mono" 
                                        placeholder="TR00 ..." 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ ANASAYFA ═══ */}
                {activeTab === "hero" && (
                    <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
                            <LayoutTemplate size={16} className="text-red-500" /> Anasayfa Ayarları
                        </h2>
                        <div>
                            <label className="cms-label">Ana Başlık (Hero)</label>
                            <input value={heroTitle} onChange={e => setHeroTitle(e.target.value)} className="cms-input" />
                        </div>
                        <div>
                            <label className="cms-label">Üst Etiket (Örn: M1G Arazi & Dağ Operasyonu)</label>
                            <input value={heroBadge} onChange={e => setHeroBadge(e.target.value)} className="cms-input" placeholder="M1G Arazi & Dağ Operasyonu" />
                        </div>
                        <div>
                            <label className="cms-label">Uzun Açıklama Kutusu</label>
                            <textarea rows={2} value={heroDesc} onChange={e => setHeroDesc(e.target.value)} className="cms-input resize-none" placeholder="Sadece düzlüklerde değil..." />
                        </div>
                        <div>
                            <label className="cms-label">Alt Açıklama Metni (İnce Subtitle)</label>
                            <textarea rows={2} value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} className="cms-input resize-none" />
                        </div>
                        <div className="bg-black/25 border border-amber-500/20 rounded-xl p-4 space-y-3">
                            <label className="cms-label flex items-center gap-2 text-amber-400">
                                🎬 YouTube Video Embed (Kurumsal Kimlik Bölümü)
                            </label>
                            <input
                                value={heroVideoUrl}
                                onChange={e => setHeroVideoUrl(e.target.value)}
                                className="cms-input font-mono text-sm"
                                placeholder="https://www.youtube.com/embed/VIDEO_ID"
                            />
                            <p className="text-neutral-500 text-[10px]">
                                YouTube video URL'sini embed formatında yazın. Örn: <span className="text-neutral-400 font-mono">https://www.youtube.com/embed/dQw4w9WgXcQ</span>
                                {heroVideoUrl && (
                                    <span className="block mt-1 text-amber-400">✓ Video set edildi</span>
                                )}
                            </p>
                        </div>
                        <div>
                            <label className="cms-label flex items-center gap-2">
                                <ImageIcon size={12} />
                                Slider Görselleri
                                <span className="text-neutral-600 normal-case font-normal text-[10px]">— istediğiniz kadar ekleyin, sıralayabilirsiniz</span>
                            </label>

                            {/* Çoklu Yükleme */}
                            <label className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-red-500/40 rounded-xl cursor-pointer transition-all group mb-4">
                                <Plus size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-white text-sm font-bold">Görsel Ekle</p>
                                    <p className="text-neutral-500 text-[11px]">Birden fazla seçebilirsiniz (JPG, PNG, WebP)</p>
                                </div>
                                <input type="file" accept="image/*" multiple onChange={handleHeroImagesUpload} className="hidden" />
                            </label>

                            {/* Görsel Grid */}
                            {heroImages.length > 0 ? (
                                <div className="space-y-2">
                                    {heroImages.map((img, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl overflow-hidden p-2 group hover:border-white/15 transition-colors">
                                            {/* Önizleme */}
                                            <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                                <img src={img} alt={`Slayt ${idx + 1}`} className="w-full h-full object-cover" />
                                            </div>
                                            {/* Bilgi */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-xs font-bold">Slayt {idx + 1}</p>
                                                <p className="text-neutral-600 text-[10px]">Yüklendi • Base64</p>
                                            </div>
                                            {/* Sıralama & Sil */}
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => moveHeroImage(idx, "up")}
                                                    disabled={idx === 0}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-500 hover:text-white disabled:opacity-20 transition-colors"
                                                    title="Yukarı Taş"
                                                >
                                                    <ChevronUp size={14} />
                                                </button>
                                                <button
                                                    onClick={() => moveHeroImage(idx, "down")}
                                                    disabled={idx === heroImages.length - 1}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-500 hover:text-white disabled:opacity-20 transition-colors"
                                                    title="Aşağı Taş"
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                                <button
                                                    onClick={() => removeHeroImage(idx)}
                                                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-neutral-600 hover:text-red-400 transition-colors"
                                                    title="Kaldır"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border border-dashed border-white/5 rounded-xl">
                                    <ImageIcon size={24} className="mx-auto text-neutral-700 mb-2" />
                                    <p className="text-neutral-600 text-xs">Henüz görsel eklenmedi.</p>
                                    <p className="text-neutral-700 text-[10px] mt-1">Yukardaki butona tıklayarak resim ekleyin.</p>
                                </div>
                            )}
                        </div>
                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Diğer Anasayfa Bölümleri Başlık ve Etiketleri</h3>
                            
                            {/* Kurumsal Kimlik Bölümü */}
                            <div className="bg-black/25 border border-white/5 rounded-xl p-4 space-y-4">
                                <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest">Kurumsal Kimlik (Hakkımızda Giriş) Bölümü</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="cms-label">Bölüm Üst Başlığı (Badge)</label>
                                        <input value={aboutBadge} onChange={e => setAboutBadge(e.target.value)} className="cms-input" placeholder="Örn: Kurumsal Kimlik" />
                                    </div>
                                    <div>
                                        <label className="cms-label">Bölüm Ana Başlığı</label>
                                        <input value={aboutTitle} onChange={e => setAboutTitle(e.target.value)} className="cms-input" placeholder="Örn: Asla Geride Bırakma" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="cms-label">Vurgu Kutusu 1. Satır (Tag 1)</label>
                                        <input value={aboutTag1} onChange={e => setAboutTag1(e.target.value)} className="cms-input" placeholder="Örn: Asla Geride Bırakma" />
                                    </div>
                                    <div>
                                        <label className="cms-label">Vurgu Kutusu 2. Satır (Tag 2)</label>
                                        <input value={aboutTag2} onChange={e => setAboutTag2(e.target.value)} className="cms-input" placeholder="Örn: Sıfır Hata, %100 Disiplin" />
                                    </div>
                                </div>
                            </div>

                            {/* Faaliyetlerimiz Bölümü */}
                            <div className="bg-black/25 border border-white/5 rounded-xl p-4 space-y-4">
                                <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest">Uzmanlık Alanlarımız &amp; Faaliyetlerimiz Bölümü</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="cms-label">Bölüm Üst Başlığı (Badge)</label>
                                        <input value={activitiesBadge} onChange={e => setActivitiesBadge(e.target.value)} className="cms-input" placeholder="Örn: Uzmanlık Alanlarımız" />
                                    </div>
                                    <div>
                                        <label className="cms-label">Bölüm Ana Başlığı</label>
                                        <input value={activitiesTitle} onChange={e => setActivitiesTitle(e.target.value)} className="cms-input" placeholder="Örn: Faaliyetlerimiz" />
                                    </div>
                                </div>
                            </div>

                            {/* Destekçilerimiz Bölümü */}
                            <div className="bg-black/25 border border-white/5 rounded-xl p-4 space-y-4">
                                <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest">Destek Verenler (Sponsorlar) Bölümü</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="cms-label">Bölüm Üst Başlığı (Badge)</label>
                                        <input value={sponsorsBadge} onChange={e => setSponsorsBadge(e.target.value)} className="cms-input" placeholder="Örn: Gücümüze Güç Katanlar" />
                                    </div>
                                    <div>
                                        <label className="cms-label">Bölüm Ana Başlığı</label>
                                        <input value={sponsorsTitle} onChange={e => setSponsorsTitle(e.target.value)} className="cms-input" placeholder="Örn: Destek Verenler" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ HAKKIMIZDA ═══ */}
                {activeTab === "about" && (
                    <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
                            <PenTool size={16} className="text-red-500" /> Hakkımızda Sayfası
                        </h2>
                        
                        {/* 4 Aşamalı Dinamik İçerik Yönetimi */}
                        <div className="space-y-6 mt-6">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Horizon Operasyon Ekranı Bölümleri (4 Adım)</h3>
                            {aboutSections.map((section, idx) => (
                                <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                        <div>
                                            <label className="cms-label text-red-400">Bölüm Kodu (Örn: SEC-01)</label>
                                            <input 
                                                value={section.id} 
                                                onChange={e => {
                                                    const newArr = [...aboutSections];
                                                    newArr[idx].id = e.target.value;
                                                    setAboutSections(newArr);
                                                }} 
                                                className="cms-input border-red-500/30 bg-red-500/5 text-red-400 font-mono text-sm" 
                                            />
                                        </div>
                                        <div>
                                            <label className="cms-label text-neutral-300">Büyük Sıra Numarası (Örn: 01)</label>
                                            <input 
                                                value={section.stepNumber || `0${idx + 1}`} 
                                                onChange={e => {
                                                    const newArr = [...aboutSections];
                                                    newArr[idx].stepNumber = e.target.value;
                                                    setAboutSections(newArr);
                                                }} 
                                                className="cms-input font-mono text-sm" 
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="cms-label">Başlık</label>
                                            <input 
                                                value={section.title} 
                                                onChange={e => {
                                                    const newArr = [...aboutSections];
                                                    newArr[idx].title = e.target.value;
                                                    setAboutSections(newArr);
                                                }} 
                                                className="cms-input" 
                                            />
                                        </div>
                                        <div>
                                            <label className="cms-label">Alt Başlık (Subtitle)</label>
                                            <input 
                                                value={section.subtitle} 
                                                onChange={e => {
                                                    const newArr = [...aboutSections];
                                                    newArr[idx].subtitle = e.target.value;
                                                    setAboutSections(newArr);
                                                }} 
                                                className="cms-input" 
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="cms-label">Açıklama (Desc)</label>
                                        <textarea 
                                            rows={2} 
                                            value={section.desc} 
                                            onChange={e => {
                                                const newArr = [...aboutSections];
                                                newArr[idx].desc = e.target.value;
                                                setAboutSections(newArr);
                                            }} 
                                            className="cms-input resize-none" 
                                        />
                                    </div>
                                    
                                    {/* Metrics Editing */}
                                    <div>
                                        <label className="cms-label">Metrikler (İstatistikler)</label>
                                        {section.metrics && section.metrics.map((metric: any, mIdx: number) => (
                                            <div key={mIdx} className="flex gap-2 mb-2">
                                                <input 
                                                    value={metric.value} 
                                                    onChange={e => {
                                                        const newArr = [...aboutSections];
                                                        newArr[idx].metrics[mIdx].value = e.target.value;
                                                        setAboutSections(newArr);
                                                    }} 
                                                    placeholder="Değer (Örn: 300+)" 
                                                    className="cms-input w-1/3" 
                                                />
                                                <input 
                                                    value={metric.label} 
                                                    onChange={e => {
                                                        const newArr = [...aboutSections];
                                                        newArr[idx].metrics[mIdx].label = e.target.value;
                                                        setAboutSections(newArr);
                                                    }} 
                                                    placeholder="Etiket (Örn: EĞİTİMLİ GÖNÜLLÜ)" 
                                                    className="cms-input w-2/3" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ VİZYON & MİSYON ═══ */}
                {activeTab === "vizyon" && (
                    <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
                            <Target size={16} className="text-red-500" /> Vizyon &amp; Misyon Ayarları
                        </h2>
                        <div>
                            <label className="cms-label">Üst Etiket (Örn: Stratejik Doktrin)</label>
                            <input value={vizyonBadge} onChange={e => setVizyonBadge(e.target.value)} className="cms-input" placeholder="Stratejik Doktrin" />
                        </div>
                        <div>
                            <label className="cms-label">Ana Başlık (Örn: ASLA GERİDE BIRAKMA)</label>
                            <textarea rows={2} value={vizyonTitle} onChange={e => setVizyonTitle(e.target.value)} className="cms-input resize-none" placeholder="ASLA GERİDE BIRAKMA" />
                        </div>
                        <div>
                            <label className="cms-label">Giriş / Özet Metni</label>
                            <textarea rows={3} value={vizyonDesc} onChange={e => setVizyonDesc(e.target.value)} className="cms-input resize-none" placeholder="M1G'nin varoluş sebebi..." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="cms-label">Vizyonumuz</label>
                                <textarea rows={6} value={vizyonText} onChange={e => setVizyonText(e.target.value)} className="cms-input resize-none" placeholder="Türkiye'de ve uluslararası arenada..." />
                            </div>
                            <div>
                                <label className="cms-label">Misyonumuz</label>
                                <textarea rows={6} value={misyonText} onChange={e => setMisyonText(e.target.value)} className="cms-input resize-none" placeholder="Doğal afetler, kayıp vakaları..." />
                            </div>
                        </div>
                        <div>
                            <label className="cms-label">Değerlerimiz</label>
                            <p className="text-neutral-500 text-xs mb-3">Sitede listelenecek 4 ana değerimizi buraya yazınız.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i}>
                                        <label className="cms-label text-[10px] text-neutral-500">Değer {i + 1}</label>
                                        <input
                                            value={degerlerList[i] || ""}
                                            onChange={e => {
                                                const newList = [...degerlerList];
                                                newList[i] = e.target.value;
                                                setDegerlerList(newList);
                                            }}
                                            className="cms-input"
                                            placeholder={`Örn: Değer ${i + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


                {/* ═══ FAALİYET RAPORLARI ═══ */}
                {activeTab === "activities" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Activity size={16} className="text-red-500" /> Faaliyet Raporları
                                <span className="text-neutral-600 normal-case font-normal text-[10px] ml-2">— /faaliyetler sayfasında yayınlanır</span>
                            </h2>
                            <button
                                onClick={createNewReport}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                            >
                                <Plus size={14} /> Yeni Rapor
                            </button>
                        </div>

                        {/* DÜZENLEME FORMU */}
                        {editingReport && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#050B14] border-2 border-emerald-500/30 rounded-2xl p-6 space-y-5"
                            >
                                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                    <Edit3 size={14} /> {activityReports.find((r: any) => r.id === editingReport.id) ? "Rapor Düzenle" : "Yeni Rapor Oluştur"}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="cms-label">Dönem Adı</label>
                                        <input
                                            value={editingReport.period}
                                            onChange={e => setEditingReport({ ...editingReport, period: e.target.value })}
                                            className="cms-input" placeholder="Örn: Ocak-Mart 2026"
                                        />
                                    </div>
                                    <div>
                                        <label className="cms-label">Yıl</label>
                                        <input
                                            value={editingReport.year}
                                            onChange={e => setEditingReport({ ...editingReport, year: e.target.value })}
                                            className="cms-input" placeholder="2026"
                                        />
                                    </div>
                                    <div>
                                        <label className="cms-label">Çeyrek</label>
                                        <select
                                            value={editingReport.quarter}
                                            onChange={e => setEditingReport({ ...editingReport, quarter: e.target.value })}
                                            className="cms-input"
                                        >
                                            {REPORT_QUARTERS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="cms-label">Faaliyet Başlığı *</label>
                                        <input
                                            value={editingReport.title}
                                            onChange={e => setEditingReport({ ...editingReport, title: e.target.value })}
                                            className="cms-input" placeholder="Örn: Tatbikat Eğitimi"
                                        />
                                    </div>
                                    <div>
                                        <label className="cms-label">Kategori</label>
                                        <select
                                            value={editingReport.category}
                                            onChange={e => setEditingReport({ ...editingReport, category: e.target.value })}
                                            className="cms-input"
                                        >
                                            {REPORT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="cms-label">Kısa Özet</label>
                                    <textarea
                                        rows={2}
                                        value={editingReport.summary}
                                        onChange={e => setEditingReport({ ...editingReport, summary: e.target.value })}
                                        className="cms-input resize-none" placeholder="Listelemede görünecek kısa açıklama..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="cms-label flex items-center gap-1"><Calendar size={10} /> Tarih</label>
                                        <input
                                            type="date"
                                            value={editingReport.date}
                                            onChange={e => setEditingReport({ ...editingReport, date: e.target.value })}
                                            className="cms-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="cms-label flex items-center gap-1"><MapPin size={10} /> Konum</label>
                                        <input
                                            value={editingReport.location}
                                            onChange={e => setEditingReport({ ...editingReport, location: e.target.value })}
                                            className="cms-input" placeholder="Örn: Bolu Abant"
                                        />
                                    </div>
                                    <div>
                                        <label className="cms-label flex items-center gap-1"><Users size={10} /> Katılımcı Sayısı</label>
                                        <input
                                            value={editingReport.participants}
                                            onChange={e => setEditingReport({ ...editingReport, participants: e.target.value })}
                                            className="cms-input" placeholder="Örn: 25"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="cms-label">Detaylı Açıklama</label>
                                    <textarea
                                        rows={6}
                                        value={editingReport.details}
                                        onChange={e => setEditingReport({ ...editingReport, details: e.target.value })}
                                        className="cms-input resize-none leading-relaxed" placeholder="Faaliyetin ayrıntılı açıklaması..."
                                    />
                                </div>

                                {/* Fotoğraf Yükleme */}
                                <div>
                                    <label className="cms-label flex items-center gap-1"><ImageIcon size={10} /> Fotoğraflar</label>
                                    <label className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-blue-500/40 rounded-xl cursor-pointer transition-all group mb-3">
                                        <Plus size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                        <div>
                                            <p className="text-white text-xs font-bold">Fotoğraf Ekle</p>
                                            <p className="text-neutral-500 text-[10px]">Birden fazla seçebilirsiniz</p>
                                        </div>
                                        <input type="file" accept="image/*" multiple onChange={handleReportPhotoUpload} className="hidden" />
                                    </label>
                                    {editingReport.photos?.length > 0 && (
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                            {editingReport.photos.map((p: string, i: number) => (
                                                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
                                                    <img src={p} alt={`Foto ${i+1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => removeReportPhoto(i)}
                                                        className="absolute top-1 right-1 p-1 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={10} className="text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Kaydet / İptal */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={saveReport}
                                        disabled={!editingReport.title}
                                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors disabled:opacity-30"
                                    >
                                        <CheckCircle size={14} /> Raporu Kaydet
                                    </button>
                                    <button
                                        onClick={() => setEditingReport(null)}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-neutral-400 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                                    >
                                        İptal
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* MEVCUT RAPORLAR LİSTESİ */}
                        <div className="space-y-3">
                            <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                                Yayınlanan Raporlar ({activityReports.length})
                            </h3>
                            {activityReports.length === 0 && (
                                <div className="text-center py-12 border border-dashed border-white/5 rounded-xl">
                                    <FileText size={28} className="mx-auto text-neutral-700 mb-3" />
                                    <p className="text-neutral-600 text-xs">Henüz faaliyet raporu eklenmedi.</p>
                                    <p className="text-neutral-700 text-[10px] mt-1">"Yeni Rapor" butonuna tıklayarak başlayın.</p>
                                </div>
                            )}
                            {activityReports.map((report: any) => {
                                const catLabel = REPORT_CATEGORIES.find(c => c.value === report.category)?.label || report.category;
                                return (
                                    <div key={report.id} className="flex items-center gap-4 bg-[#050B14] border border-white/5 hover:border-white/10 p-4 rounded-xl transition-colors">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                            <Activity size={16} className="text-red-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-bold text-sm truncate">{report.title}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                <span className="text-neutral-500 text-[10px] font-bold uppercase">{report.period || report.year}</span>
                                                <span className="text-neutral-700 text-[10px]">•</span>
                                                <span className="text-neutral-500 text-[10px]">{catLabel}</span>
                                                {report.photos?.length > 0 && (
                                                    <>
                                                        <span className="text-neutral-700 text-[10px]">•</span>
                                                        <span className="text-neutral-500 text-[10px]">{report.photos.length} fotoğraf</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => setEditingReport({ ...report })}
                                                className="p-2 hover:bg-blue-500/10 text-neutral-500 hover:text-blue-400 rounded-lg transition-colors"
                                                title="Düzenle"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={() => deleteReport(report.id)}
                                                className="p-2 hover:bg-red-500/10 text-neutral-600 hover:text-red-400 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* GALERİ YÖNETİMİ */}
                        <div className="pt-8 border-t border-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                    <ImageIcon size={16} className="text-red-500" /> Faaliyet Galerisi
                                </h2>
                                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl cursor-pointer transition-colors">
                                    <Plus size={14} /> Yeni Resim Ekle
                                    <input type="file" accept="image/*" onChange={handleGalleryPhotoUpload} className="hidden" />
                                </label>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activityGallery.map((item) => (
                                    <div key={item.id} className="bg-[#050B14] border border-white/10 rounded-xl overflow-hidden p-4 space-y-3">
                                        <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-black relative border border-white/5">
                                            <img src={item.photo.url} className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => setActivityGallery(activityGallery.filter(g => g.id !== item.id))}
                                                className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div>
                                            <label className="cms-label">Resim İsmi / Başlık</label>
                                            <input value={item.common} onChange={e => updateGalleryItem(item.id, "common", e.target.value)} className="cms-input" placeholder="Fotoğrafın adı veya içeriği..." />
                                        </div>
                                        <div>
                                            <label className="cms-label">Alt Başlık (İtalik)</label>
                                            <input value={item.binomial || ""} onChange={e => updateGalleryItem(item.id, "binomial", e.target.value)} className="cms-input" placeholder="Ek bilgi..." />
                                        </div>
                                        <div>
                                            <label className="cms-label">Ekleyen / Fotoğrafçı</label>
                                            <input value={item.photo.by || ""} onChange={e => updateGalleryItem(item.id, "by", e.target.value)} className="cms-input" placeholder="İsim..." />
                                        </div>
                                    </div>
                                ))}
                                {activityGallery.length === 0 && (
                                    <div className="col-span-full text-center py-12 border border-dashed border-white/5 rounded-xl">
                                        <ImageIcon size={28} className="mx-auto text-neutral-700 mb-3" />
                                        <p className="text-neutral-600 text-xs">Galeriye henüz resim eklenmemiş.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ GÖNÜLLÜ OL ═══ */}
                {activeTab === "volunteer" && (
                    <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
                            <HeartHandshake size={16} className="text-red-500" /> "Gönüllü Ol" Bölümü
                        </h2>
                        <div>
                            <label className="cms-label">Ana Başlık</label>
                            <input value={volunteerTitle} onChange={e => setVolunteerTitle(e.target.value)} className="cms-input" />
                        </div>
                        <div>
                            <label className="cms-label">Alt Metin / Açıklama</label>
                            <textarea rows={4} value={volunteerSubtitle} onChange={e => setVolunteerSubtitle(e.target.value)} className="cms-input resize-none" />
                        </div>
                    </div>
                )}

                {/* ═══ DESTEKÇİLER ═══ */}
                {activeTab === "sponsors" && (
                    <div className="space-y-6">
                        <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2 mb-6">
                                <Star size={16} className="text-red-500" /> Yeni Destekçi Ekle
                            </h2>
                            <form onSubmit={handleAddSponsor} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="cms-label">Kurum / Firma Adı</label>
                                        <input name="sponsorName" required className="cms-input" placeholder="Örn: Acıbadem Sağlık" />
                                    </div>
                                    <div>
                                        <label className="cms-label">Sponsorluk Kapsamı</label>
                                        <input name="sponsorRole" required className="cms-input" placeholder="Örn: Medikal destek" />
                                    </div>
                                </div>
                                <div>
                                    <label className="cms-label flex items-center gap-1"><ImageIcon size={12} /> Logo Dosyası Yükle</label>
                                    <input type="file" accept="image/*" onChange={handleSponsorLogoUpload} className="cms-file-input" />
                                    {newSponsorLogo && (
                                        <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-black">
                                            <img src={newSponsorLogo} alt="Önizleme" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <button type="submit" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2 transition-colors">
                                    <Plus size={14} /> Listeye Ekle
                                </button>
                            </form>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Mevcut Destekçiler ({sponsors.length})</h3>
                            {sponsors.map(s => (
                                <div key={s.id} className="flex items-center justify-between bg-[#050B14] border border-white/5 p-4 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-black rounded-lg border border-white/10 flex items-center justify-center overflow-hidden">
                                            {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-contain" /> : <ImageIcon size={16} className="text-neutral-600" />}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">{s.name}</p>
                                            <p className="text-neutral-500 text-xs">{s.role}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSponsors(sponsors.filter(sp => sp.id !== s.id))} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {sponsors.length === 0 && <p className="text-neutral-600 text-xs italic">Destekçi bulunmuyor.</p>}
                        </div>
                    </div>
                )}

                {/* ═══ CANLI BRİFİNG ═══ */}
                {activeTab === "live" && (
                    <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 border-dashed border-red-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-3xl rounded-full pointer-events-none" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2 relative z-10">
                            <Megaphone size={16} className="text-red-500" /> Üye Portalı — Canlı Brifing & Kriz Masası
                        </h2>
                        <div className="relative z-10">
                            <label className="cms-label">Yayın Modu</label>
                            <select value={liveSessionMode} onChange={e => setLiveSessionMode(e.target.value)} className="cms-input font-bold">
                                <option value="offline">OFFLINE (Beklemede)</option>
                                <option value="active">ONLINE (Alarm / Aktif Brifing)</option>
                            </select>
                        </div>
                        <div className="relative z-10">
                            <label className="cms-label">Toplantı Başlığı / Konusu</label>
                            <input value={liveSessionTitle} onChange={e => setLiveSessionTitle(e.target.value)} className="cms-input" />
                        </div>
                        <div className="relative z-10">
                            <label className="cms-label">Katılım Linki (Zoom / Meet)</label>
                            <input value={liveSessionUrl} onChange={e => setLiveSessionUrl(e.target.value)} className="cms-input font-mono text-sm" placeholder="https://zoom.us/j/..." />
                        </div>
                    </div>
                )}

                {/* ═══ DUYURULAR ═══ */}
                {activeTab === "announcements" && (() => {
                    // Duyuru form yardımcıları (IIFE ile izole scope)
                    const isEditing = !!editingAnnouncement?.id;
                    const canSave = editingAnnouncement?.title?.trim() && editingAnnouncement?.summary?.trim();

                    const resetForm = () => setEditingAnnouncement({
                        id: "", title: "", summary: "", category: "Duyuru",
                        date: new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }),
                        image: ""
                    });

                    const handleSaveAnn = async () => {
                        if (!canSave) return;
                        let updated: any[];
                        if (isEditing) {
                            updated = announcements.map((a: any) => a.id === editingAnnouncement.id ? editingAnnouncement : a);
                        } else {
                            updated = [{ ...editingAnnouncement, id: Date.now().toString() }, ...announcements];
                        }
                        setAnnouncements(updated);
                        // Anında kaydet
                        try {
                            const r = await fetch("/api/settings", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ announcements: updated }),
                            });
                            if (!r.ok) throw new Error(await r.text());
                            resetForm();
                        } catch (err) {
                            alert("Duyuru kaydedilemedi: " + String(err));
                        }
                    };

                    return (
                        <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
                                <Newspaper size={16} className="text-red-500" /> Duyuru / Haber Yönetimi
                            </h2>
                            <p className="text-neutral-500 text-xs">Eklenen duyurular anasayfa slider'ında görüntülenir ve her kayıtta anında yayına girer.</p>

                            {/* Form */}
                            <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                        {isEditing ? "Duyuru Düzenle" : "Yeni Duyuru Ekle"}
                                    </h3>
                                    {isEditing && (
                                        <button onClick={resetForm} className="text-[10px] text-neutral-500 hover:text-white underline transition-colors">
                                            Yeni Duyuruya Geç
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="cms-label">Başlık *</label>
                                        <input
                                            value={editingAnnouncement?.title || ""}
                                            onChange={e => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                                            className="cms-input"
                                            placeholder="Duyuru başlığı..."
                                        />
                                    </div>
                                    <div>
                                        <label className="cms-label">Kategori</label>
                                        <select
                                            value={editingAnnouncement?.category || "Duyuru"}
                                            onChange={e => setEditingAnnouncement({ ...editingAnnouncement, category: e.target.value })}
                                            className="cms-input"
                                        >
                                            {ANNOUNCEMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="cms-label">Özet *</label>
                                    <textarea
                                        value={editingAnnouncement?.summary || ""}
                                        onChange={e => setEditingAnnouncement({ ...editingAnnouncement, summary: e.target.value })}
                                        className="cms-input"
                                        rows={3}
                                        placeholder="Duyuru özet metni..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="cms-label">Tarih</label>
                                        <input
                                            value={editingAnnouncement?.date || ""}
                                            onChange={e => setEditingAnnouncement({ ...editingAnnouncement, date: e.target.value })}
                                            className="cms-input"
                                            placeholder="01 Ocak 2026"
                                        />
                                    </div>
                                    <div>
                                        <label className="cms-label">Görsel URL (opsiyonel)</label>
                                        <input
                                            value={editingAnnouncement?.image || ""}
                                            onChange={e => setEditingAnnouncement({ ...editingAnnouncement, image: e.target.value })}
                                            className="cms-input"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={handleSaveAnn}
                                        disabled={!canSave}
                                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors disabled:opacity-40 flex items-center gap-2"
                                    >
                                        <Save size={13} /> {isEditing ? "Güncelle & Yayınla" : "Ekle & Yayınla"}
                                    </button>
                                    {isEditing && (
                                        <button onClick={resetForm} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-neutral-400 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors">
                                            İptal
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Mevcut Duyurular Listesi */}
                            {announcements.length > 0 ? (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Mevcut Duyurular ({announcements.length})</h3>
                                    {announcements.map((ann: any) => (
                                        <div key={ann.id} className="bg-black/30 border border-white/5 rounded-xl p-4 flex items-start gap-4 hover:border-white/10 transition-colors">
                                            {ann.image && (
                                                <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
                                                    <img src={ann.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded">{ann.category}</span>
                                                    <span className="text-neutral-600 text-[10px]">{ann.date}</span>
                                                </div>
                                                <h4 className="text-white text-sm font-bold truncate">{ann.title}</h4>
                                                <p className="text-neutral-500 text-xs line-clamp-1">{ann.summary}</p>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => setEditingAnnouncement({ ...ann })}
                                                    className="p-2 bg-white/5 hover:bg-blue-500/20 text-neutral-400 hover:text-blue-400 rounded-lg transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const updated = announcements.filter((a: any) => a.id !== ann.id);
                                                        setAnnouncements(updated);
                                                        await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ announcements: updated }) });
                                                    }}
                                                    className="p-2 bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded-lg transition-colors"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                                    <Newspaper size={32} className="mx-auto text-neutral-700 mb-3" />
                                    <p className="text-neutral-500 text-xs">Henüz duyuru eklenmedi. Formu kullanarak ilk duyurunuzu oluşturun.</p>
                                </div>
                            )}
                        </div>
                    );
                })()}


                {/* ═══ ETKİNLİK TAKVİMİ ═══ */}
                {activeTab === "calendar" && (
                    <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
                            <Calendar size={16} className="text-red-500" /> Etkinlik Takvimi Yönetimi
                        </h2>
                        
                        <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-4">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                {editingEvent ? "Etkinlik Düzenle" : "Yeni Etkinlik Ekle"}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="cms-label">Başlık</label>
                                    <input
                                        value={editingEvent?.title || ""}
                                        onChange={e => setEditingEvent({ ...(editingEvent || { id: "", type: "egitim", date: "", location: "", mandatory: false }), title: e.target.value })}
                                        className="cms-input" placeholder="Etkinlik başlığı..."
                                    />
                                </div>
                                <div>
                                    <label className="cms-label">Kategori</label>
                                    <select
                                        value={editingEvent?.type || "egitim"}
                                        onChange={e => setEditingEvent({ ...(editingEvent || { id: "", title: "", date: "", location: "", mandatory: false }), type: e.target.value })}
                                        className="cms-input"
                                    >
                                        {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{EVENT_CAT_LABELS[c]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="cms-label">Tarih</label>
                                    <input
                                        type="date"
                                        value={editingEvent?.date || ""}
                                        onChange={e => setEditingEvent({ ...(editingEvent || { id: "", title: "", type: "egitim", location: "", mandatory: false }), date: e.target.value })}
                                        className="cms-input"
                                    />
                                </div>
                                <div>
                                    <label className="cms-label">Konum</label>
                                    <input
                                        value={editingEvent?.location || ""}
                                        onChange={e => setEditingEvent({ ...(editingEvent || { id: "", title: "", type: "egitim", date: "", mandatory: false }), location: e.target.value })}
                                        className="cms-input" placeholder="Konum / Tesis..."
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    id="mandatoryCheck"
                                    checked={editingEvent?.mandatory || false}
                                    onChange={e => setEditingEvent({ ...(editingEvent || { id: "", title: "", type: "egitim", date: "", location: "" }), mandatory: e.target.checked })}
                                    className="w-4 h-4 rounded border-white/20 bg-black/50 text-red-500 focus:ring-red-500 focus:ring-offset-0"
                                />
                                <label htmlFor="mandatoryCheck" className="text-sm text-neutral-300">Bu katılım zorunludur (Sarı Uyarı Gösterir)</label>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        if (!editingEvent?.title || !editingEvent?.date) return;
                                        if (editingEvent.id) {
                                            setCalendarEvents(calendarEvents.map(e => e.id === editingEvent.id ? editingEvent : e));
                                        } else {
                                            setCalendarEvents([{ ...editingEvent, id: Date.now().toString() }, ...calendarEvents]);
                                        }
                                        setEditingEvent(null);
                                    }}
                                    disabled={!editingEvent?.title || !editingEvent?.date}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Plus size={14} /> {editingEvent?.id ? "Güncelle" : "Ekle"}
                                </button>
                                {editingEvent && (
                                    <button
                                        onClick={() => setEditingEvent(null)}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-neutral-400 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
                                    >
                                        İptal
                                    </button>
                                )}
                            </div>
                        </div>

                        {calendarEvents.length > 0 && (
                            <div className="space-y-3">
                                {calendarEvents.map(ev => (
                                    <div key={ev.id} className="flex items-center justify-between bg-black/30 border border-white/5 p-4 rounded-xl">
                                        <div>
                                            <p className="text-white font-bold text-sm flex items-center gap-2">
                                                {ev.title} {ev.mandatory && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase">Zorunlu</span>}
                                            </p>
                                            <p className="text-neutral-500 text-xs mt-1">{ev.date} • {EVENT_CAT_LABELS[ev.type] || ev.type} • {ev.location}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setEditingEvent(ev)} className="p-2 hover:bg-white/10 text-neutral-500 hover:text-blue-400 rounded-lg"><Edit3 size={14} /></button>
                                            <button onClick={() => setCalendarEvents(calendarEvents.filter(e => e.id !== ev.id))} className="p-2 hover:bg-red-500/10 text-neutral-500 hover:text-red-400 rounded-lg"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ OPERASYONLAR ═══ */}
                {activeTab === "operations" && (
                    <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
                            <Target size={16} className="text-red-500" /> Operasyonlar Yönetimi
                        </h2>
                        
                        <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-4">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                {editingOp ? "Operasyon Düzenle" : "Yeni Operasyon Ekle"}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="cms-label">Başlık / Operasyon Adı</label>
                                    <input
                                        value={editingOp?.title || ""}
                                        onChange={e => setEditingOp({ ...(editingOp || { id: "", type: "arama-kurtarma", status: "tamamlandi", date: "", location: "", summary: "" }), title: e.target.value })}
                                        className="cms-input" placeholder="Örn: Asrın Felaketi..."
                                    />
                                </div>
                                <div>
                                    <label className="cms-label">Kategori</label>
                                    <select
                                        value={editingOp?.type || "arama-kurtarma"}
                                        onChange={e => setEditingOp({ ...(editingOp || { id: "", title: "", status: "tamamlandi", date: "", location: "", summary: "" }), type: e.target.value })}
                                        className="cms-input"
                                    >
                                        {OP_TYPES.map(c => <option key={c} value={c}>{OP_TYPE_LABELS[c]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="cms-label">Durum</label>
                                    <select
                                        value={editingOp?.status || "tamamlandi"}
                                        onChange={e => setEditingOp({ ...(editingOp || { id: "", title: "", type: "arama-kurtarma", date: "", location: "", summary: "" }), status: e.target.value })}
                                        className="cms-input"
                                    >
                                        {OP_STATUSES.map(c => <option key={c} value={c}>{OP_STATUS_LABELS[c]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="cms-label">Tarih</label>
                                    <input
                                        type="date"
                                        value={editingOp?.date || ""}
                                        onChange={e => setEditingOp({ ...(editingOp || { id: "", title: "", type: "arama-kurtarma", status: "tamamlandi", location: "", summary: "" }), date: e.target.value })}
                                        className="cms-input"
                                    />
                                </div>
                                <div>
                                    <label className="cms-label">Konum / Bölge</label>
                                    <input
                                        value={editingOp?.location || ""}
                                        onChange={e => setEditingOp({ ...(editingOp || { id: "", title: "", type: "arama-kurtarma", status: "tamamlandi", date: "", summary: "" }), location: e.target.value })}
                                        className="cms-input" placeholder="Bölge / Şehir..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="cms-label">Kısa Açıklama</label>
                                    <textarea
                                        value={editingOp?.summary || ""}
                                        onChange={e => setEditingOp({ ...(editingOp || { id: "", title: "", type: "arama-kurtarma", status: "tamamlandi", date: "", location: "" }), summary: e.target.value })}
                                        className="cms-input" rows={2}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        if (!editingOp?.title || !editingOp?.date) return;
                                        if (editingOp.id) {
                                            setOperations(operations.map(o => o.id === editingOp.id ? editingOp : o));
                                        } else {
                                            setOperations([{ ...editingOp, id: Date.now().toString() }, ...operations]);
                                        }
                                        setEditingOp(null);
                                    }}
                                    disabled={!editingOp?.title || !editingOp?.date}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Plus size={14} /> {editingOp?.id ? "Güncelle" : "Ekle"}
                                </button>
                                {editingOp && (
                                    <button
                                        onClick={() => setEditingOp(null)}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-neutral-400 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
                                    >
                                        İptal
                                    </button>
                                )}
                            </div>
                        </div>

                        {operations.length > 0 && (
                            <div className="space-y-3">
                                {operations.map(op => (
                                    <div key={op.id} className="flex items-center justify-between bg-black/30 border border-white/5 p-4 rounded-xl">
                                        <div>
                                            <p className="text-white font-bold text-sm flex items-center gap-2">
                                                {op.title}
                                                {op.status === "devam" && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Devam Ediyor" />}
                                            </p>
                                            <p className="text-neutral-500 text-xs mt-1">{op.date} • {OP_TYPE_LABELS[op.type] || op.type} • {op.location}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setEditingOp(op)} className="p-2 hover:bg-white/10 text-neutral-500 hover:text-blue-400 rounded-lg"><Edit3 size={14} /></button>
                                            <button onClick={() => setOperations(operations.filter(o => o.id !== op.id))} className="p-2 hover:bg-red-500/10 text-neutral-500 hover:text-red-400 rounded-lg"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ SOSYAL MEDYA ═══ */}
                {activeTab === "social" && (
                    <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
                            <Globe size={16} className="text-red-500" /> Sosyal Medya ve İletişim
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="cms-label">Web Sitesi</label>
                                <input value={socialMedia.website} onChange={e => setSocialMedia({...socialMedia, website: e.target.value})} className="cms-input" placeholder="https://..." />
                            </div>
                            <div>
                                <label className="cms-label">WhatsApp Numara Linki</label>
                                <input value={socialMedia.whatsapp} onChange={e => setSocialMedia({...socialMedia, whatsapp: e.target.value})} className="cms-input" placeholder="https://wa.me/90555..." />
                            </div>
                            <div>
                                <label className="cms-label">E-Posta</label>
                                <input value={socialMedia.email} onChange={e => setSocialMedia({...socialMedia, email: e.target.value})} className="cms-input" placeholder="mailto:..." />
                            </div>
                            <div>
                                <label className="cms-label">Instagram Profil URL</label>
                                <input value={socialMedia.instagram} onChange={e => setSocialMedia({...socialMedia, instagram: e.target.value})} className="cms-input" placeholder="https://instagram.com/..." />
                            </div>
                            <div>
                                <label className="cms-label">Twitter / X Profil URL</label>
                                <input value={socialMedia.twitter} onChange={e => setSocialMedia({...socialMedia, twitter: e.target.value})} className="cms-input" placeholder="https://x.com/..." />
                            </div>
                            <div>
                                <label className="cms-label">YouTube Kanal URL</label>
                                <input value={socialMedia.youtube} onChange={e => setSocialMedia({...socialMedia, youtube: e.target.value})} className="cms-input" placeholder="https://youtube.com/..." />
                            </div>
                            <div>
                                <label className="cms-label">Facebook Sayfa URL</label>
                                <input value={socialMedia.facebook} onChange={e => setSocialMedia({...socialMedia, facebook: e.target.value})} className="cms-input" placeholder="https://facebook.com/..." />
                            </div>
                        </div>
                    </div>
                )}

                </motion.div>
            </AnimatePresence>
                </div>
            </div>

            {/* ALT KAYDET BUTONU */}
            <div className="pt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className={`flex items-center gap-2 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${saved
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
                    } disabled:opacity-50`}
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : saved ? <CheckCircle size={18} /> : <Save size={18} />}
                    {loading ? "Kaydediliyor..." : saved ? "Tüm Değişiklikler Kaydedildi!" : "Değişiklikleri Siteye Yayınla"}
                </button>
            </div>

            <style jsx>{`
                :global(.cms-label) {
                    display: block;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: rgb(115 115 115);
                    margin-bottom: 6px;
                }
                :global(.cms-input) {
                    width: 100%;
                    background: #020617;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 10px;
                    padding: 10px 14px;
                    color: white;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                :global(.cms-input:focus) {
                    border-color: rgb(239 68 68);
                }
                :global(.cms-file-input) {
                    width: 100%;
                    background: #020617;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 10px;
                    padding: 8px 12px;
                    color: rgba(255,255,255,0.5);
                    font-size: 12px;
                    cursor: pointer;
                }
                :global(.cms-file-input::file-selector-button) {
                    margin-right: 12px;
                    padding: 4px 12px;
                    border-radius: 999px;
                    border: 0;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    background: rgba(239,68,68,0.1);
                    color: rgb(239 68 68);
                    cursor: pointer;
                }
                :global(.cms-file-input::file-selector-button:hover) {
                    background: rgba(239,68,68,0.2);
                }
            `}</style>
        </div>
    );
}
