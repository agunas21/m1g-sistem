# 🚒 M1G Arama Kurtarma Derneği - WhatsApp Topluluk & Destek Botu

Bu bot; derneğin fiziksel bir SIM kartı veya telefon hattı olmasına gerek kalmadan, WhatsApp Multi-Device (Bağlı Cihazlar) protokolü üzerinden 7/24 çalışan resmi topluluk ve afet haberleşme botudur.

---

## 🌟 Temel Yetenekleri

1. **Topluluk Kuralları Denetimi**:
   - İzin verilmeyen reklam/harici link paylaşımlarını algılar ve üyeyi nazikçe uyarır.
   - Küfür ve uygunsuz ifadeleri filtreler.
   - Gece saatlerinde (23:00 - 07:00) afet dışı gereksiz sohbetler için acil haberleşme kuralını hatırlatır.

2. **Yeni Gelen Üyeleri Karşılama (Oryantasyon)**:
   - Gruba yeni katılan bir üye olduğunda otomatik olarak karşılama mesajı yayınlar ve dernek portalına (`m1g.org.tr/portal`) yönlendirir.

3. **Otomatik Doğum Günü Kutlaması**:
   - Her sabah saat **09:00**'da M1G veritabanını (`/api/bot/webhook`) sorgulayarak o gün doğum günü olan gönüllüleri grupta tebrik eder.

4. **Akıllı Destek Masası (Sorun / Talep İletme)**:
   - Bir üye bota özelden (DM) yazdığında interaktif menü açılır:
     - `1` 🛠️ Lojistik & Malzeme / Telsiz Arızası
     - `2` 📝 Operasyonel Mazeret / İzin Bildirimi
     - `3` 🎓 Eğitim & Akreditasyon Soruları
     - `4` 🚨 Nöbetçi Yöneticiye / Başkana Not İlet
   - Üyenin ilettiği sorun hem **ilgili yöneticinin şahsi WhatsApp'ına anında iletilir**, hem de **M1G Web Sitesi Admin Paneli > Gelen Mesajlar** ekranına ticket olarak kaydedilir.

5. **Web Panelinden Tek Tıkla Seferberlik İlanı**:
   - Komuta masasında acil afet modu açıldığında, bot HTTP API üzerinden sinyal alarak WhatsApp grubunda `@everyone` seferberlik çağrısı geçer.

---

## 🚀 Kurulum & Çalıştırma (3 Adım)

### 1. Bağımlılıkları Yükleyin:
```bash
cd bot
npm install
```

### 2. Konfigürasyonu Düzenleyin (`config.json`):
- `departmentAdmins`: İlgili yöneticilerin telefon numaralarını girin (örn: `905321234567`).
- `targetGroupId`: Botun mesaj atacağı M1G WhatsApp grubunun ID'si.

### 3. Botu Başlatın ve QR Kodu Tarayın:
```bash
npm start
```
Terminal ekranında bir QR kod belirecektir:
1. Telefonunuzdan **WhatsApp'ı açın**.
2. **Ayarlar > Bağlı Cihazlar > Cihaz Bağla** seçeneğine dokunun.
3. Terminaldeki QR kodu tarayın.
4. Tebrikler! Bot artık bağlı ve 7/24 görev başındadır.

---

## 📌 Nerede Barındırılabilir?
- **Dernek Merkezindeki Bilgisayar (Sıfır Maliyet)**: Dernek merkezinde internete bağlı herhangi bir Windows/Linux bilgisayarda PM2 veya terminal üzerinden arka planda çalıştırılabilir.
- **Bulut Sunucu (Railway / Render / VPS)**: 7/24 kesintisiz çalışması için cüzi/ücretsiz bir bulut servisine yüklenebilir.
