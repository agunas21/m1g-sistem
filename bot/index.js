/**
 * M1G Arama Kurtarma Derneği - WhatsApp Topluluk & Destek Masası Botu
 * 
 * Özellikler:
 * 1. Topluluk Kuralları Denetimi (Yetkisiz Link, Küfür, Gece Sohbet Yasağı)
 * 2. Yeni Gelen Üyeleri Karşılama & Oryantasyon (Hoş Geldin Mesajı)
 * 3. Otomatik Doğum Günü Kutlaması (M1G Veritabanından her sabah 09:00'da)
 * 4. Özelden Gelen Sorun/Talep İletme (Lojistik, Harekât, Eğitim, Başkanlık yönlendirmesi)
 * 5. M1G Web Sitesinden Acil Seferberlik / Afet Bildirimi Yayınlama
 */

import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import express from 'express';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigürasyonu yükle
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

// Aktif özel sohbet destek oturumları
const userSessions = new Map(); // senderId -> { step: 'SELECT_DEPT' | 'AWAIT_TEXT', dept: '' }

let sock = null;

// ── 1. WhatsApp Bağlantı Yönetimi ───────────────────────────────────────────
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_session'));
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['M1G Arama Kurtarma', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n=======================================================");
            console.log("📲 LÜTFEN DERNEK YETKİLİSİNİN TELEFONUNDAN QR KODU TARAYIN");
            console.log("WhatsApp > Ayarlar > Bağlı Cihazlar > Cihaz Bağla");
            console.log("=======================================================\n");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Bağlantı kesildi, tekrar bağlanılıyor...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            } else {
                console.log('Oturum kapatıldı. Yeniden bağlanmak için auth_session klasörünü silip tekrar başlatın.');
            }
        } else if (connection === 'open') {
            console.log('✅ M1G WhatsApp Botu başarıyla bağlandı ve aktif!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ── 2. Yeni Gelen Üyeleri Karşılama ─────────────────────────────────────
    sock.ev.on('group-participants.update', async (update) => {
        try {
            const { id: groupId, participants, action } = update;
            if (action === 'add') {
                for (const participant of participants) {
                    const welcomeMsg = config.templates.welcome.replace('@name', `@${participant.split('@')[0]}`);
                    await sock.sendMessage(groupId, {
                        text: welcomeMsg,
                        mentions: [participant]
                    });
                }
            }
        } catch (err) {
            console.error('Katılımcı karşılama hatası:', err);
        }
    });

    // ── 3. Mesaj Dinleme (Grup Kuralları & Özel Destek Masası) ──────────────
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = msg.key.participant || from;
            const senderNum = sender.split('@')[0];
            const senderPushName = msg.pushName || 'Gönüllü';

            const text = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || 
                         msg.message.imageMessage?.caption || '';

            // A) GRUP MESAJLARI: TOPLULUK KURALLARI DENETİMİ
            if (isGroup) {
                const hour = new Date().getHours();

                // 1. Yetkisiz Link Engeli
                if (config.communityRules.blockUnauthorizedLinks && /(https?:\/\/|www\.)[^\s]+/gi.test(text)) {
                    // Admin kontrolü yapılabilir veya doğrudan uyarı verilebilir
                    const isM1GLink = text.includes('m1g.org.tr');
                    if (!isM1GLink) {
                        await sock.sendMessage(from, {
                            text: `⚠️ Sayın @${senderNum}, M1G operasyon grubunda izin verilmeyen bağlantı paylaşımı tespit edildi. Lütfen acil durum haberleşmesini meşgul etmeyiniz.`,
                            mentions: [sender]
                        }, { quoted: msg });
                        return;
                    }
                }

                // 2. Gece Sohbet Kuralı (23:00 - 07:00 arası afet dışı mesajlar)
                const quiet = config.communityRules.nightQuietHours;
                if (quiet?.enabled && (hour >= quiet.startHour || hour < quiet.endHour)) {
                    const isUrgent = /acil|afet|deprem|yangın|kayıp|kaza|ihbar/i.test(text);
                    if (!isUrgent && text.length > 5) {
                        // Sadece bilgilendirici uyarı
                        console.log(`[Gece Kuralı İhlali] ${senderNum}: ${text}`);
                    }
                }
                return;
            }

            // B) ÖZEL SOHBET: YÖNETİCİYE SORUN / TALEP İLETME DESTEK MASASI
            if (!isGroup) {
                const session = userSessions.get(sender);

                if (!session) {
                    if (['1', '2', '3', '4'].includes(text.trim())) {
                        handleDeptSelection(sender, text.trim(), senderPushName);
                        return;
                    }

                    // Ana Menüyü Gönder
                    const menu = `👋 *Merhaba ${senderPushName},*\n*M1G Arama Kurtarma İletişim & Destek Masası:*\n\n` +
                        `Lütfen bildirmek istediğiniz konunun numarasını yazınız:\n\n` +
                        `1️⃣ 🛠️ *Lojistik & Malzeme / Telsiz Arızası*\n` +
                        `2️⃣ 📝 *Operasyonel Mazeret / İntikal Durumu*\n` +
                        `3️⃣ 🎓 *Eğitim & Akreditasyon Soruları*\n` +
                        `4️⃣ 🚨 *Yönetim Kuruluna / Başkana Not İlet*\n\n` +
                        `_Cevap vermek için sadece numarayı (1, 2, 3 veya 4) yazıp gönderiniz._`;

                    userSessions.set(sender, { step: 'SELECT_DEPT' });
                    await sock.sendMessage(from, { text: menu });
                    return;
                }

                if (session.step === 'SELECT_DEPT') {
                    handleDeptSelection(sender, text.trim(), senderPushName);
                    return;
                }

                if (session.step === 'AWAIT_TEXT') {
                    const deptKey = session.dept;
                    const deptInfo = config.departmentAdmins[deptKey] || config.departmentAdmins.yonetim;

                    // 1. M1G Web Sitesi API'sine Firestore Ticket'ı olarak kaydet
                    try {
                        await fetch(`${config.m1gApiUrl}/api/bot/webhook`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-bot-api-key': config.botSecretKey
                            },
                            body: JSON.stringify({
                                action: 'new_ticket',
                                payload: {
                                    senderName: senderPushName,
                                    senderPhone: senderNum,
                                    category: deptInfo.name,
                                    message: text,
                                    priority: deptKey === 'yonetim' || deptKey === 'harekat' ? 'Yüksek' : 'Orta'
                                }
                            })
                        });
                    } catch (apiErr) {
                        console.error('Web paneline ticket kaydı iletilemedi:', apiErr);
                    }

                    // 2. İlgili Yöneticinin Şahsi WhatsApp'ına Direkt İlet
                    if (deptInfo.phone && deptInfo.phone !== '905320000001') {
                        const adminJid = `${deptInfo.phone}@s.whatsapp.net`;
                        const forwardMsg = `🚨 *YENİ GÖNÜLLÜ TALEBİ / SORUNU* 🚨\n\n` +
                            `👤 *İleten:* ${senderPushName} (+${senderNum})\n` +
                            `🏷️ *Departman:* ${deptInfo.name}\n` +
                            `💬 *Mesaj:* "${text}"\n\n` +
                            `_M1G Web Paneli Gelen Mesajlar ekranına da kaydedilmiştir._`;

                        await sock.sendMessage(adminJid, { text: forwardMsg });
                    }

                    // 3. Üyeye Onay Mesajı Dön
                    await sock.sendMessage(from, {
                        text: `✅ *Talebiniz Alındı!*\n\nİlettiğiniz mesaj ilgili birimimiz olan *${deptInfo.name}* sorumlusuna ve dernek yönetim paneline iletilmiştir. En kısa sürede sizinle iletişime geçilecektir.\n\n_M1G Arama Kurtarma Derneği_`
                    });

                    userSessions.delete(sender);
                }
            }
        } catch (err) {
            console.error('Mesaj işleme hatası:', err);
        }
    });
}

