require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    const user = process.env.SMTP_USER;
    const pass = (process.env.SMTP_PASS || '').replace(/^["']|["']$/g, '');

    console.log('SMTP Ayarları:');
    console.log('  Host:', host);
    console.log('  Port:', port);
    console.log('  User:', user);
    console.log('  Pass:', pass ? pass.substring(0, 5) + '***' : 'YOK');
    console.log('');

    const transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: port === 465,
        auth: { user, pass },
        tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2',
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });

    console.log('SMTP bağlantısı test ediliyor...');
    try {
        await transporter.verify();
        console.log('✅ SMTP bağlantısı BAŞARILI!\n');
    } catch (err) {
        console.error('❌ SMTP bağlantı hatası:', err.message);
        console.error('Detay:', err.code || err.response || '');
        console.log('\nOlası sorunlar:');
        console.log('1. Şifre yanlış veya değişmiş');
        console.log('2. Hostinger SMTP sunucusu erişime kapalı');
        console.log('3. Port engelli');
        return;
    }

    // Test maili gönder
    console.log('Test maili gönderiliyor...');
    try {
        const info = await transporter.sendMail({
            from: `"M1G Test" <${user}>`,
            to: user, // kendisine gönder
            subject: 'M1G SMTP Test',
            html: '<h1>SMTP çalışıyor!</h1><p>Bu bir test mailidir.</p>',
        });
        console.log('✅ Mail gönderildi! MessageID:', info.messageId);
    } catch (err) {
        console.error('❌ Mail gönderim hatası:', err.message);
    }
}

testSMTP();
