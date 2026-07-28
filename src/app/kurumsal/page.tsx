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
    Download,
    BookOpen,
    Loader2,
    CheckCircle2,
    Copy,
    Check
} from "lucide-react";
import toast from "react-hot-toast";

export default function KurumsalPage() {
    const [activeTab, setActiveTab] = useState<"tuzuk" | "operasyon" | "kkd" | "disiplin" | "haberlesme">("tuzuk");
    const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
    const [copiedText, setCopiedText] = useState(false);

    // Official Unabridged Content Dictionary
    const officialDocs = {
        disiplin: {
            code: "M1G-YNT-03",
            title: "M1G ARAMA & KURTARMA DERNEĞİ DİSİPLİN KURULU YÖNETMELİĞİ",
            pdfFilename: "M1G_Disiplin_Kurulu_Yonetmeligi_Tam_Metin.pdf",
            sections: [
                {
                    heading: "Amaç ve Kapsam",
                    content: "Madde 1 Bu yönetmelik; M1G Arama Kurtarma Derneği üyelerinin dernek tüzüğü, iç yönergeler ve mevzuata aykırı davranışları karşısında uygulanacak disiplin işlemlerini ve Disiplin Kurulu’nun görev, yetki ve çalışma usullerini düzenler."
                },
                {
                    heading: "Dayanak",
                    content: "Madde 2 Bu yönetmelik, 5253 sayılı Dernekler Kanunu, Türk Medeni Kanunu ve Dernek Tüzüğü hükümlerine dayanılarak hazırlanmıştır."
                },
                {
                    heading: "Disiplin Kurulu’nun Oluşumu",
                    content: "Madde 3\n1. Disiplin Kurulu, Yönetim Kurulu tarafından seçilen 3 asil ve 3 yedek üyeden oluşur.\n2. Kurul, kendi arasından bir başkan ve bir raportör seçer.\n3. Asil üyelerin toplantıya katılamaması halinde yedek üyeler çağrılır."
                },
                {
                    heading: "Disiplin Kurulu’nun Görev ve Yetkileri",
                    content: "Madde 4 Disiplin Kurulu’nun görevleri şunlardır:\n1. Üyeler hakkında gelen şikâyet ve ihbarları incelemek,\n2. Yönetim Kurulu’nun sevk ettiği disiplin dosyalarını görüşmek,\n3. Savunma almak ve karar vermek,\n4. Gerekli gördüğü hallerde üyeye ihtar, geçici uzaklaştırma veya kesin çıkarma teklifinde bulunmak,\n5. Kararları gerekçeli olarak Yönetim Kurulu’na bildirmek."
                },
                {
                    heading: "Disiplin Suçları",
                    content: "Madde 5 Aşağıdaki fiiller disiplin suçu sayılır:\n1. Dernek tüzüğüne, yönetmeliklere veya mevzuata aykırı davranışlar,\n2. Derneğin ve üyelerinin onur ve itibarını zedeleyici söz, davranış veya paylaşımlarda bulunmak,\n3. Görev ve sorumluluklarını ihmal veya kötüye kullanmak,\n4. Dernek malına zarar vermek, zimmetine geçirmek veya usulsüz kullanmak,\n5. Yönetim Kurulu veya Genel Kurul kararlarına aykırı hareket etmek,\n6. Ekip çalışmasını bozacak şekilde saygısız, tehditkâr veya ayrıştırıcı ve ekibi riske sokacak davranışlarda bulunmak,\n7. Dernek adına yetkisiz açıklama, yazışma veya işlem yapmak,\n8. Dernek Yöneticilerinin istemiş olduğu belge ve bilgileri süresi içinde vermemek,\n9. Üzerine zimmetli olan dernek malzemelerinin yönetim tarafından geri istenmesi durumunda teslim etmemek."
                },
                {
                    heading: "Disiplin Cezaları",
                    content: "Madde 6 İşlenen fiilin ağırlığına göre uygulanacak disiplin cezaları:\n1. Uyarı: Hafif nitelikteki aykırı davranışlar için,\n2. Kınama: Tekrarlanan veya derneğin itibarını zedeleyen davranışlar için,\n3. Geçici uzaklaştırma (1-12 ay): Ciddi disiplin ihlallerinde,\n4. Kesin çıkarma: Derneğe ve kamuya zarar veren ağır fiillerde."
                },
                {
                    heading: "Disiplin Soruşturması Usulü",
                    content: "Madde 7\n1. Disiplin soruşturması, Yönetim Kurulu’nun sevki veya doğrudan Disiplin Kurulu’nun tespiti ile başlatılır.\n2. Hakkında soruşturma açılan üyeye yazılı olarak savunma hakkı tanınır. Savunma için en az 3 en fazla 15 gün süre verilir. Süre olayın niteliğine göre Disiplin Kurulu tarafından belirlenir.\n3. Savunmalar Yönetim Kurulu’nun belirleyeceği gibi Noter, whatsapp, e posta veya kısa mesaj vasıtası ile istenebilir.\n4. Savunmalar Yönetim Kurulunun belirleyeceği gibi, Disiplin Kuruluna yazılı olarak verilen süre içerisinde elden, whatsapp, e posta veya kısa mesaj vasıtası ile iletilebilir.\n5. Savunma yapılmazsa, üye savunma hakkından feragat etmiş sayılır.\n6. Disiplin Kurulu, delilleri toplar, tanıkları dinler ve dosyayı görüşerek karar alır."
                },
                {
                    heading: "Kararlar",
                    content: "Madde 8\n1. Kararlar oy çokluğu ile alınır, eşitlik halinde başkanın oyu iki sayılır.\n2. Kararlar gerekçeli olarak yazılır, imzalanır ve Yönetim Kurulu’na sunulur.\n3. Cezalar, Disiplin Kurulu’nun önerisi ve Yönetim Kurulu’nun kararı ile uygulanır."
                },
                {
                    heading: "İtiraz",
                    content: "Madde 9- Disiplin Kurulu kararlarına karşı üyeler, kararın kendilerine tebliğinden itibaren 15 gün içinde Yönetim Kurulu’na itiraz edebilir."
                },
                {
                    heading: "Yürürlük",
                    content: "Madde 10- Bu yönetmelik, Yönetim Kurulu tarafından onaylandığı tarihten itibaren yürürlüğe girer."
                },
                {
                    heading: "Yürütme",
                    content: "Madde 11- Bu yönetmelik hükümlerini Arama Kurtarma Derneği Yönetim Kurulu yürütür.\n\nM1G ARAMA VE KURTARMA DERNEĞİ YÖNETİM KURULU"
                }
            ]
        },
        operasyon: {
            code: "M1G-YNT-01",
            title: "M1G ARAMA & KURTARMA DERNEĞİ OPERASYON YÖNETMELİĞİ",
            pdfFilename: "M1G_Operasyon_Yonetmeligi_Tam_Metin.pdf",
            sections: [
                {
                    heading: "BİRİNCİ BÖLÜM – AMAÇ, KAPSAM, DAYANAK VE TANIMLAR",
                    content: "Madde 1 – Amaç:\nBu yönetmeliğin amacı, Derneğimizin arama kurtarma faaliyetlerinin planlanması, koordinasyonu, icrası ve denetlenmesine dair usul ve esasları düzenlemektir.\n\nMadde 2 – Kapsam:\nBu yönetmelik, Dernek bünyesinde yürütülecek tüm afet, acil durum, arama-kurtarma, ilk yardım ve lojistik faaliyetlerini kapsar.\n\nMadde 3 – Dayanak:\nBu yönetmelik, 5253 sayılı Dernekler Kanunu, 7126 sayılı Sivil Savunma Kanunu ve ilgili mevzuat hükümlerine dayanılarak hazırlanmıştır.\n\nMadde 4 – Tanımlar:\nBu yönetmelikte geçen:\nDernek: M1G Arama Kurtarma Derneği’ni,\nOperasyon: Her türlü arama, kurtarma, ilk yardım, tahliye vb. faaliyetleri,\nEkip Lideri: Operasyonun sahadaki en yetkili kişisini,\nTim Lideri: 6 şar kişilik takımların yönetici liderini,\nLojistik Sorumlusu: Malzeme, ulaşım ve destek hizmetlerinden sorumlu kişiyi,\nGönüllü: Dernek tarafından eğitilmiş, sahada görev alabilen kişiyi,\nifade eder."
                },
                {
                    heading: "İKİNCİ BÖLÜM – OPERASYONLARIN PLANLANMASI VE KOORDİNASYONU",
                    content: "Madde 5 – Operasyonel Hazırlık:\nDernek, her an göreve çıkabilecek şekilde ekip, araç, gereç ve malzeme bakımından hazırlıklı bulunur. Her yıl en az iki tatbikat yapılması zorunludur.\n\nMadde 6 – Görev Alımı ve Yetki:\nOperasyon kararı, Başkan ya da Operasyon Koordinatörü tarafından alınır. Resmi kurumlar (AFAD, Valilik, Kaymakamlık vb.) ile koordinasyon sağlanmadan sahaya çıkılamaz.\n\nMadde 7 – Görev Dağılımı:\nOperasyon sahasında görev dağılımı aşağıdaki gibidir:\n- Ekip Lideri\n- Tim Liderleri\n- Tıbbi Destek Sorumlusu\n- Arama Ekibi\n- Kurtarma Ekibi\n- Lojistik ve Ulaşım Sorumlusu\n- İletişim Sorumlusu\n\nMadde 8 – Bilgi Akışı ve Raporlama:\nTüm operasyonlarda bilgi akışı tek hattan yapılır. Operasyon sonrası en geç 48 saat içinde yazılı rapor hazırlanır."
                },
                {
                    heading: "ÜÇÜNCÜ BÖLÜM – OPERASYON ESNASINDA UYULACAK KURALLAR",
                    content: "Madde 9 – Güvenlik Kuralları:\nTüm ekip üyeleri, kişisel koruyucu ekipman (KKD) kullanmakla yükümlüdür. Güvenlikten taviz verilemez. Eksik donanımlı ve eğitimli personel operasyona çıkartılmaz.\n\nMadde 10 – Disiplin:\nOperasyon sahasında yetkisiz hareket, emir ve görev dışına çıkma, alanda izinsiz fotoğraf/video çekimi yasaktır. Disiplin ihlali durumunda ilgili kişi operasyon dışı bırakılır.\n\nMadde 11 – Tıbbi Müdahale:\nYaralıya müdahale sadece sertifikalı personel tarafından yapılır. Gerekirse 112 Acil Servis ile irtibat kurulur.\n\nMadde 12 – Malzeme Kullanımı:\nTüm ekipman zimmetle teslim edilir, kullanımdan sonra teslim tutanağı ile geri alınır."
                },
                {
                    heading: "DÖRDÜNCÜ BÖLÜM – EĞİTİM, TATBİKAT VE DEĞERLENDİRME",
                    content: "Madde 13 – Eğitim:\nTüm gönüllüler yılda en az bir temel arama kurtarma, ilk yardım ve afet farkındalık eğitimi almak zorundadır.\n\nMadde 14 – Tatbikat:\nDernek, her yıl en az bir masa başı ve bir sahada tatbikat düzenler. Tatbikatlara katılım zorunludur.\n\nMadde 15 – Değerlendirme ve Raporlama:\nHer operasyon ve tatbikat sonrasında, güçlü ve zayıf yönler tespit edilerek gelişim planı hazırlanır."
                },
                {
                    heading: "BEŞİNCİ BÖLÜM – ÇEŞİTLİ VE SON HÜKÜMLER",
                    content: "Madde 16 – İşbirliği:\nDernek, kamu kurumları, diğer STK’lar ve uluslararası organizasyonlarla işbirliği yapabilir.\n\nMadde 17 – Yürürlük:\nBu yönetmelik Dernek Genel Kurulu’nun onayıyla yürürlüğe girer.\n\nMadde 18 – Yürütme:\nBu yönetmeliği Dernek Yönetim Kurulu yürütür.\n\nM1G ARAMA VE KURTARMA DERNEĞİ YÖNETİM KURULU"
                }
            ]
        },
        haberlesme: {
            code: "M1G-YNT-04",
            title: "M1G ARAMA & KURTARMA DERNEĞİ HABERLEŞME KURULU WHATSAPP GRUPLARI KULLANIM YÖNETMELİĞİ",
            pdfFilename: "M1G_Whatsapp_Haberlesme_Yonetmeligi_Tam_Metin.pdf",
            sections: [
                {
                    heading: "Giriş ve Genel İlke",
                    content: "Bu gruplar, dernek üyeleri arasında iletişim, koordinasyon ve bilgi paylaşımı amacıyla kurulmuştur. Bu kurallar, derneğimizin düzenli, güvenli ve etkin iletişim kurmasını sağlamak için hazırlanmıştır.\nTüm üyelerin aşağıdaki kurallara uyması ve sorumluluk bilinciyle hareket etmesi beklenir."
                },
                {
                    heading: "1. GRUPLAR",
                    content: "Tüm grupların yöneticileri Yönetim Kurulu Üyelerinden oluşur.\na. M1G DUYURU GRUBU\ni. Sadece Yönetim Kurulu tarafından yetkilendirilmiş sözcülerin yazımına açıktır.\nb. M1G GENEL GRUBU\ni. Tüm dernek üyelerinin yazımına açıktır.\nc. M1G YÖNETİM KURULU GRUBU\ni. Sadece Yönetim kurulu üyelerinin kullanımına açıktır.\nd. M1G ALT KURULLAR GRUPLARI\ni. Sadece ilgili alt kurul üyeleri ve bu kurullardan sorumlu Yönetim Kurulu Üyesinin kullanımına açıktır."
                },
                {
                    heading: "2. GRUPLARIN AMACI",
                    content: "Gruplar yukarıda açıklanan kişilerin kullanımına açık, sadece arama kurtarma faaliyetleri, eğitimler, tatbikatlar, toplantılar ve resmi duyurular için kullanılacaktır.\nSohbet, gündelik muhabbet, siyasi ve dini içerikler kesinlikle paylaşılmayacaktır."
                },
                {
                    heading: "3. SAYGI VE ÜSLUP",
                    content: "Her üye diğer üyelerine karşı saygılı, seviyeli ve yapıcı bir dil kullanmalıdır.\nHakaret, küçümseme, tartışma ve polemik içeren mesajlara izin verilmez.\nBu tip paylaşımlarda bulunan üyeler gruplardan süresiz çıkartılır, disiplin kuruluna sevk edilebilir."
                },
                {
                    heading: "4. MESAJ VE PAYLAŞIM DÜZENİ",
                    content: "Gereksiz tebrik, emoji, sticker, uzun alıntı ve spam mesajlar gönderilemez.\nMesajlar büyük harf ile yazılamaz.\nMümkün oldukça net, kısa ve anlaşılır mesajlar paylaşılır.\nAcil durumlar harici mesajlaşmalar 08.00-23.00 arası yapılabilir.\nÖnemli duyurular yönetim/ekip liderleri tarafından sabitlenir."
                },
                {
                    heading: "5. BİLGİ VE GİZLİLİK",
                    content: "Grup içinde paylaşılan bilgiler üçüncü kişilerle paylaşılmaz.\nOperasyon, eğitim ve kişisel bilgiler gizlidir. İzinsiz paylaşım disiplin sürecine neden olur."
                },
                {
                    heading: "6. ACİL DURUM İLETİŞİMİ",
                    content: "Operasyon/olay anında grup sadece koordinasyon ve acil bilgilendirme amacıyla kullanılır.\nGereksiz yazışmalar yapılmaz."
                },
                {
                    heading: "7. YÖNETİM VE DİSİPLİN",
                    content: "Grup yöneticileri, düzeni sağlamak için gerekli gördüğü durumda uyarı yapabilir, uygunsuz mesajı silebilir veya üyeyi gruptan çıkarabilir.\nAçılacak anketler, katılım teyidi, görev alacak personel bilgisi kısa ve net şekilde yazılır. Bu bilgileri vermeyenlere Disiplin Kurulu Yönetmeliğinin ilgili maddesinden işlem başlatılır.\nHerhangi bir şekilde yetkisi olmadığı halde, bu gruplarda işlem yapanlar ve kurallara uymayanlar hakkında M1G Arama ve Kurtarma Derneği Disiplin Kurulu Yönetmeliği işletilir.\n\nM1G ARAMA VE KURTARMA DERNEĞİ YÖNETİM KURULU"
                }
            ]
        },
        kkd: {
            code: "M1G-YNT-02",
            title: "M1G ARAMA & KURTARMA DERNEĞİ KIYAFET VE KİŞİSEL KORUYUCU DONANIM (KKD) YÖNETMELİĞİ",
            pdfFilename: "M1G_Kiyafet_ve_KKD_Yonetmeligi_Tam_Metin.pdf",
            sections: [
                {
                    heading: "BİRİNCİ BÖLÜM – Amaç, Kapsam, Dayanak ve Tanımlar",
                    content: "Madde 1 – Amaç:\nBu yönetmeliğin amacı, Arama Kurtarma Derneği üyelerinin operasyon, tatbikat ve eğitimlerde kullanacağı kıyafet ve kişisel koruyucu donanımın standartlarını, kullanım esaslarını ve sorumluluklarını düzenlemektir.\n\nMadde 2 – Kapsam:\nBu yönetmelik, dernek üyesi tüm gönüllü ve personelin; görev, eğitim ve resmi temsil sırasında giyeceği kıyafetler ile kullanacağı kişisel koruyucu donanımları kapsar.\n\nMadde 3 – Dayanak:\nBu yönetmelik, 5253 sayılı Dernekler Kanunu, İş Sağlığı ve Güvenliği mevzuatı ve dernek tüzüğüne dayanılarak hazırlanmıştır.\n\nMadde 4 – Tanımlar:\nDernek: M1G Arama Kurtarma Derneği,\nÜye: Derneğin aktif üyesi ve gönüllüsü,\nKKD: Kişisel Koruyucu Donanım,\nOperasyonel Kıyafet: Sahada kullanılan resmi kıyafet,\nTemsil Kıyafeti: Resmi toplantı, tören, basın açıklaması vb. durumlarda kullanılan kıyafet."
                },
                {
                    heading: "İKİNCİ BÖLÜM – Kıyafet ve Donanım Standartları",
                    content: "Madde 5 – Resmî ve Operasyonel Kıyafetler:\nGünlük/Temsil Kıyafeti:\nDernek logosu bulunan siyah veya kırmızı polo yaka tişört veya siyah taktik gömlek,\nSiyah veya bej pantolon,\nKırmızı dernek yeleği.\n\nOperasyonel Kıyafet (Saha Kullanımı):\nAlev almaz ve yırtılmaya dayanıklı kumaştan üretilmiş bej renkli operasyon tulumu veya pantolon-ceket takımı,\nÜzerinde dernek logosu, isimlik ve görev patchi, sırtında M1G patchi,\nReflektif şeritli, görünürlüğü yüksek.\n\nMadde 6 – Kişisel Koruyucu Donanım (KKD):\nOperasyonlarda her üyenin aşağıdaki donanımları kullanması zorunludur:\n- Beyaz Baret (EN 397 standardına uygun, dernek logosu ile),\n- Çelik burunlu ve kaymaz tabanlı iş botu,\n- Eldiven (kesilmeye, delinmeye ve soğuğa karşı uygun),\n- Gözlük (toz ve darbeye dayanıklı),\n- Maske (toz ve partikül filtreli),\n- Yüksek görünürlük yeleği (reflektörlü),\n- Düdük ve kafa feneri,\n- Gerekli durumlarda emniyet kemeri, ip ve düşüş önleyici sistemler."
                },
                {
                    heading: "ÜÇÜNCÜ BÖLÜM – Kullanım, Sorumluluk ve Denetim",
                    content: "Madde 7 – Kullanım Esasları:\nKıyafet ve KKD, yalnızca görev, eğitim ve temsil amaçlı kullanılabilir.\nGörev dışı özel kullanım kesinlikle yasaktır.\nKıyafetler temiz, düzenli ve dernek itibarına uygun şekilde kullanılmalıdır.\n\nMadde 8 – Sorumluluk:\nHer üye, kendisine zimmetlenen kıyafet ve donanımın korunmasından sorumludur.\nKaybolan, zarar gören veya uygunsuz kullanılan ekipman durumunda disiplin işlemi uygulanabilir.\nKullanılamayacak durumda olan ekipman derneğe bildirilerek yenisi talep edilmelidir.\n\nMadde 9 – Denetim:\nOperasyon öncesi ve sonrası ekip lideri veya tim liderleri kıyafet ve KKD kontrolü yapar.\nEksik veya uygunsuz KKD ile sahaya çıkan üyeler görevlendirilmez."
                },
                {
                    heading: "DÖRDÜNCÜ BÖLÜM – Çeşitli Hükümler",
                    content: "Madde 10 – Ceza Hükümleri:\nBu yönetmeliğe aykırı hareket eden üyeler hakkında disiplin kurulu hükümleri uygulanır.\n\nMadde 11 – Yürürlük:\nBu yönetmelik, Yönetim Kurulunun onayı ile yürürlüğe girer.\n\nMadde 12 – Yürütme:\nBu yönetmelik hükümlerini Dernek Yönetim Kurulu yürütür.\n\nM1G ARAMA VE KURTARMA DERNEĞİ YÖNETİM KURULU"
                }
            ]
        },
        tuzuk: {
            code: "KÜTÜK NO: 35-084-076",
            title: "M1G ARAMA KURTARMA DERNEĞİ TÜZÜĞÜ (RESMİ 34 MADDE DERBİS TAM METNİ)",
            pdfFilename: "M1G_Dernek_Tuzugu_35-084-076_Tam_Metin.pdf",
            sections: [
                {
                    heading: "Resmi Dernek Tüzüğü Bilgileri",
                    content: "M1G ARAMA ve KURTARMA DERNEĞİ\nKütük No: 35-084-076\nİçişleri Bakanlığı DERBİS Doğrulama Kodu: 709986dd-432b-4fdf-abb9-df9e79934780\nDoğrulama Linki: https://derbis.dernekler.gov.tr/default/anonymous/barkodlu-tuzuk-anonim"
                },
                {
                    heading: "Madde 1- DERNEĞİN ADI",
                    content: "Derneğin adı; M1G ARAMA KURTARMA DERNEĞİ'dir. Kısa adı M1G'dir. Amblemi, logosu, kurumsal kimliği, kıyafet ve üniformaları derneğe aittir. Bu unsurların başka bir kişi, dernek veya organizasyon tarafından kullanılması için Yönetim Kurulunun yazılı izni gerekir. İzinsiz kullanım halinde Dernek Yönetim Kurulu hukuki ve cezai işlem başlatma yetkisine sahiptir."
                },
                {
                    heading: "Madde 2- DERNEĞİN MERKEZİ",
                    content: "Dernek merkezi İzmir'dedir. Dernek, Genel Kurul Kararı ile yurt içinde ve yurt dışında şube ve/veya irtibat bürosu ve/veya temsilcilikler açabilir, yurt dışında Dernek ve/veya üst kuruluş kurabilir. Dernek, Yönetim Kurulu Kararı ile uluslararası faaliyette ve işbirliğinde bulunabilir."
                },
                {
                    heading: "Madde 3- DERNEĞİN AMACI",
                    content: "Yurt içi ve yurt dışında;\na. İklim değişikliği kaynaklı afetler dahil her türlü afetlerde, orman yangınlarında, doğa sporlarında yaşanan kazalarda ve sair arama-kurtarma gerektiren tüm olaylarda veya kazalarda bütünleşik afet yönetimi kapsamında arama-kurtarma ve ilkyardım çalışmaları yapmak,\nb. Kültürel ve doğal mirası tanımak, korumak ve bu konularda çalışmalar yapmak,\nc. Anayasamızda tanımlanmış bütün özellikleri, kavramları ve değerleri korumak ve kollamak, devletin temel amaç ve görevlerine yardımcı olmak, yürürlükte olan mevzuatla belirlenmiş ve koruma altına alınmış konulara destek vermek amacıyla, Türkiye'nin en etkin ve güçlü sivil toplum örgütlerinden biri olma sorumluluğu ve bilinci ile asıl konusu olan arama-kurtarma çalışmalarının yanı sıra ülkemizde boşluğunu, eksikliğini ve yanlışlığını gördüğü, tarih, kültür, eğitim, sağlık, çevre ve doğa gibi sosyal, kültürel ve toplumsal konularda toplantı, sempozyum, söyleşi, yürüyüş, etkinlik, imza kampanyaları, kitap, broşür ve benzeri yayın hazırlama ve toplama kampanyaları, kamuoyu oluşturma, toplum bilinçlendirme ve benzeri çalışmalar yapmak."
                },
                {
                    heading: "Madde 4- DERNEĞİN ÇALIŞMA KONULARI VE BİÇİMLERİ",
                    content: "Dernek çalışma konularıyla ilgili faaliyetlerinde daima aşağıda belirtilen hususları göz önünde bulundurur:\na. Dağ ve doğa koşullarında meydana gelen kaybolma ve kaza olaylarında, deprem, sel gibi doğal afetlerde ve büyük kazalarda, tamamen gönüllü olarak, amatör bir çalışma ve profesyonel bir yaklaşım ile yardıma ihtiyacı olan kişilere en kısa sürede ulaşmak, yardım için gereken en uygun koşulları yaratmak, doğru arama-kurtarma çalışması yaparak kazazedelere temel ilk yardım desteğini sağladıktan sonra emniyetli ortam koşullarına nakillerini sağlamak, bu tür olaylarda can kaybını en aza indirmek ve arama-kurtarma konularında toplumu bilgilendirmek.\nb. Dernek, faaliyetlerinde daima;\n   I) Gönüllülük,\n   II) Karşılıksız Yardımseverlik,\n   III) Başta insan Hayatı Olmak Üzere Tüm Canlıların Hayatına Değer Vermek,\n   IV) Dürüstlük,\n   V) Güvenilirlik,\n   VI) Şeffaflık hususlarına azami dikkati gösterir.\nc. Dernek hiçbir şekilde siyasetle uğraşamaz.\nd. Dernek genel faaliyetleri çerçevesinde, arama-kurtarma ve ilkyardım çalışmaları yapmak,\ne. Kültürel ve doğal mirası tanımak, korumak ve bu konularda çalışmalar yapmak,\nf. Gerek üyelerine gerekse talep halinde üyeler dışında resmi ve özel kurum ve kuruluşlar, eğitim kurumları ile şahıslara ilk yardım, arama-kurtarma, doğa sporları, alternatif sporlar ve sair hususlarda eğitim ve seminerler vermek,\ng. Aynı amaçla kurulmuş ve kurulacak yurt içinde ve yasal izin alındığı takdirde yurt dışındaki gerçek ve tüzel kişilerle, vakıf, Dernek, kamu kurum ve kuruluşları ve sivil toplum kuruluşları ile işbirliği yapmak veya danışmanlık hizmeti vermek,\nh. Derneğin giderlerine maddi katkı sağlamak ve amaçları doğrultusunda işbirliği yaparak bu konuda hizmet vermek.\ni. Gerekli yasal izinler alınmak kaydıyla Amatör Telsizcilik mevzuatı doğrultusunda, üyeleri ve ilgili kurumlar ile hızlı ve sağlıklı iletişim kurulabilmesi için kendisine tahsis edilen telsiz kanalları üzerinden telsiz cihazlarını kullanarak iletişimde bulunmak. Bu konuda üyelerinin yasal lisans sahibi olmaları için gerekli katkı ve yardımlarda bulunmak,\nj. Telekomünikasyon Kurumu ve ilgili kamu kurum ve kuruluşlarının Derneğe verecekleri telsizle iletişim konusundaki görevleri yerine getirmek."
                },
                {
                    heading: "Madde 5- ÜYE OLMA HAKKI VE ÜYELİK İŞLEMLERİ",
                    content: "Dernekte üye ve gönüllü olmak üzere iki üyelik bulunmaktadır. Bunların dışında işbu tüzüğün ilgili maddesinde tanımlandığı gibi onur üyeliği de verebilir.\nÜye: Fiil ehliyetine sahip bulunan ve Dernek tüzüğünü benimsemiş, Derneklere girmelerine kanunlarca ve Dernek tüzüğü gereği engeli bulunmayan, tüzükte belirtilen şartları sağlayan, Genel Kurulda oy verme ve seçme-seçilme hakkı olan gerçek ve tüzel kişilerdir.\nGönüllü: Derneğin kuruluş ilkelerini, değerlerini, amaçlarını, hedeflerini ve çalışma ilkelerini; Dernek tüzüğünü, Dernek iç yönergelerini benimseyen ve Derneklere girmelerine kanunlarca engel bulunmayan, 18 yaşını doldurmuş ve fiil ehliyetine sahip derneğe amaçları doğrultusunda faydalı olmaya çalışan gerçek kişilerdir. Yaşanan afet ya da kaza durumlarında, süresi olayla başlayan ve olayın sonlanmasına kadar olan durumlarda görev yaparlar."
                },
                {
                    heading: "Madde 6- ÜYE VE GÖNÜLLÜ ÜYE OLMA USULÜ",
                    content: "Üye Olma Usulü: Dernek içerisinde 3 yıl aktif gönüllü olarak görev yapan gönüllüler, kendi yazılı istekleri ile bağlı bulundukları birim, bölüm ve ekip liderinin müşterek tavsiyesi ve Yönetim Kurulu onayı ile işbu tüzüğün 9. Madde, 1. fıkrası e bendinde belirtilen suçlardan dolayı kesinleşmiş mahkumiyetinin olmaması kaydıyla üye olabilir. Üyelik Başvurusu 30 gün Dernek askısında itiraza açık olmak kaydıyla ilan olunur. Yönetim Kurulu, 30 gün içinde teklif edilen kişilerin işlemlerini tamamlamak ve sonucu başvurana yazılı ve gerekçeli olarak iletmek zorundadır. Dernek üyeliği için başvuran tüzel kişi, Dernek amacı doğrultusundaki çalışmalarını veya bu yöndeki niyetlerini belirten yazılı bir mektup ile Dernek üyeliği için başvuruda bulunur. Yönetim Kurulu'nca yıllık olarak belirlenecek aidat bedelinin başvuran tarafından kabulü ile Genel Kurulda üyeliği teklif edilir. Tüzel kişilerin üyelikleri ile ilgili Genel Kurul'da verilen karar kesindir."
                },
                {
                    heading: "Madde 7- ONUR ÜYELİĞİ",
                    content: "Onur Üyesi, üyelik koşullarını taşıyan, derneğin amaç ve hizmet konularında uygun çalışmalarda bulunan, Dernek tüzüğünü benimsemiş, toplumda sevgi ve saygı duyulan kişiler arasından Yönetim Kurulu önerisi ve kararı ile seçilen onursal nitelikteki gerçek ve tüzel kişilerdir."
                },
                {
                    heading: "Madde 8- GÖNÜLLÜLÜKTEN VE ÜYELİKTEN ÇIKMA",
                    content: "Gönüllü, üye ve onur üyesi olan kişi, gönüllülükten ve üyelikten ayrılma isteğini yazılı veya elektronik ortamda bildirmek kaydıyla gönüllü, üyeliğini ve onur üyeliğini sona erdirebilir. Gerçek kişilerde ölüm, kısıtlanma, fiil ehliyetinin kaybedilmesi halinde gönüllülük ve üyelik; tüzel kişilerde ise tüzel kişiliğin tasfiyesi, iflası veya konkordato halinde üyelik kendiliğinden sona erer."
                },
                {
                    heading: "Madde 9- GÖNÜLLÜLÜKTEN VE ÜYELİKTEN ÇIKARILMA",
                    content: "1. Gönüllüler aşağıdaki hususlardan birinin gerçekleşmesi halinde Dernek gönüllülüğünden çıkarılır:\na) Dernek ilgili kurumlarınca yapılan soruşturmaya göre tüzüğe ve Dernek içi yönergelere aykırı hareket ettiği veya Dernek aleyhine çalışma yaptığı saptananlar,\nb) Derneğin kuruluş ilkelerini, değerlerini, amaçlarını, hedeflerini ve çalışma ilkelerini; Dernek tüzüğünü, dernek iç yönergelerini benimsemeyen kişiler,\nc) 1 (bir) yıl boyunca hiçbir mazereti olmaksızın Dernek faaliyetlerine katılmamış kişiler,\nd) Derneğe gönüllü olarak başvurma aşamasında kasıtlı olarak yanlış bilgi ve belge sunan kişiler.\ne) Türk Ceza Kanununun ilgili maddesinde belirtilen süreler geçmiş olsa bile; kasten işlenen bir suçtan dolayı iki yıldan fazla süreyle hapis cezasına ya da devletin güvenliğine karşı suçlar, Anayasal düzene ve bu düzenin işleyişine karşı suçlar, zimmet, irtikâp, rüşvet, hırsızlık, dolandırıcılık, sahtecilik, güveni kötüye kullanma, hileli iflas, ihaleye fesat karıştırma, edimin ifasına fesat karıştırma, suçtan kaynaklanan malvarlığı değerlerini aklama, veya kaçakçılık, uyuşturucu madde kullanma, imal ve ticareti, yüz kızartıcı suçlardan kesinleşmiş mahkumiyeti bulunan kişiler.\nf) Hangi nedenle olursa olsun 2. kez gönüllülükten çıkarılanlar bir daha gönüllülüğe alınmazlar."
                },
                {
                    heading: "Madde 10- GÖNÜLLÜLER VE ÜYELERİN HAK VE YÜKÜMLÜLÜKLERİ",
                    content: "1. Gönüllü olan kişilerin hak ve yükümlülükleri:\na) Gönüllü olan kişilere Dernek tarafından 'M1G Kimlik' kartı düzenlenir.\nb) Gönüllü kişiler, tüzükte belirtilen şartları sağlaması halinde üyelik talebinde bulunabilirler.\nc) Dernek içi eğitim ve faaliyetlerine gönüllü olarak katılabilirler.\nd) Her ne sebeple olursa olsun gönüllülüğü sona eren gerçek kişi, Dernek ile ilgili elinde bulundurduğu tüm bilgi, belge, M1G kimlik kartı ve sair tüm ekipmanları ivedi olarak iade etmekle mükelleftir.\ne) Gönüllü, Derneğe beyan ettiği bilgilerin kalıcı değişiklik olması durumunda değişikliklerin gerçekleşmesini müteakip en geç 30 (otuz) gün içinde bildirmekle mükelleftir.\n\n2. Üye olan kişilerin hak ve yükümlülükleri:\na) Genel Yükümlülükler: Tüzüğe ve organ kararlarına uymak, Dernek amaç ve değerlerine uygun davranmak, Gizliliğe riayet etmek, Yetkisiz açıklama yapmamak, Dernek itibarını korumak.\nb) Katılım Yükümlülüğü: Üyeler faaliyetlere katılmakla yükümlüdür. Yıllık katılım oranı en az %50 olmalıdır.\nc) Operasyonlarda görev zinciri esastır: Yetkisiz talimat verilemez, KKD kullanımı zorunludur.\nd) Malzeme ve Zimmet: Üyelikten çıkan veya çıkarılan kişiler, üzerlerine zimmetli bulunan Dernek malzemelerini 15 gün içinde iade etmek zorundadır. İade edilmemesi halinde rayiç bedel tahsil edilir ve gerekirse hukuki yollara başvurulur.\ne) Aidat ve Oy Hakkı: Yıllık aidatlar her yılın Şubat ayının 1'ine kadar ödenmiş olmalıdır. Kendisine yapılan yazılı uyarıya rağmen aidatını ödemeyen üye disiplin kuruluna sevk edilir. Genel Kurul tarihinde aidat borcu bulunan üyeler oy kullanamaz."
                },
                {
                    heading: "Madde 11- DERNEK ORGANLARI",
                    content: "1. Merkez Genel Kurulu\n2. Merkez Yönetim Kurulu\n3. Merkez Denetim Kurulu\n4. Merkez Disiplin Kurulu\na) Disiplin Kurulunun yönetmeliği yönetim kurulunca hazırlanır.\ni. Dernek bünyesinde 3 asil ve 3 yedek üyeden oluşan Merkez Disiplin Kurulu oluşturulur.\nii. Yönetim Kurulu üyeleri Disiplin Kurulunda görev alamaz.\niii. Disiplin Kurulu soruşturma yapar ve raporunu Yönetim Kuruluna sunar.\niv. Üyelikten çıkarma kararı Yönetim Kurulu tarafından verilir."
                },
                {
                    heading: "Madde 12- MERKEZ GENEL KURULUNUN KURULUŞ ŞEKLİ, TOPLANMA ZAMANI, ÇAĞRI VE TOPLANTI USULÜ",
                    content: "Genel Kurul, derneğin en yetkili organı olup, derneğe kayıtlı üyelerden oluşur.\nMerkez Genel Kurulu 3 (üç) yılda bir Mart ayı içinde olağan olarak toplanır.\nMerkez Genel Kurulu, aşağıdaki durumlar dâhilinde 1 (bir) ay içinde Merkez Yönetim Kurulunca olağanüstü toplantıya çağrılır:\na. Dernek üyelerinden beşte birinin yazılı başvurusu,\nb. Merkez Yönetim Kurulunun gerekli gördüğü hallerde,\nc. Merkez Denetim Kurulunun gerekli gördüğü hallerde."
                },
                {
                    heading: "Madde 13- TOPLANTI YERİ, KOŞULLARI VE TOPLANTI YETER SAYISI",
                    content: "Toplantı yeri: Merkez Genel Kurulu, Dernek merkezinin bulunduğu ilden başka yerde toplanamaz.\nToplantı Yeter Sayısı: Merkez Genel Kurul, katılma hakkı bulunan üyelerin salt çoğunluğunun, tüzük değişikliği ve derneğin feshi hâllerinde üçte ikisinin katılımıyla toplanır; çoğunluğun sağlanamaması sebebiyle toplantının ertelenmesi durumunda ikinci toplantıda çoğunluk aranmaz. Ancak, bu toplantıya katılan üye sayısı, yönetim ve denetim kurulları üye tam sayısının iki katından az olamaz."
                },
                {
                    heading: "Madde 14- MERKEZ GENEL KURULUNUN GÖREV VE YETKİLERİ",
                    content: "Merkez Genel Kurulunun yetkileri şunlardır:\na. Merkez Yönetim ve Denetim Kurulu'nun seçimi,\nb. Tüzük ve gerektiğinde iç yönergelerin değişikliğine karar vermek,\nc. Merkez Yönetim ve Merkez Denetim Kurulları raporlarının, bilançonun, gelir ve gider hesaplarının görüşülmesi ve kurullarının ayrı ayrı ibrası,\nd. Merkez Yönetim Kurulu'nun hazırladığı bütçenin görüşülmesi, aynen veya değiştirilerek kabulü,\ne. Taşınmaz mal satın alınması, satılması veya kiralanması konusunda Merkez Yönetim Kurulu'na yetki vermek,\nf. Federasyona katılmak ve ayrılmak,\ng. Yurt dışındaki dernek ve kuruluşlara gerekli yasal izinler çerçevesinde üye ve gözlemci olması ve ayrılmasına karar vermek,\nh. İlgili mevzuat, Dernek tüzüğü ve iç yönergelerle belirlenen görevleri yerine getirmek, başvurusu reddedilen başvuranların ve Dernekten çıkarılan üyelerin itirazlarını incelemek ve karara bağlamak, üyeliğe kabul ve üyelikten çıkarılma hakkında son kararı vermek,\ni. Derneğin amaçlarına benzer amaçlı dernek, vakıf, üst birlik ve kuruluşları kurmak, bunlara katılmak veya kurucu olarak katılmak, katılım payını belirleme ve ödeme konularında Merkez Yönetim Kurulu'na yetki vermek,\nj. İlgili mevzuat ve Dernek tüzüğünde Merkez Genel Kurulu'nca yapılması öngörülen diğer görevleri yerine getirmek, yurt içinde ve yurt dışında şube açılması veya kapatılmasına karar vermek,\nk. Derneğin üçüncü şahıslara, bankalara ve finans kurumlarına borçlanma ve kredi alması hususunda Merkez Yönetim Kurulu'na yetki vermek,\nl. Derneğin feshine karar vermek."
                },
                {
                    heading: "Madde 15- MERKEZ GENEL KURULUN KARAR ALMA USULLERİ",
                    content: "Merkez Genel Kurulu kararları, katılan üyelerin salt çoğunluğu ile alınır. Ancak Derneğin feshi ve tüzük değişikliği ile ilgili kararlar üçte iki çoğunlukla alınır.\nÇarşaf Liste veya Blok Liste usulü ile seçim yapılır."
                },
                {
                    heading: "Madde 16- MERKEZ GENEL KURUL SONUÇLARININ BİLDİRİMİ",
                    content: "Olağan veya olağanüstü Merkez Genel Kurul toplantılarını izleyen 30 (otuz) gün içinde, Yönetim ve Denetim Kurulları ile diğer organlara seçilen asıl ve yedek üyeleri içeren Genel Kurul Sonuç Bildirimi mülki idare amirliğine verilir."
                },
                {
                    heading: "Madde 17- MERKEZ YÖNETİM KURULUNUN OLUŞUMU",
                    content: "Merkez Yönetim Kurulu 7 (yedi) asıl, 5 (beş) yedek üyeden oluşur. Görev süresi 3 (üç) yıldır. Görevi sona eren Yönetim Kurulu üyelerine yeniden görev verilebilir."
                },
                {
                    heading: "Madde 18- MERKEZ YÖNETİM KURULUNUN GÖREVLERİ",
                    content: "Yönetim Kurulu Başkanı, Derneği temsil ve ilzam eder. Gelir ve gider hesaplarını, bilançoyu yapmak, bütçeyi hazırlamak. İç yönergeleri hazırlamak ve yürütmek. Gerekli görüldüğünde alt birimler ve kurullar oluşturmak. Dernek adına basına ve kamuoyuna açıklamada bulunma kararı almak."
                },
                {
                    heading: "Madde 19- MERKEZ YÖNETİM KURULU ÇALIŞMA USULÜ",
                    content: "Merkez Yönetim Kurulu, il merkezi dahilinde başka bir yerde toplanmasına gerek görmedikçe, Dernek merkezinde toplanır. Kararlar salt çoğunlukla alınır."
                },
                {
                    heading: "Madde 20- MERKEZ DENETİM KURULU OLUŞUMU",
                    content: "Merkez Denetim Kurulu 3 (üç) asıl, 3 (üç) yedek üyeden oluşur. Görev süresi 3 (üç) yıldır."
                },
                {
                    heading: "Madde 21- MERKEZ DENETİM KURULU GÖREVLERİ",
                    content: "Derneğin tüzüğünde gösterilen amaç ve amacın gerçekleştirilmesi için sürdürüleceği belirtilen çalışma konuları doğrultusunda faaliyet gösterip göstermediğini, defter, hesap ve kayıtların mevzuata ve Dernek tüzüğüne uygun olarak tutulup tutulmadığını denetler."
                },
                {
                    heading: "Madde 22- İÇ DENETİM",
                    content: "Derneklerde iç denetim esas olduğu görüşüyle, Merkez Genel Kurulu, Merkez Yönetim Kurulu veya Merkez Denetim Kurulu tarafından iç denetim yapılabileceği gibi, bağımsız denetim kuruluşlarına da denetim yaptırılabilir."
                },
                {
                    heading: "Madde 23- BORÇLANMA USULÜ",
                    content: "Dernek, amacını gerçekleştirmek ve faaliyetlerini sürdürebilmek için borçlanabilir. Derneğin toplam borçlanma tutarı, bir önceki yıl kesinleşmiş gelirlerinin %50'sini aşamaz."
                },
                {
                    heading: "Madde 24- DERNEK ŞUBELERİNİN VE TEMSİLCİLİKLERİN KURULUŞU",
                    content: "Dernek, gerekli görülen yerlerde Merkez Genel Kurulunun teklifi üzerine Merkez Genel Kurul kararıyla şube açabilir. Temsilcilikler Merkez Yönetim Kurulu kararı ile açılır."
                },
                {
                    heading: "Madde 25- DERNEĞİN GELİR KAYNAKLARI",
                    content: "a. Üye aidatları: Üyelerden giriş ödentisi olarak 1.000 (bin) TL, aylık olarak 100 (yüz) TL aidat alınır.\nb. Bağışlar, sponsorluklar, yayın ve organizasyon gelirleri."
                },
                {
                    heading: "Madde 26- DERNEK ÜYELİK AİDATI",
                    content: "Yıllık aidat, üyelik başvurusunun kabul edilmesinden sonra üye tarafından ödenir; mevcut üyeler aidatlarını her yıl 01 Şubat'a kadar öderler."
                },
                {
                    heading: "Madde 27- DERNEK KAYIT USULÜ",
                    content: "Dernek defterleri; Karar Defteri, Üye Kayıt Defteri, Evrak Kayıt Defteri, Gelir-Gider Defteri, Bütçe ve Demirbaş Defteridir."
                },
                {
                    heading: "Madde 28- DERNEK İKTİSADİ İŞLETMESİ",
                    content: "Dernek Merkez Yönetim Kurulu kararı ile Dernek tüzüğü ve ilgili mevzuat hükümlerine göre iktisadi işletme kurabilir."
                },
                {
                    heading: "Madde 29- DERNEK ADINA TAŞINMAZ MAL EDİNME",
                    content: "Dernek amaç ve çalışmaları için gerekli olan taşınmazları Merkez Genel Kurulu'nun yetki vermesi üzerine Yönetim Kurulu kararı ile edinebilir."
                },
                {
                    heading: "Madde 30- ULUSLARARASI FAALİYETLER",
                    content: "Dernek uluslararası faaliyette veya yurt dışındaki kişi ve kuruluşlarla işbirliğinde bulunabilir, temsilcilik veya şube açabilir."
                },
                {
                    heading: "Madde 31- TÜZÜK DEĞİŞİKLİĞİ",
                    content: "Tüzük değişikliği Genel Kurul kararı ile yapılır. Katılan üyelerin 2/3 oy çoğunluğu aranır."
                },
                {
                    heading: "Madde 32- FESİH VE SONUÇLARI",
                    content: "Genel Kurul her zaman Derneğin feshine karar verebilir. Fesih için 2/3 oy çoğunluğu aranır."
                },
                {
                    heading: "Madde 33- TÜZÜKTE HÜKÜM OLMAMASI",
                    content: "Bu tüzükte yazılı olmayan konularda Dernekler Kanunu, Türk Medeni Kanunu hükümleri uygulanır."
                },
                {
                    heading: "Madde 34- DERNEK İÇİ TEBLİGAT VE YAZIŞMA USULLERİ",
                    content: "Yönetim Kurulu tarafından üyelerine yapılacak her türlü bildirim, resmi e-posta adresi: info@m1g.org.tr ve kayıtlı WhatsApp hattı üzerinden yapılır.\n\nİşbu Tüzük 34 (otuzdört) maddeden ibarettir."
                }
            ]
        }
    };

    const currentDoc = officialDocs[activeTab];

    // Export PDF formatted line by line exactly
    const handleDownloadPdf = async (docKey: "tuzuk" | "operasyon" | "kkd" | "disiplin" | "haberlesme") => {
        try {
            setDownloadingDoc(docKey);
            const docData = officialDocs[docKey];
            const { jsPDF } = await import("jspdf");
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

            // Header Red Bar
            pdf.setFillColor(180, 20, 20);
            pdf.rect(0, 0, 210, 24, "F");
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(13);
            pdf.setFont("helvetica", "bold");
            pdf.text("M1G ARAMA & KURTARMA DERNEGI", 105, 11, { align: "center" });
            pdf.setFontSize(9);
            pdf.text("RESMI KURUMSAL VE HUKUKI MEVZUAT METNI", 105, 18, { align: "center" });

            pdf.setTextColor(20, 20, 20);
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "bold");
            pdf.text(docData.title, 105, 34, { align: "center" });
            pdf.setLineWidth(0.4);
            pdf.setDrawColor(200, 200, 200);
            pdf.line(15, 38, 195, 38);

            let y = 46;
            const pageHeight = 280;

            docData.sections.forEach((sec) => {
                if (y > pageHeight - 20) {
                    pdf.addPage();
                    y = 20;
                }

                // Heading
                pdf.setFontSize(10);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(180, 20, 20);
                const headingLines = pdf.splitTextToSize(sec.heading, 180);
                headingLines.forEach((hLine: string) => {
                    if (y > pageHeight - 15) { pdf.addPage(); y = 20; }
                    pdf.text(hLine, 15, y);
                    y += 5;
                });

                // Body content
                pdf.setFontSize(8.5);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(40, 40, 40);
                const bodyLines = pdf.splitTextToSize(sec.content, 180);
                bodyLines.forEach((bLine: string) => {
                    if (y > pageHeight - 15) { pdf.addPage(); y = 20; }
                    pdf.text(bLine, 15, y);
                    y += 4.5;
                });

                y += 4;
            });

            // Footer
            pdf.setFontSize(7.5);
            pdf.setTextColor(120, 120, 120);
            pdf.text("M1G Arama Kurtarma Dernegi Resmi Yonetmelik Belgesi - https://m1g.org.tr", 105, 287, { align: "center" });

            pdf.save(docData.pdfFilename);
            toast.success("Resmi tam metin PDF olarak indirildi.");
        } catch (err) {
            console.error("PDF export error", err);
            toast.error("PDF oluşturulurken hata oluştu.");
        } finally {
            setDownloadingDoc(null);
        }
    };

    const copyFullTextToClipboard = () => {
        const fullText = currentDoc.title + "\n\n" + currentDoc.sections.map(s => s.heading + "\n" + s.content).join("\n\n");
        navigator.clipboard.writeText(fullText);
        setCopiedText(true);
        toast.success("Tam metin panoya kopyalandı!");
        setTimeout(() => setCopiedText(false), 2000);
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
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">RESMİ DERNEK MEVZUATI VEYA YÖNETMELİKLER</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight mb-6 max-w-4xl mx-auto leading-none"
                    >
                        M1G Arama Kurtarma Derneği <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                            Resmi Tüzük ve Yönetmelikleri
                        </span>
                    </motion.h1>

                    <p className="text-neutral-400 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
                        T.C. İçişleri Bakanlığı Sivil Toplumla İlişkiler Genel Müdürlüğü onaylı resmi dernek tüzüğümüz ve operasyonel yönetmeliklerimiz aşağıda <strong>birebir, eksiksiz tam metin (unabridged full text)</strong> olarak yayınlanmıştır.
                    </p>
                </div>

                {/* Quick PDF Action Ribbon */}
                <div className="mb-8 bg-gradient-to-r from-[#0b1324] via-[#0f172a] to-[#0b1324] p-5 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <div className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">{currentDoc.code}</div>
                            <h2 className="text-sm font-black text-white uppercase tracking-wider">{currentDoc.title}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={copyFullTextToClipboard}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all flex items-center gap-2"
                        >
                            {copiedText ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            {copiedText ? "Kopyalandı!" : "Metni Kopyala"}
                        </button>

                        <button
                            onClick={() => handleDownloadPdf(activeTab)}
                            disabled={downloadingDoc === activeTab}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                        >
                            {downloadingDoc === activeTab ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            Tam Metin PDF İndir
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex flex-wrap justify-center gap-2 mb-10 bg-black/40 p-2 rounded-2xl border border-white/10 max-w-5xl mx-auto backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab("tuzuk")}
                        className={`px-4 sm:px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "tuzuk"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <FileText size={16} /> Resmi Tüzük (34 Madde)
                    </button>
                    <button
                        onClick={() => setActiveTab("operasyon")}
                        className={`px-4 sm:px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "operasyon"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <ShieldCheck size={16} /> Operasyon Yönetmeliği (18 Madde)
                    </button>
                    <button
                        onClick={() => setActiveTab("kkd")}
                        className={`px-4 sm:px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "kkd"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Shirt size={16} /> Kıyafet & KKD (12 Madde)
                    </button>
                    <button
                        onClick={() => setActiveTab("disiplin")}
                        className={`px-4 sm:px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "disiplin"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Scale size={16} /> Disiplin Yönetmeliği (11 Madde)
                    </button>
                    <button
                        onClick={() => setActiveTab("haberlesme")}
                        className={`px-4 sm:px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "haberlesme"
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Radio size={16} /> WhatsApp & Haberleşme (7 Madde)
                    </button>
                </div>

                {/* Tab Content Display - UNABRIDGED VERBATIM OFFICIAL TEXT */}
                <div className="bg-[#050b14] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
                    
                    <div className="border-b border-white/10 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <span className="text-xs text-red-500 font-mono font-bold tracking-widest uppercase">{currentDoc.code}</span>
                            <h2 className="text-2xl font-black text-white uppercase mt-1">{currentDoc.title}</h2>
                            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                                <CheckCircle2 size={14} /> Resmi Belge Metni Olduğu Gibi Birebir İlan Edilmiştir.
                            </p>
                        </div>

                        <button
                            onClick={() => handleDownloadPdf(activeTab)}
                            disabled={downloadingDoc === activeTab}
                            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                        >
                            {downloadingDoc === activeTab ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            PDF İndir
                        </button>
                    </div>

                    {/* Unabridged Section Rendering */}
                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.3 }}
                        className="space-y-6 font-sans text-neutral-300"
                    >
                        {currentDoc.sections.map((sec, idx) => (
                            <div key={idx} className="bg-black/40 border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors space-y-3">
                                <h3 className="text-red-400 font-bold uppercase tracking-wider text-sm border-b border-white/5 pb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                                    {sec.heading}
                                </h3>
                                <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line font-mono font-light">
                                    {sec.content}
                                </div>
                            </div>
                        ))}
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
