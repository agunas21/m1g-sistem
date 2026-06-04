import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | M1G Arama Kurtarma",
  description: "M1G Arama Kurtarma Derneği Gizlilik Politikası - Kişisel verilerinizin korunması hakkında bilgilendirme.",
};

export default function GizlilikPolitikasi() {
  return (
    <div className="min-h-screen bg-[#020617] pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
          Gizlilik <span className="text-neutral-500">Politikası</span>
        </h1>
        <div className="w-20 h-1 bg-red-600 mb-8"></div>
        <p className="text-neutral-500 text-sm mb-12">Son güncelleme: 09 Mayıs 2026</p>

        <div className="prose prose-invert prose-neutral max-w-none space-y-8 text-neutral-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Veri Sorumlusu</h2>
            <p>M1G Arama Kurtarma Derneği (&quot;Dernek&quot;), kişisel verilerinizin korunması konusunda 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında veri sorumlusu sıfatıyla hareket etmektedir.</p>
            <p className="text-sm text-neutral-400">Adres: Sancar Maruflu Sivil Toplum Yerleşkesi, Bahçelievler Mah. 1851/10 Sok. No:3 PK:15 Karşıyaka/İzmir</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Toplanan Kişisel Veriler</h2>
            <p>Web sitemiz ve üye portalımız aracılığıyla aşağıdaki kişisel veriler toplanabilir:</p>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Kimlik bilgileri (ad, soyad, TC kimlik numarası)</li>
              <li>İletişim bilgileri (e-posta, telefon numarası, adres)</li>
              <li>Üyelik bilgileri (kan grubu, meslek, eğitim durumu)</li>
              <li>Sertifika ve eğitim bilgileri</li>
              <li>Fotoğraflar (profil fotoğrafı, etkinlik fotoğrafları)</li>
              <li>Teknik veriler (IP adresi, tarayıcı bilgisi, çerezler)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Verilerin İşlenme Amaçları</h2>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Üyelik ve gönüllülük başvurularının değerlendirilmesi</li>
              <li>Arama kurtarma operasyonlarının yönetimi</li>
              <li>Eğitim ve sertifika süreçlerinin takibi</li>
              <li>Dernek faaliyetleri hakkında bilgilendirme</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              <li>İletişim ve koordinasyon amaçları</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Verilerin Paylaşımı</h2>
            <p>Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz. Ancak aşağıdaki durumlarda paylaşım yapılabilir:</p>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Yasal düzenlemeler gereği yetkili kurumlara</li>
              <li>AFAD ve diğer resmi kurumlarla operasyonel koordinasyon kapsamında</li>
              <li>Açık rızanızın bulunduğu durumlarda</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Veri Güvenliği</h2>
            <p>Kişisel verilerinizin güvenliği için teknik ve idari tedbirler alınmaktadır. Veriler şifreli ortamlarda saklanmakta ve yetkisiz erişime karşı korunmaktadır.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Haklarınız</h2>
            <p>KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
              <li>Verilerin silinmesini veya yok edilmesini isteme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. İletişim</h2>
            <p>Gizlilik politikamız hakkında sorularınız için:</p>
            <p className="text-sm text-neutral-400">📧 info@m1g.org.tr | 📞 +90 544 727 60 75</p>
          </section>

        </div>
      </div>
    </div>
  );
}
