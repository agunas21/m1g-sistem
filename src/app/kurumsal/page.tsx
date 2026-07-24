"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
    Building2, 
    FileText, 
    ShieldCheck, 
    Radio, 
    Shirt, 
    AlertOctagon, 
    Scale, 
    CheckCircle2, 
    BookOpen, 
    Download,
    Crosshair,
    Users,
    Loader2
} from "lucide-react";
import toast from "react-hot-toast";

export default function KurumsalPage() {
    const [activeTab, setActiveTab] = useState<"tuzuk" | "operasyon" | "kkd" | "disiplin" | "haberlesme">("tuzuk");
    const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

    // Dynamic PDF generator for each official document
    const handleDownloadPdf = async (docType: "tuzuk" | "operasyon" | "kkd" | "disiplin" | "haberlesme") => {
        try {
            setDownloadingDoc(docType);
            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

            const titleMap = {
                tuzuk: "M1G ARAMA KURTARMA DERNEĞİ TÜZÜĞÜ (KÜTÜK NO: 35-084-076)",
                operasyon: "M1G ARAMA KURTARMA DERNEĞİ OPERASYON YÖNETMELİĞİ",
                kkd: "M1G KIYAFET VE KİŞİSEL KORUYUCU DONANIM (KKD) YÖNETMELİĞİ",
                disiplin: "M1G DİSİPLİN KURULU YÖNETMELİĞİ",
                haberlesme: "M1G HABERLEŞME KURULU WHATSAPP GRUPLARI KULLANIM YÖNETMELİĞİ"
            };

            const fileNameMap = {
                tuzuk: "M1G_Dernek_Tuzugu_35-084-076.pdf",
                operasyon: "M1G_Operasyon_Yonetmeligi.pdf",
                kkd: "M1G_Kiyafet_ve_KKD_Yonetmeligi.pdf",
                disiplin: "M1G_Disiplin_Kurulu_Yonetmeligi.pdf",
                haberlesme: "M1G_Whatsapp_Haberlesme_Yonetmeligi.pdf"
            };

            // Header Banner
            doc.setFillColor(180, 20, 20);
            doc.rect(0, 0, 210, 25, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("M1G ARAMA & KURTARMA DERNEGI", 105, 12, { align: "center" });
            doc.setFontSize(10);
            doc.text("RESMI KURUMSAL YAZILI MEVZUAT BELGESI", 105, 19, { align: "center" });

            // Document Title
            doc.setTextColor(20, 20, 20);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(titleMap[docType], 105, 35, { align: "center" });
            doc.setLineWidth(0.5);
            doc.setDrawColor(200, 200, 200);
            doc.line(15, 39, 195, 39);

            let contentText: string[] = [];

            if (docType === "tuzuk") {
                contentText = [
                    "KUTUK NO: 35-084-076 | IZMIR",
                    "Dogrulama Kodu: 709986dd-432b-4fdf-abb9-df9e79934780",
                    "Dogrulama Linki: https://derbis.dernekler.gov.tr/default/anonymous/barkodlu-tuzuk-anonim",
                    "",
                    "MADDE 1: DERNEGIN ADI",
                    "Dernegin adi 'M1G ARAMA KURTARMA DERNEGI'dir. Kisa adi 'M1G'dir. Dernek amblemi, logosu ve kurumsal kimligi dernege aittir.",
                    "",
                    "MADDE 2: DERNEGIN MERKEZI",
                    "Dernek merkezi Izmir'dedir. Yurt icinde ve yurt disinda sube veya temsilcilikler acabilir.",
                    "",
                    "MADDE 3: DERNEGIN AMACI",
                    "Iklim degisikligi kaynakli afetler dahil her turlu afetlerde, orman yanginlarinda, doga sporlarinda yasanan kazalarda veya arama-kurtarma gerektiren tum olaylarda arama-kurtarma ve ilkyardim calismalari yapmak, kamuya destek vermektir.",
                    "",
                    "MADDE 4: CALISMA KONULARI VE ILKELERI",
                    "- Dag ve doga kosullarinda arama kurtarma faaliyetleri yurutmek.",
                    "- Gonulluluk, dürüstluk, guvenilirlik ve seffaflik ilkelerine bagli kalmak.",
                    "- Dernek hicbir sekilde siyasetle ugrasamaz.",
                    "- Amator Telsizcilik mevzugina uygun haberlesme altyapisi kurmak.",
                    "",
                    "MADDE 5-10: UYELIK, HAKLAR VE YUKUMLULUKLER",
                    "- 18 yasini doldurmus, dernek tuzugunu benimsemis her kisi üye olabilir.",
                    "- Uye 3 yil aktif hizmet verdikten sonra Genel Kurulda oy kullanma hakki kazanir.",
                    "",
                    "MADDE 11-20: DERNEK ORGANLARI VE YONETIM",
                    "- Genel Kurul, Yonetim Kurulu (7 Asil, 5 Yedek) ve Denetim Kurulu (3 Asil, 3 Yedek)'ndan olusur.",
                    "- Genel Kurul 3 yilda bir Mart ayinda toplanir."
                ];
            } else if (docType === "operasyon") {
                contentText = [
                    "ARAMA KURTARMA DERNEGI OPERASYON YONETMELIGI (M1G-YNT-01)",
                    "Dayanak: 5253 sayili Dernekler Kanunu ve 7126 sayili Sivil Savunma Kanunu.",
                    "",
                    "BIRINCI BOLUM: AMAC, KAPSAM VE TANIMLAR",
                    "Madde 1-4: Tum afet, acil durum, arama-kurtarma, ilk yardım ve lojistik faaliyetlerini kapsar.",
                    "Ekip Lideri: Operasyonun sahadaki en yetkili kisisi.",
                    "Tim Lideri: 6'sar kisilik takimlarin yonetici lideri.",
                    "Lojistik Sorumlusu: Malzeme, ulasim ve destek hizmetlerinden sorumlu kisi.",
                    "",
                    "IKINCI BOLUM: OPERASYONLARIN PLANLANMASI VE KOORDINASYONU",
                    "Madde 5: Dernek her an goreve cikabilecek sekilde hazir bulunur. Her yil en az 2 tatbikat zorunludur.",
                    "Madde 6: Operasyon karari Baskan veya Operasyon Koordinatörü tarafindan alinir. AFAD/Valilik koordinasyonu sarttir.",
                    "Madde 7: Sahada gorev dagilimi: Ekip Lideri, Tim Liderleri, Tibbi Destek Sorumlusu, Arama Ekibi, Kurtarma Ekibi, Lojistik Sorumlusu.",
                    "",
                    "UCUNCU BOLUM: OPERASYON ESNASINDA UYULACAK KURALLAR",
                    "Madde 9: Kişisel Koruyucu Ekipman (KKD) zorunludur. Eksik donanimli personel sahaya cikarilmaz.",
                    "Madde 10: Sahada izinsiz fotograf/video cekimi ve emir disi hareket yasaktir.",
                    "Madde 12: Tum ekipman zimmetle teslim edilir, kullanildiktan sonra tutanakla geri alinir."
                ];
            } else if (docType === "kkd") {
                contentText = [
                    "KIYAFET VE KISEL KORUYUCU DONANIM (KKD) YONETMELIGI (M1G-YNT-02)",
                    "Dayanak: Is Sagligi ve Guvenligi mevzugi ile Dernek Tuzugu.",
                    "",
                    "RESMI VE OPERASYONEL KIYAFET STANDARTLARI",
                    "Günlük/Temsil Kıyafeti: Siyah/Kirmizi polo tişort veya siyah taktik gomlek, siyah/bej pantolon, kirmizi dernek yelegi.",
                    "Operasyonel Kıyafet: Alev almaz ve yirtilmaya dayanikli bej renkli operasyon tulumu veya takimı. Uzerinde dernek logosu, isimlik ve sırt M1G patchi.",
                    "",
                    "ZORUNLU KISISEL KORUYUCU DONANIMLAR (KKD)",
                    "- Beyaz Baret (EN 397 standardinda, dernek logosu ile)",
                    "- Çelik burunlu ve kaymaz tabanli is botu",
                    "- Eldiven (kesilmeye ve soğuğa dayanikli)",
                    "- Darbeye dayanikli gozluk + partikul filtreli maske",
                    "- Yüksek görünürlük yelegi, düdük, kafa feneri, emniyet kemeri",
                    "",
                    "DENETIM VE SORUMLULUK",
                    "Her uye zimmetli donanimindan sorumludur. Operasyon oncesi tim liderleri KKD kontrolu yapar."
                ];
            } else if (docType === "disiplin") {
                contentText = [
                    "DISIPLIN KURULU YONETMELIGI (M1G-YNT-03)",
                    "",
                    "DISIPLIN KURULUNUN OLUSUMU",
                    "Disiplin Kurulu, Yonetim Kurulu tarafindan secilen 3 asil ve 3 yedek üyeden olusur.",
                    "",
                    "DISIPLIN SUCLARI (MADDE 5)",
                    "1. Dernek tuzugune, yonetmeliklere aykiri davranislar.",
                    "2. Dernegin itibarini zedeleyici soz, davranis veya paylasimlar.",
                    "3. Zimmetli dernek malina zarar vermek veya teslim etmemek.",
                    "4. Ekip calismasini bozacak saygisiz veya tehditkar tutumlar.",
                    "5. Dernek adina yetkisiz aciklama veya yazisma yapmak.",
                    "",
                    "DISIPLIN CEZALARI (MADDE 6)",
                    "1. Uyari, 2. Kinama, 3. Gecici Uzaklastirma (1-12 ay), 4. Kesin Cikarma.",
                    "",
                    "SORUSTURMA USULU VE ITIRAZ",
                    "Hakkinda sorusturma acilan üyeye 3 ila 15 gun arasi yazili savunma hakki verilir.",
                    "Disiplin kararlarina karsi 15 gun icinde Yonetim Kurulu'na itiraz edilebilir."
                ];
            } else if (docType === "haberlesme") {
                contentText = [
                    "HABERLESME KURULU WHATSAPP GRUPLARI KULLANIM YONETMELIGI (M1G-YNT-04)",
                    "",
                    "1. GRUPLAR",
                    "a. M1G DUYURU GRUBU: Sadece YK tarafindan yetkilendirilmis sozculere aciktir.",
                    "b. M1G GENEL GRUBU: Tum dernek üyelerine aciktir.",
                    "c. M1G YONETIM KURULU GRUBU: Sadece YK üyelerine aciktir.",
                    "d. M1G ALT KURULLAR GRUPLARI: Ilgili kurul üyelerine aciktir.",
                    "",
                    "2. GRUPLARIN AMACI VE DISIPLINI",
                    "Gruplar sadece arama kurtarma, egitim, tatbikat ve resmi duyurular icindir.",
                    "Sohbet, siyasi/dini icerik ve polemik kesinlikle paylasilamaz.",
                    "",
                    "3. MESAJ VE PAYLASIM DUZENI",
                    "Gereksiz sticker, emoji, uzun alinti ve spam mesaj gonderilemez.",
                    "Acil durumlar harici mesajlasmalar 08:00 - 23:00 saatleri arasinda yapilir.",
                    "Grup icinde paylasilan gizli operasyonel bilgiler 3. kisilerle paylasilamaz."
                ];
            }

            // Print lines into PDF
            let y = 48;
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(40, 40, 40);

            contentText.forEach((line) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                if (line.startsWith("MADDE") || line.startsWith("RESMI") || line.startsWith("ZORUNLU") || line.startsWith("BIRINCI") || line.startsWith("IKINCI") || line.startsWith("UCUNCU") || line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.")) {
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(180, 20, 20);
                } else {
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(40, 40, 40);
                }
                doc.text(line, 15, y);
                y += 6;
            });

            // Footer signoff
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.text("M1G Arama Kurtarma Dernegi Resmi Yonetmelik Belgesi - https://m1g.org.tr", 105, 285, { align: "center" });

            doc.save(fileNameMap[docType]);
            toast.success("PDF belgesi başarıyla indirildi.");
        } catch (err) {
            console.error(err);
            toast.error("PDF oluşturulurken hata oluştu.");
        } finally {
            setDownloadingDoc(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] pt-32 pb-24 relative overflow-hidden text-neutral-200">
            {/* Topographic background grid */}
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
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">KURUMSAL VE YAZILI MEVZUAT</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight mb-6 max-w-4xl mx-auto leading-none"
                    >
                        M1G Arama Kurtarma Derneği <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                            Tüzük ve Yönetmelikleri
                        </span>
                    </motion.h1>

                    <p className="text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                        T.C. İçişleri Bakanlığı Sivil Toplumla İlişkiler Genel Müdürlüğü onaylı resmi dernek tüzüğümüz ve operasyonel yönetmeliklerimiz. Belge başlıklarından PDF olarak indirebilirsiniz.
                    </p>
                </div>

                {/* 📥 HIZLI PDF İNDİRME KARTLARI BÖLÜMÜ */}
                <div className="mb-12 bg-gradient-to-b from-[#0b1324] to-[#050b14] p-6 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                        <div className="flex items-center gap-3">
                            <Download size={20} className="text-red-500" />
                            <h2 className="text-base font-black text-white uppercase tracking-widest">İNDİRİLEBİLİR RESMİ BELGELER VE YÖNETMELİKLER</h2>
                        </div>
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2.5 py-1 rounded font-mono font-bold border border-red-500/30">
                            5 RESMİ BELGE HAZIR
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <button
                            onClick={() => handleDownloadPdf("tuzuk")}
                            disabled={downloadingDoc === "tuzuk"}
                            className="bg-[#050B14] hover:bg-[#0f172a] border border-white/10 hover:border-red-500/50 p-4 rounded-2xl transition-all text-left group flex flex-col justify-between h-36"
                        >
                            <div>
                                <span className="text-[9px] font-mono text-red-400 font-bold">KÜTÜK NO: 35-084-076</span>
                                <h3 className="text-xs font-bold text-white uppercase mt-1 group-hover:text-red-400 transition-colors line-clamp-2">
                                    Resmi Dernek Tüzüğü
                                </h3>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                                {downloadingDoc === "tuzuk" ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                PDF İndir (34 Madde)
                            </div>
                        </button>

                        <button
                            onClick={() => handleDownloadPdf("operasyon")}
                            disabled={downloadingDoc === "operasyon"}
                            className="bg-[#050B14] hover:bg-[#0f172a] border border-white/10 hover:border-red-500/50 p-4 rounded-2xl transition-all text-left group flex flex-col justify-between h-36"
                        >
                            <div>
                                <span className="text-[9px] font-mono text-amber-400 font-bold">M1G-YNT-01</span>
                                <h3 className="text-xs font-bold text-white uppercase mt-1 group-hover:text-amber-400 transition-colors line-clamp-2">
                                    Operasyon Yönetmeliği
                                </h3>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                                {downloadingDoc === "operasyon" ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                PDF İndir (18 Madde)
                            </div>
                        </button>

                        <button
                            onClick={() => handleDownloadPdf("kkd")}
                            disabled={downloadingDoc === "kkd"}
                            className="bg-[#050B14] hover:bg-[#0f172a] border border-white/10 hover:border-red-500/50 p-4 rounded-2xl transition-all text-left group flex flex-col justify-between h-36"
                        >
                            <div>
                                <span className="text-[9px] font-mono text-emerald-400 font-bold">M1G-YNT-02</span>
                                <h3 className="text-xs font-bold text-white uppercase mt-1 group-hover:text-emerald-400 transition-colors line-clamp-2">
                                    Kıyafet & KKD Yönetmeliği
                                </h3>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                {downloadingDoc === "kkd" ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                PDF İndir (12 Madde)
                            </div>
                        </button>

                        <button
                            onClick={() => handleDownloadPdf("disiplin")}
                            disabled={downloadingDoc === "disiplin"}
                            className="bg-[#050B14] hover:bg-[#0f172a] border border-white/10 hover:border-red-500/50 p-4 rounded-2xl transition-all text-left group flex flex-col justify-between h-36"
                        >
                            <div>
                                <span className="text-[9px] font-mono text-purple-400 font-bold">M1G-YNT-03</span>
                                <h3 className="text-xs font-bold text-white uppercase mt-1 group-hover:text-purple-400 transition-colors line-clamp-2">
                                    Disiplin Yönetmeliği
                                </h3>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                                {downloadingDoc === "disiplin" ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                PDF İndir (11 Madde)
                            </div>
                        </button>

                        <button
                            onClick={() => handleDownloadPdf("haberlesme")}
                            disabled={downloadingDoc === "haberlesme"}
                            className="bg-[#050B14] hover:bg-[#0f172a] border border-white/10 hover:border-red-500/50 p-4 rounded-2xl transition-all text-left group flex flex-col justify-between h-36"
                        >
                            <div>
                                <span className="text-[9px] font-mono text-blue-400 font-bold">M1G-YNT-04</span>
                                <h3 className="text-xs font-bold text-white uppercase mt-1 group-hover:text-blue-400 transition-colors line-clamp-2">
                                    WhatsApp & İletişim
                                </h3>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                {downloadingDoc === "haberlesme" ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                PDF İndir (7 Madde)
                            </div>
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex flex-wrap justify-center gap-2 mb-12 bg-black/40 p-2 rounded-2xl border border-white/10 max-w-5xl mx-auto backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab("tuzuk")}
                        className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "tuzuk"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <FileText size={16} /> Resmi Dernek Tüzüğü
                    </button>
                    <button
                        onClick={() => setActiveTab("operasyon")}
                        className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "operasyon"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <ShieldCheck size={16} /> Operasyon Yönetmeliği
                    </button>
                    <button
                        onClick={() => setActiveTab("kkd")}
                        className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "kkd"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Shirt size={16} /> Kıyafet & KKD Yönetmeliği
                    </button>
                    <button
                        onClick={() => setActiveTab("disiplin")}
                        className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "disiplin"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Scale size={16} /> Disiplin Yönetmeliği
                    </button>
                    <button
                        onClick={() => setActiveTab("haberlesme")}
                        className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "haberlesme"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Radio size={16} /> Haberleşme & WhatsApp
                    </button>
                </div>

                {/* Tab Content Display */}
                <div className="bg-[#050b14] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
                    
                    {/* TAB 1: DERNEK TÜZÜĞÜ */}
                    {activeTab === "tuzuk" && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <span className="text-xs text-red-500 font-mono font-bold tracking-widest uppercase">KÜTÜK NO: 35-084-076</span>
                                    <h2 className="text-2xl font-black text-white uppercase mt-1">M1G ARAMA KUTARMA DERNEĞİ TÜZÜĞÜ</h2>
                                    <p className="text-xs text-neutral-400 mt-1">T.C. İçişleri Bakanlığı Barkodlu Onay Kodu: 709986dd-432b-4fdf-abb9-df9e79934780</p>
                                </div>
                                <button
                                    onClick={() => handleDownloadPdf("tuzuk")}
                                    disabled={downloadingDoc === "tuzuk"}
                                    className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                                >
                                    {downloadingDoc === "tuzuk" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    Tüzüğü PDF Olarak İndir
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-3">
                                    <h3 className="text-red-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                        <BookOpen size={14} /> Madde 1-3: Dernek Adı, Merkezi ve Amacı
                                    </h3>
                                    <p className="text-neutral-300 leading-relaxed text-xs">
                                        Derneğin adı <strong className="text-white">M1G ARAMA KURTARMA DERNEĞİ</strong>'dir. Kısa adı <strong className="text-white">M1G</strong>'dir. Dernek merkezi İzmir'dedir.
                                    </p>
                                    <p className="text-neutral-300 leading-relaxed text-xs">
                                        <strong>Amacı:</strong> İklim değişikliği kaynaklı afetler dahil her türlü afetlerde, orman yangınlarında, doğa sporlarında yaşanan kazalarda veya arama-kurtarma gerektiren tüm olaylarda arama-kurtarma ve ilkyardım çalışmaları yapmak, kamuya destek vermektir.
                                    </p>
                                </div>

                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-3">
                                    <h3 className="text-red-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                        <Crosshair size={14} /> Madde 4: Çalışma Konuları & İlkeleri
                                    </h3>
                                    <ul className="list-disc list-inside text-neutral-300 text-xs space-y-1">
                                        <li>Gönüllülük ve Karşılıksız Yardımseverlik esastır.</li>
                                        <li>Tüm canlıların hayatına değer verme, dürüstlük ve güvenilirlik.</li>
                                        <li>Şeffaflık hususlarına azami dikkat gösterilir.</li>
                                        <li>Dernek hiçbir şekilde siyasetle uğraşamaz.</li>
                                        <li>Amatör telsizcilik mevzuatına uygun haberleşme ağları tesis edilir.</li>
                                    </ul>
                                </div>

                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-3">
                                    <h3 className="text-red-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                        <Users size={14} /> Madde 5-10: Üyelik & Hak/Yükümlülükler
                                    </h3>
                                    <p className="text-neutral-300 leading-relaxed text-xs">
                                        Fiil ehliyetine sahip, dernek tüzüğünü benimsemiş 18 yaşını doldurmuş her gerçek kişi derneğe başvurabilir. 3 yıl aktif gönüllü olarak görev yapan üyeler Genel Kurulda oy kullanma hakkı kazanır.
                                    </p>
                                </div>

                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-3">
                                    <h3 className="text-red-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                        <Building2 size={14} /> Madde 11-20: Dernek Organları & Yönetim
                                    </h3>
                                    <p className="text-neutral-300 leading-relaxed text-xs">
                                        Dernek ana organları: Genel Kurul, Yönetim Kurulu (7 Asil, 5 Yedek) ve Denetim Kurulu (3 Asil, 3 Yedek)'dur. Genel Kurul 3 yılda bir Mart ayında toplanır.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 2: OPERASYON YÖNETMELİĞİ */}
                    {activeTab === "operasyon" && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <span className="text-xs text-red-500 font-mono font-bold tracking-widest uppercase">YÖNETMELİK KODU: M1G-YNT-01</span>
                                    <h2 className="text-2xl font-black text-white uppercase mt-1">ARAMA KURTARMA DERNEĞİ OPERASYON YÖNETMELİĞİ</h2>
                                    <p className="text-xs text-neutral-400 mt-1">5253 sayılı Dernekler Kanunu ve 7126 sayılı Sivil Savunma Kanunu dayanağıyla hazırlanmıştır.</p>
                                </div>
                                <button
                                    onClick={() => handleDownloadPdf("operasyon")}
                                    disabled={downloadingDoc === "operasyon"}
                                    className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
                                >
                                    {downloadingDoc === "operasyon" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    Yönetmeliği PDF Olarak İndir
                                </button>
                            </div>

                            <div className="space-y-6 text-sm">
                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-2">
                                    <h3 className="text-white font-bold text-sm">Madde 5-6: Operasyonel Hazırlık & Görev Alımı</h3>
                                    <p className="text-neutral-300 text-xs leading-relaxed">
                                        Dernek, her an göreve çıkabilecek şekilde ekip, araç, gereç ve malzeme bakımından hazırlıklı bulunur. Her yıl en az 2 tatbikat (1 masa başı, 1 saha) yapılması zorunludur. Resmi kurumlar (AFAD, Valilik, Kaymakamlık vb.) ile koordinasyon sağlanmadan sahaya çıkılamaz.
                                    </p>
                                </div>

                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-2">
                                    <h3 className="text-white font-bold text-sm">Madde 7: Sahada Görev Dağılımı Mimarisi</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                                        <div className="bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl text-center text-red-400 font-bold">Ekip Lideri</div>
                                        <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-center text-amber-400 font-bold">Tim Liderleri (6'şar Kişi)</div>
                                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-center text-emerald-400 font-bold">Tıbbi Destek Sorumlusu</div>
                                        <div className="bg-blue-500/10 border border-blue-500/30 p-2.5 rounded-xl text-center text-blue-400 font-bold">Lojistik & İletişim Sorumlusu</div>
                                    </div>
                                </div>

                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-2">
                                    <h3 className="text-white font-bold text-sm">Madde 9-12: Disiplin, KKD ve Medya Çekim Kuralları</h3>
                                    <ul className="list-disc list-inside text-neutral-300 text-xs space-y-1">
                                        <li>Tüm üyeler Kişisel Koruyucu Ekipman (KKD) kullanmakla yükümlüdür. Eksik donanımlı personel operasyona çıkarılmaz.</li>
                                        <li>Operasyon sahasında yetkisiz hareket, emir dışına çıkma ve <strong className="text-red-400">izinsiz fotoğraf/video çekimi kesinlikle yasaktır</strong>.</li>
                                        <li>Yaralıya tıbbi müdahale sadece sertifikalı sağlık personeli tarafından yapılır.</li>
                                        <li>Tüm ekipman zimmetle teslim edilir, kullanıldıktan sonra tutanakla geri alınır.</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 3: KIYAFET VE KKD YÖNETMELİĞİ */}
                    {activeTab === "kkd" && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <span className="text-xs text-red-500 font-mono font-bold tracking-widest uppercase">YÖNETMELİK KODU: M1G-YNT-02</span>
                                    <h2 className="text-2xl font-black text-white uppercase mt-1">KIYAFET VE KİŞİSEL KORUYUCU DONANIM (KKD) YÖNETMELİĞİ</h2>
                                    <p className="text-xs text-neutral-400 mt-1">İş Sağlığı ve Güvenliği mevzuatı ile dernek tüzüğüne dayanılarak hazırlanmıştır.</p>
                                </div>
                                <button
                                    onClick={() => handleDownloadPdf("kkd")}
                                    disabled={downloadingDoc === "kkd"}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
                                >
                                    {downloadingDoc === "kkd" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    Yönetmeliği PDF Olarak İndir
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-3">
                                    <h3 className="text-amber-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                        <Shirt size={16} /> Resmî & Operasyonel Kıyafet Standartları
                                    </h3>
                                    <div className="space-y-2 text-xs text-neutral-300">
                                        <div><strong className="text-white">Temsil Kıyafeti:</strong> Dernek logoslu siyah/kırmızı polo tişört, siyah taktik gömlek, siyah/bej pantolon, kırmızı dernek yeleği.</div>
                                        <div><strong className="text-white">Operasyon Tulumu:</strong> Alev almaz ve yırtılmaya dayanıklı bej renkli operasyon tulumu veya pantolon-ceket takımı.</div>
                                        <div><strong className="text-white">Arma & Patch:</strong> Göğüste isimlik ve görev patchi, sırt kısmında M1G reflektif patchi.</div>
                                    </div>
                                </div>

                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-3">
                                    <h3 className="text-amber-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                        <ShieldCheck size={16} /> Zorunlu Kişisel Koruyucu Donanımlar
                                    </h3>
                                    <ul className="list-disc list-inside text-neutral-300 text-xs space-y-1 font-mono">
                                        <li>Beyaz Baret (EN 397 standartında, dernek logosu ile)</li>
                                        <li>Çelik Burunlu ve Kaymaz Tabanlı İş Botu</li>
                                        <li>Kesilmeye & Delinmeye Dayanıklı Eldiven</li>
                                        <li>Toz ve Darbeye Dayanıklı Gözlük + Partikül Filtreli Maske</li>
                                        <li>Yüksek görünürlük yeleği, düdük, kafa feneri, emniyet kemeri</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 4: DİSİPLİN YÖNETMELİĞİ */}
                    {activeTab === "disiplin" && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <span className="text-xs text-red-500 font-mono font-bold tracking-widest uppercase">YÖNETMELİK KODU: M1G-YNT-03</span>
                                    <h2 className="text-2xl font-black text-white uppercase mt-1">DİSİPLİN KURULU YÖNETMELİĞİ</h2>
                                    <p className="text-xs text-neutral-400 mt-1">Dernek içi çalışma düzenini, etik ilkelere uyumu ve soruşturma usullerini kapsar.</p>
                                </div>
                                <button
                                    onClick={() => handleDownloadPdf("disiplin")}
                                    disabled={downloadingDoc === "disiplin"}
                                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
                                >
                                    {downloadingDoc === "disiplin" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    Yönetmeliği PDF Olarak İndir
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-3">
                                    <h3 className="text-purple-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                        <AlertOctagon size={16} /> Disiplin Suçları (Madde 5)
                                    </h3>
                                    <ul className="list-disc list-inside text-neutral-300 text-xs space-y-1">
                                        <li>Dernek tüzüğüne ve yönetmeliklere aykırı davranışlar.</li>
                                        <li>Derneğin onur ve itibarını zedeleyici paylaşım ve sözler.</li>
                                        <li>Zimmetli dernek malına zarar vermek veya teslim etmemek.</li>
                                        <li>Ekip çalışmasını bozacak saygısız, tehditkar tavırlar.</li>
                                        <li>Dernek adına yetkisiz açıklama ve yazışma yapmak.</li>
                                    </ul>
                                </div>

                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-3">
                                    <h3 className="text-purple-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                        <Scale size={16} /> Disiplin Cezaları & İtiraz Usulü
                                    </h3>
                                    <div className="space-y-2 text-xs text-neutral-300">
                                        <div><strong className="text-white">Cezalar:</strong> Uyarı, Kınama, Geçici Uzaklaştırma (1-12 ay) ve Kesin Çıkarma.</div>
                                        <div><strong className="text-white">Savunma Hakkı:</strong> Hakkında soruşturma açılan kişiye 3 ila 15 gün arasında yazılı savunma süresi tanınır.</div>
                                        <div><strong className="text-white">İtiraz:</strong> Üyeler tebliğden itibaren 15 gün içinde Yönetim Kurulu'na itiraz hakkına sahiptir.</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 5: HABERLEŞME & WHATSAPP YÖNETMELİĞİ */}
                    {activeTab === "haberlesme" && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <span className="text-xs text-red-500 font-mono font-bold tracking-widest uppercase">YÖNETMELİK KODU: M1G-YNT-04</span>
                                    <h2 className="text-2xl font-black text-white uppercase mt-1">HABERLEŞME KURULU WHATSAPP GRUPLARI KULLANIM YÖNETMELİĞİ</h2>
                                    <p className="text-xs text-neutral-400 mt-1">Dernek içi bilgi akışını, güvenliği ve acil durum iletişim disiplinini düzenler.</p>
                                </div>
                                <button
                                    onClick={() => handleDownloadPdf("haberlesme")}
                                    disabled={downloadingDoc === "haberlesme"}
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
                                >
                                    {downloadingDoc === "haberlesme" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    Yönetmeliği PDF Olarak İndir
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-3">
                                    <h3 className="text-blue-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                        <Radio size={16} /> Resmi İletişim Grupları
                                    </h3>
                                    <ul className="text-xs text-neutral-300 space-y-2">
                                        <li><strong className="text-white">a. M1G DUYURU GRUBU:</strong> Sadece YK tarafından yetkilendirilmiş sözcülere açıktır.</li>
                                        <li><strong className="text-white">b. M1G GENEL GRUBU:</strong> Tüm dernek üyelerine açıktır.</li>
                                        <li><strong className="text-white">c. M1G YÖNETİM KURULU GRUBU:</strong> Sadece YK üyelerinin kullanımındadır.</li>
                                        <li><strong className="text-white">d. M1G ALT KURULLAR GRUPLARI:</strong> İlgili kurul ve sorumlu YK üyesine açıktır.</li>
                                    </ul>
                                </div>

                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-3">
                                    <h3 className="text-blue-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                        <CheckCircle2 size={16} /> Mesajlaşma Kuralları & İhlas Esasları
                                    </h3>
                                    <ul className="list-disc list-inside text-neutral-300 text-xs space-y-1">
                                        <li>Gruplarda sohbet, siyaset, din veya gündelik içerikler <strong className="text-red-400">kesinlikle paylaşılamaz</strong>.</li>
                                        <li>Gereksiz sticker, emoji, tebrik ve büyük harfle mesaj yazılması yasaktır.</li>
                                        <li>Acil durumlar haricindeki genel mesajlaşmalar 08:00 - 23:00 saatleri arasındadır.</li>
                                        <li>Grup içinde paylaşılan veriler ve operasyonel gizli bilgiler 3. kişilerle paylaşılamaz.</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </div>
            </div>
        </div>
    );
}
