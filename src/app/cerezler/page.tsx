import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Çerez Politikası | M1G Arama Kurtarma",
  description: "M1G Arama Kurtarma Derneği Çerez Politikası - Web sitemizde kullanılan çerezler hakkında bilgilendirme.",
};

export default function CerezPolitikasi() {
  return (
    <div className="min-h-screen bg-[#020617] pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
          Çerez <span className="text-neutral-500">Politikası</span>
        </h1>
        <div className="w-20 h-1 bg-red-600 mb-8"></div>
        <p className="text-neutral-500 text-sm mb-12">Son güncelleme: 09 Mayıs 2026</p>

        <div className="prose prose-invert prose-neutral max-w-none space-y-8 text-neutral-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Çerez Nedir?</h2>
            <p>Çerezler (cookies), web sitelerinin tarayıcınız aracılığıyla cihazınıza depoladığı küçük metin dosyalarıdır. Bu dosyalar, web sitesinin düzgün çalışması, kullanıcı deneyiminin iyileştirilmesi ve site trafiğinin analiz edilmesi amacıyla kullanılır.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Kullandığımız Çerez Türleri</h2>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-white font-bold">Çerez Türü</th>
                    <th className="text-left px-4 py-3 text-white font-bold">Amaç</th>
                    <th className="text-left px-4 py-3 text-white font-bold">Süre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="px-4 py-3 text-red-400 font-medium">Zorunlu Çerezler</td>
                    <td className="px-4 py-3">Oturum yönetimi, kimlik doğrulama, güvenlik</td>
                    <td className="px-4 py-3 text-neutral-400">Oturum süresi</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-amber-400 font-medium">Tercih Çerezleri</td>
                    <td className="px-4 py-3">Dil tercihi, tema seçimi gibi kullanıcı ayarları</td>
                    <td className="px-4 py-3 text-neutral-400">1 yıl</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-blue-400 font-medium">Analitik Çerezler</td>
                    <td className="px-4 py-3">Ziyaretçi istatistikleri ve kullanım analizi</td>
                    <td className="px-4 py-3 text-neutral-400">2 yıl</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Çerezlerin Kontrolü</h2>
            <p>Tarayıcı ayarlarınızdan çerezleri yönetebilir, silebilir veya engelleyebilirsiniz. Ancak zorunlu çerezlerin engellenmesi durumunda web sitesinin bazı özellikleri düzgün çalışmayabilir.</p>
            <p className="text-sm text-neutral-400">Tarayıcınızın çerez ayarları hakkında bilgi almak için tarayıcınızın yardım sayfalarını ziyaret edebilirsiniz.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Üçüncü Taraf Çerezleri</h2>
            <p>Web sitemizde YouTube gömülü videoları ve harici içerikler nedeniyle üçüncü taraf çerezleri kullanılabilir. Bu çerezler ilgili hizmet sağlayıcıların gizlilik politikalarına tabidir.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. İletişim</h2>
            <p>Çerez politikamız hakkında sorularınız için:</p>
            <p className="text-sm text-neutral-400">📧 info@m1g.org.tr | 📞 +90 544 727 60 75</p>
          </section>

        </div>
      </div>
    </div>
  );
}
