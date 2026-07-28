"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
    Building2, 
    FileText, 
    ShieldCheck, 
    Radio, 
    Shirt, 
    Scale, 
    Download,
    BookOpen,
    ExternalLink,
    CheckCircle2
} from "lucide-react";

export default function KurumsalPage() {
    const [activeTab, setActiveTab] = useState<"tuzuk" | "operasyon" | "kkd" | "disiplin" | "haberlesme">("tuzuk");

    const documents = {
        tuzuk: {
            code: "KÜTÜK NO: 35-084-076",
            title: "M1G ARAMA KURTARMA DERNEĞİ TÜZÜĞÜ (ORİJİNAL DERBİS İMZALI BELGE)",
            file: "/documents/M1G_Dernek_Tuzugu_35-084-076.pdf",
            desc: "T.C. İçişleri Bakanlığı Sivil Toplumla İlişkiler Genel Müdürlüğü onaylı, kütük no 35-084-076 ve 709986dd-432b-4fdf-abb9-df9e79934780 doğrulama kodlu orijinal 24 sayfalık resmi dernek tüzüğü."
        },
        operasyon: {
            code: "M1G-YNT-01",
            title: "ARAMA KURTARMA DERNEĞİ OPERASYON YÖNETMELİĞİ (ORİJİNAL BELGE)",
            file: "/documents/M1G_Operasyon_Yonetmeligi.pdf",
            desc: "5253 sayılı Dernekler Kanunu ve 7126 sayılı Sivil Savunma Kanunu dayanağıyla hazırlanan resmi Operasyon Yönetmeliği orijinal PDF belgesi."
        },
        kkd: {
            code: "M1G-YNT-02",
            title: "KIYAFET VE KİŞİSEL KORUYUCU DONANIM (KKD) YÖNETMELİĞİ (ORİJİNAL BELGE)",
            file: "/documents/M1G_Kiyafet_ve_KKD_Yonetmeligi.pdf",
            desc: "İş Sağlığı ve Güvenliği mevzuatı ile dernek tüzüğüne dayanılarak hazırlanan resmi Kıyafet ve KKD Yönetmeliği orijinal PDF belgesi."
        },
        disiplin: {
            code: "M1G-YNT-03",
            title: "DİSİPLİN KURULU YÖNETMELİĞİ (ORİJİNAL BELGE)",
            file: "/documents/M1G_Disiplin_Kurulu_Yonetmeligi.pdf",
            desc: "M1G Arama Kurtarma Derneği üyelerinin uyacağı etik ilkeler, disiplin suçları ve soruşturma usullerini içeren resmi Disiplin Kurulu Yönetmeliği orijinal PDF belgesi."
        },
        haberlesme: {
            code: "M1G-YNT-04",
            title: "HABERLEŞME KURULU WHATSAPP GRUPLARI KULLANIM YÖNETMELİĞİ (ORİJİNAL BELGE)",
            file: "/documents/M1G_Whatsapp_Haberlesme_Yonetmeligi.pdf",
            desc: "Dernek içi WhatsApp grupları kullanımı, bilgi gizliliği ve acil durum haberleşme disiplinini kapsayan resmi Yönetmelik orijinal PDF belgesi."
        }
    };

    const currentDoc = documents[activeTab];

    return (
        <div className="min-h-screen bg-[#020617] pt-32 pb-24 relative overflow-hidden text-neutral-200">
            {/* Background topographic grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Page Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-500/20 text-red-500 rounded-full mb-6"
                    >
                        <Building2 size={16} className="animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">RESMİ VE ORİJİNAL BELGELER</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight mb-6 max-w-4xl mx-auto leading-none"
                    >
                        M1G Arama Kurtarma Derneği <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                            Orijinal Tüzük ve Yönetmelik Belgeleri
                        </span>
                    </motion.h1>

                    <p className="text-neutral-400 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
                        Aşağıdaki bölümde derneğimize ait tüm resmi yönetmelik ve İçişleri Bakanlığı onaylı dernek tüzüğünün <strong>yüklenen orijinal PDF dosyalarını</strong> görüntüleyebilir ve bilgisayarınıza/telefonunuza indirebilirsiniz.
                    </p>
                </div>

                {/* Direct File Download Grid Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
                    {Object.entries(documents).map(([key, doc]) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key as any)}
                            className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between h-40 ${
                                activeTab === key
                                    ? "bg-gradient-to-b from-red-950/40 to-red-900/20 border-red-500/80 shadow-[0_0_25px_rgba(220,38,38,0.3)]"
                                    : "bg-[#050b14] border-white/10 hover:border-white/20 hover:bg-[#0f172a]"
                            }`}
                        >
                            <div>
                                <span className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-widest">{doc.code}</span>
                                <h3 className="text-xs font-bold text-white uppercase mt-1 line-clamp-2 leading-tight">
                                    {doc.title}
                                </h3>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                                <FileText size={12} />
                                Orijinal PDF Gör
                            </div>
                        </button>
                    ))}
                </div>

                {/* Tabs Navigation */}
                <div className="flex flex-wrap justify-center gap-2 mb-8 bg-black/40 p-2 rounded-2xl border border-white/10 max-w-5xl mx-auto backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab("tuzuk")}
                        className={`px-4 sm:px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "tuzuk"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <FileText size={16} /> Resmi Dernek Tüzüğü (24 Sayfa)
                    </button>
                    <button
                        onClick={() => setActiveTab("operasyon")}
                        className={`px-4 sm:px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "operasyon"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <ShieldCheck size={16} /> Operasyon Yönetmeliği
                    </button>
                    <button
                        onClick={() => setActiveTab("kkd")}
                        className={`px-4 sm:px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "kkd"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Shirt size={16} /> Kıyafet & KKD Yönetmeliği
                    </button>
                    <button
                        onClick={() => setActiveTab("disiplin")}
                        className={`px-4 sm:px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "disiplin"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Scale size={16} /> Disiplin Kurulu Yönetmeliği
                    </button>
                    <button
                        onClick={() => setActiveTab("haberlesme")}
                        className={`px-4 sm:px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "haberlesme"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Radio size={16} /> Haberleşme & WhatsApp
                    </button>
                </div>

                {/* Main Content Area - Orijinal Yüklenen PDF İnceleme ve İndirme */}
                <div className="bg-[#050b14] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
                    <div className="border-b border-white/10 pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <span className="text-xs text-red-500 font-mono font-bold tracking-widest uppercase">{currentDoc.code}</span>
                            <h2 className="text-xl sm:text-2xl font-black text-white uppercase mt-1">{currentDoc.title}</h2>
                            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">{currentDoc.desc}</p>
                            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5 font-bold">
                                <CheckCircle2 size={15} /> Tarafınızdan yüklenen orijinal ıslak imzalı / resmi formatlı PDF dosyasıdır.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <a
                                href={currentDoc.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 md:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <ExternalLink size={14} /> Yeni Sekmede Aç
                            </a>
                            <a
                                href={currentDoc.file}
                                download
                                className="flex-1 md:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                            >
                                <Download size={14} /> Orijinal PDF Dosyasını İndir
                            </a>
                        </div>
                    </div>

                    {/* PDF Preview Frame */}
                    <div className="w-full bg-[#0a0f1d] rounded-2xl overflow-hidden border border-white/10 relative min-h-[600px] sm:min-h-[800px]">
                        <object
                            data={`${currentDoc.file}#toolbar=1&navpanes=1`}
                            type="application/pdf"
                            className="w-full h-[600px] sm:h-[800px]"
                        >
                            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                                <BookOpen size={48} className="text-red-500 mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">PDF Önizleme Yüklenemedi</h3>
                                <p className="text-xs text-neutral-400 max-w-md mb-6">
                                    Tarayıcınız PDF önizlemeyi doğrudan desteklemiyor olabilir. Aşağıdaki butona tıklayarak orijinal dosyayı hemen indirebilirsiniz.
                                </p>
                                <a
                                    href={currentDoc.file}
                                    download
                                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                >
                                    <Download size={16} /> Orijinal PDF İndir ({currentDoc.code})
                                </a>
                            </div>
                        </object>
                    </div>

                </div>

            </div>
        </div>
    );
}
