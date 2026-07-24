"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    ExternalLink,
    Crosshair,
    Users,
    Flame
} from "lucide-react";

export default function KurumsalPage() {
    const [activeTab, setActiveTab] = useState<"tuzuk" | "operasyon" | "kkd" | "disiplin" | "haberlesme">("tuzuk");

    return (
        <div className="min-h-screen bg-[#020617] pt-32 pb-24 relative overflow-hidden text-neutral-200">
            {/* Dark topographic grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Page Header */}
                <div className="text-center mb-16">
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
                        T.C. İçişleri Bakanlığı Sivil Toplumla İlişkiler Genel Müdürlüğü onaylı resmi dernek tüzüğümüz ve operasyonel disiplin yönetmeliklerimiz.
                    </p>
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
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                                    <CheckCircle2 size={16} /> RESMİ ONAYLI METİN
                                </div>
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
                                        <strong>Amacı:</strong> İklim değişikliği kaynaklı afetler dahil her türlü afetlerde, orman yangınlarında, doğa sporlarında yaşanan kazalarda arama-kurtarma gerektiren tüm olaylarda arama-kurtarma ve ilkyardım çalışmaları yapmak, kamuya destek vermektir.
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
                                        <li>Amatör telsizcilik mevzuatı doğrultusunda haberleşme ağları tesis edilir.</li>
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
                            <div className="border-b border-white/10 pb-6">
                                <span className="text-xs text-red-500 font-mono font-bold tracking-widest uppercase">YÖNETMELİK KODU: M1G-YNT-01</span>
                                <h2 className="text-2xl font-black text-white uppercase mt-1">ARAMA KURTARMA DERNEĞİ OPERASYON YÖNETMELİĞİ</h2>
                                <p className="text-xs text-neutral-400 mt-1">5253 sayılı Dernekler Kanunu ve 7126 sayılı Sivil Savunma Kanunu dayanağıyla hazırlanmıştır.</p>
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
                                        <li>Tüm ekipman zimmetle teslim edilir, kullanımdan sonra tutanakla geri alınır.</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 3: KIYAFET VE KKD YÖNETMELİĞİ */}
                    {activeTab === "kkd" && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className="border-b border-white/10 pb-6">
                                <span className="text-xs text-red-500 font-mono font-bold tracking-widest uppercase">YÖNETMELİK KODU: M1G-YNT-02</span>
                                <h2 className="text-2xl font-black text-white uppercase mt-1">KIYAFET VE KİŞİSEL KORUYUCU DONANIM (KKD) YÖNETMELİĞİ</h2>
                                <p className="text-xs text-neutral-400 mt-1">İş Sağlığı ve Güvenliği mevzuatı ile dernek tüzüğüne dayanılarak hazırlanmıştır.</p>
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
                                        <li>Düdük + Kafa Feneri + Emniyet Kemeri ve Düşüş Önleyici</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 4: DİSİPLİN YÖNETMELİĞİ */}
                    {activeTab === "disiplin" && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className="border-b border-white/10 pb-6">
                                <span className="text-xs text-red-500 font-mono font-bold tracking-widest uppercase">YÖNETMELİK KODU: M1G-YNT-03</span>
                                <h2 className="text-2xl font-black text-white uppercase mt-1">DİSİPLİN KURULU YÖNETMELİĞİ</h2>
                                <p className="text-xs text-neutral-400 mt-1">Dernek içi çalışma düzenini, etik ilkelere uyumu ve soruşturma usullerini kapsar.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-3">
                                    <h3 className="text-purple-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                        <AlertOctagon size={16} /> Disiplin Suçları (Madde 5)
                                    </h3>
                                    <ul className="list-disc list-inside text-neutral-300 text-xs space-y-1">
                                        <li>Dernek tüzüğüne ve yönetmeliklere aykırı davranışlar.</li>
                                        <li>Derneğin onur ve itibarını zedeleyici paylaşım ve sözler.</li>
                                        <li>Zimmetli dernek malına zarar vermek veya geri vermemek.</li>
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
                            <div className="border-b border-white/10 pb-6">
                                <span className="text-xs text-red-500 font-mono font-bold tracking-widest uppercase">YÖNETMELİK KODU: M1G-YNT-04</span>
                                <h2 className="text-2xl font-black text-white uppercase mt-1">HABERLEŞME KURULU WHATSAPP GRUPLARI KULLANIM YÖNETMELİĞİ</h2>
                                <p className="text-xs text-neutral-400 mt-1">Dernek içi bilgi akışını, güvenliği ve acil durum iletişim disiplinini düzenler.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-3">
                                    <h3 className="text-blue-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                        <Radio size={16} /> Resmi İletişim Grupları
                                    </h3>
                                    <ul className="text-xs text-neutral-300 space-y-2">
                                        <li><strong className="text-white">a. M1G DUYURU GRUBU:</strong> Sadece yetkili sözcülerin yazımına açıktır.</li>
                                        <li><strong className="text-white">b. M1G GENEL GRUBU:</strong> Tüm üyelerin yazımına açıktır.</li>
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