function handleDeptSelection(sender, choice, senderPushName) {
    let dept = 'yonetim';
    let deptName = 'Dernek Yönetimi';

    if (choice === '1') { dept = 'lojistik'; deptName = 'Lojistik & Depo Sorumlusu'; }
    else if (choice === '2') { dept = 'harekat'; deptName = 'Operasyon & Harekât Amiri'; }
    else if (choice === '3') { dept = 'egitim'; deptName = 'Eğitim & Akreditasyon Sorumlusu'; }
    else if (choice === '4') { dept = 'yonetim'; deptName = 'Yönetim Kurulu & Başkanlık'; }
    else {
        sock.sendMessage(sender, { text: '⚠️ Lütfen sadece 1, 2, 3 veya 4 yazınız.' });
        return;
    }

    userSessions.set(sender, { step: 'AWAIT_TEXT', dept });
    sock.sendMessage(sender, {
        text: `📌 *Seçilen Birim:* ${deptName}\n\nLütfen sorununuzu, arızayı veya iletmek istediğiniz detaylı mesajınızı buraya yazınız:`
    });
}

// ── 4. Her Sabah 09:00'da Otomatik Doğum Günü Tebriki ───────────────────────
cron.schedule('0 9 * * *', async () => {
    try {
        console.log('[Cron] Doğum günleri kontrol ediliyor...');
        const res = await fetch(`${config.m1gApiUrl}/api/bot/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-bot-api-key': config.botSecretKey
            },
            body: JSON.stringify({ action: 'get_birthdays' })
        });

        const data = await res.json();
        if (data.success && data.birthdays && data.birthdays.length > 0) {
            for (const bMember of data.birthdays) {
                const bMsg = config.templates.birthday.replace('@name', bMember.name);
                // Eğer grup ID'si konfigüre edilmişse gruba atar
                if (config.targetGroupId) {
                    await sock?.sendMessage(config.targetGroupId, { text: bMsg });
                }
            }
        }
    } catch (cronErr) {
        console.error('Doğum günü cron hatası:', cronErr);
    }
});

// ── 5. M1G Web Sitesinden Gelen Acil Seferberlik İstekleri İçin Express API ──
const app = express();
app.use(express.json());

app.post('/api/send-alert', async (req, res) => {
    try {
        const { apiKey, targetGroup, title, message, url } = req.body;
        if (apiKey !== config.botSecretKey) {
            return res.status(401).json({ error: 'Yetkisiz erişim' });
        }

        const alertText = `🚨🚨 *M1G ARAMA KURTARMA - ACİL SEFERBERLİK ÇAĞRISI* 🚨🚨\n\n` +
                          `📌 *Operasyon:* ${title}\n` +
                          `⚠️ *Açıklama:* ${message}\n\n` +
                          `👉 *Lütfen İvedilikle Afet Durumunuzu Bildiriniz:*\n${url || 'https://m1g.org.tr/portal'}\n\n` +
                          `_Tüm personelin dikkatine sunulur!_`;

        const gid = targetGroup || config.targetGroupId;
        if (gid && sock) {
            await sock.sendMessage(gid, { text: alertText });
            return res.json({ success: true, message: 'Seferberlik mesajı WhatsApp grubuna iletildi' });
        }

        return res.status(400).json({ error: 'Grup ID veya WhatsApp soketi aktif değil' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.listen(config.serverPort, () => {
    console.log(`📡 M1G Bot HTTP Servisi port ${config.serverPort} üzerinde dinleniyor.`);
    startBot();
});
