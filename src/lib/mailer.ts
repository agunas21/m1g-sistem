import nodemailer from 'nodemailer';

// M1G Özel E-posta Şablonları
const MAIL_TEMPLATES = {
    welcome: (fullName: string, id: string, tc: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050b14; color: #fff; padding: 30px; border-radius: 12px; border: 1px solid #222;">
            <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #333;">
                <h1 style="color: #ef4444; margin: 0; font-size: 22px; letter-spacing: 2px;">M1G ARAMA & KURTARMA</h1>
                <p style="color: #666; font-size: 11px; letter-spacing: 3px; margin: 4px 0 0;">OPERASYON YÖNETİM MERKEZİ</p>
            </div>
            <h2 style="color: #fff; font-size: 18px;">Aramıza Hoş Geldiniz, ${fullName}!</h2>
            <p style="color: #ccc; line-height: 1.7; font-size: 14px;">M1G Arama & Kurtarma platformuna üyeliğiniz onaylanmıştır. Ekibimizin değerli bir parçası olduğunuz için teşekkür ederiz.</p>
            <div style="background-color: #0d1117; padding: 20px; border-radius: 10px; margin: 24px 0; border: 1px dashed #ef4444;">
                <h3 style="color: #ef4444; margin-top: 0; font-size: 14px; letter-spacing: 1px;">GEÇİCİ GİRİŞ BİLGİLERİNİZ</h3>
                <p style="margin: 8px 0; font-size: 14px;"><strong style="color:#aaa;">Üye ID:</strong> <span style="color:#fff; font-family: monospace;">${id}</span></p>
                <p style="margin: 8px 0; font-size: 14px;"><strong style="color:#aaa;">Geçici Şifreniz:</strong> <span style="color:#fff; font-family: monospace;">${tc}</span></p>
                <p style="color: #666; font-size: 12px; margin-bottom: 0; margin-top: 12px;">İlk girişinizden sonra şifrenizi portal üzerinden değiştirmenizi öneririz.</p>
            </div>
            <div style="text-align: center; margin: 28px 0;">
                <a href="https://m1g.org.tr/login" style="display: inline-block; background-color: #ef4444; color: #fff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; letter-spacing: 1px;">PORTALA GİRİŞ YAP →</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #222; margin: 24px 0;" />
            <p style="color: #444; font-size: 11px; text-align: center;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız. © M1G Arama ve Kurtarma Derneği</p>
        </div>
    `,

    resetPassword: (fullName: string, resetLink: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050b14; color: #fff; padding: 30px; border-radius: 12px; border: 1px solid #222;">
            <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #333;">
                <h1 style="color: #f59e0b; margin: 0; font-size: 22px; letter-spacing: 2px;">M1G GÜVENLİK MERKEZİ</h1>
                <p style="color: #666; font-size: 11px; letter-spacing: 3px; margin: 4px 0 0;">ŞİFRE SIFIRLAMA TALEBİ</p>
            </div>
            <h2 style="color: #fff; font-size: 18px;">Sayın ${fullName},</h2>
            <p style="color: #ccc; line-height: 1.7; font-size: 14px;">Hesabınız için bir şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="display: inline-block; background-color: #f59e0b; color: #000; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; letter-spacing: 1px;">ŞİFREMİ SIFIRLA →</a>
            </div>
            <div style="background-color: #0d1117; padding: 16px; border-radius: 8px; border: 1px solid #333; margin: 20px 0;">
                <p style="color: #888; font-size: 12px; margin: 0;">⏰ Bu bağlantı <strong style="color:#f59e0b;">1 saat</strong> geçerlidir.</p>
                <p style="color: #888; font-size: 12px; margin: 8px 0 0;">🔒 Eğer bu işlemi siz talep etmediyseniz, bu e-postayı dikkate almayın ve derhal yönetim ile iletişime geçin: <a href="mailto:info@m1g.org.tr" style="color:#ef4444;">info@m1g.org.tr</a></p>
            </div>
            <hr style="border: 0; border-top: 1px solid #222; margin: 24px 0;" />
            <p style="color: #444; font-size: 11px; text-align: center;">Bu e-posta otomatik olarak gönderilmiştir. © M1G Arama ve Kurtarma Derneği</p>
        </div>
    `,

    notification: (title: string, message: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050b14; color: #fff; padding: 30px; border-radius: 12px; border: 1px solid #222;">
            <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #333;">
                <h1 style="color: #ef4444; margin: 0; font-size: 22px; letter-spacing: 2px;">M1G ARAMA & KURTARMA</h1>
            </div>
            <h2 style="color: #ef4444; font-size: 18px; margin-top: 0;">${title}</h2>
            <p style="color: #ccc; line-height: 1.7; font-size: 14px;">${message.replace(/\n/g, '<br/>')}</p>
            <hr style="border: 0; border-top: 1px solid #222; margin: 24px 0;" />
            <p style="color: #444; font-size: 11px; text-align: center;">Bu e-posta otomatik olarak gönderilmiştir. © M1G Arama ve Kurtarma Derneği</p>
        </div>
    `,

    magicLink: (fullName: string, loginUrl: string, expiresMinutes: number = 5) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050b14; color: #fff; padding: 30px; border-radius: 12px; border: 1px solid #222;">
            <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #333;">
                <h1 style="color: #ef4444; margin: 0; font-size: 22px; letter-spacing: 2px;">M1G ARAMA & KURTARMA</h1>
                <p style="color: #666; font-size: 11px; letter-spacing: 3px; margin: 4px 0 0;">ŞİFRESİZ GİRİŞ BAĞLANTISI</p>
            </div>
            <h2 style="color: #fff; font-size: 18px;">Sayın ${fullName},</h2>
            <p style="color: #ccc; line-height: 1.7; font-size: 14px;">
                M1G Operasyon Merkezi'ne giriş yapmak için aşağıdaki butona tıklayın.
                Şifrenizi girmenize gerek yok.
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; padding: 16px 40px; text-decoration: none; font-weight: bold; border-radius: 10px; font-size: 15px; letter-spacing: 1px; box-shadow: 0 4px 20px rgba(239,68,68,0.4);">
                    🔐 PORTALA GİRİŞ YAP →
                </a>
            </div>
            <div style="background-color: #0d1117; padding: 16px; border-radius: 8px; border: 1px solid #333; margin: 20px 0;">
                <p style="color: #f59e0b; font-size: 13px; margin: 0; font-weight: bold;">⏰ Bu bağlantı <strong>${expiresMinutes} dakika</strong> geçerlidir.</p>
                <p style="color: #888; font-size: 12px; margin: 8px 0 0;">🔒 Bağlantı yalnızca bir kez kullanılabilir. Kullandıktan sonra otomatik olarak geçersiz olur.</p>
                <p style="color: #888; font-size: 12px; margin: 8px 0 0;">⚠️ Bu isteği siz yapmadıysanız, bu e-postayı dikkate almayın ve derhal bildirim yapın: <a href="mailto:info@m1g.org.tr" style="color:#ef4444;">info@m1g.org.tr</a></p>
            </div>
            <hr style="border: 0; border-top: 1px solid #222; margin: 24px 0;" />
            <p style="color: #444; font-size: 11px; text-align: center;">Bu e-posta otomatik olarak gönderilmiştir. © M1G Arama ve Kurtarma Derneği</p>
        </div>
    `,

    totpSetup: (fullName: string, issuer: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050b14; color: #fff; padding: 30px; border-radius: 12px; border: 1px solid #222;">
            <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #333;">
                <h1 style="color: #8b5cf6; margin: 0; font-size: 22px; letter-spacing: 2px;">M1G GÜVENLİK MERKEZİ</h1>
                <p style="color: #666; font-size: 11px; letter-spacing: 3px; margin: 4px 0 0;">İKİ FAKTÖRLÜ KİMLİK DOĞRULAMA</p>
            </div>
            <h2 style="color: #fff; font-size: 18px;">Sayın ${fullName},</h2>
            <p style="color: #ccc; line-height: 1.7; font-size: 14px;">
                ${issuer} hesabınızda iki faktörlü kimlik doğrulama (MFA) başarıyla etkinleştirildi.
                Artık giriş yaparken Google Authenticator veya Microsoft Authenticator uygulamanızdaki
                6 haneli kodu girmeniz gerekecek.
            </p>
            <div style="background-color: #1e0a35; border: 1px solid #8b5cf6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #a78bfa; font-size: 13px; margin: 0; font-weight: bold;">🛡️ Hesabınız artık daha güvende!</p>
                <p style="color: #888; font-size: 12px; margin: 8px 0 0;">Yedek kodlarınızı güvenli bir yerde saklayın. Authenticator uygulamanıza erişimi kaybederseniz bu kodları kullanabilirsiniz.</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #222; margin: 24px 0;" />
            <p style="color: #444; font-size: 11px; text-align: center;">Bu e-posta otomatik olarak gönderilmiştir. © M1G Arama ve Kurtarma Derneği</p>
        </div>
    `,

    birthday: (fullName: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050b14; color: #fff; padding: 30px; border-radius: 12px; border: 1px solid #222;">
            <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #333;">
                <h1 style="color: #ef4444; margin: 0; font-size: 22px; letter-spacing: 2px;">M1G ARAMA & KURTARMA</h1>
                <p style="color: #666; font-size: 11px; letter-spacing: 3px; margin: 4px 0 0;">OPERASYON YÖNETİM MERKEZİ</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 48px; margin-bottom: 16px;">🎂🎉</div>
                <h2 style="color: #fff; font-size: 24px;">Doğum Gününüz Kutlu Olsun!</h2>
                <h3 style="color: #ef4444; font-size: 20px; margin-top: 8px;">Sayın ${fullName},</h3>
            </div>
            <p style="color: #ccc; line-height: 1.7; font-size: 15px; text-align: center;">
                M1G Arama ve Kurtarma Derneği ailesi olarak yeni yaşınızı en içten dileklerimizle kutlarız.<br/><br/>
                Sağlıklı, mutlu, huzurlu ve hayat kurtardığımız operasyonlarda omuz omuza olduğumuz nice güzel yıllara!
            </p>
            <hr style="border: 0; border-top: 1px solid #222; margin: 32px 0 24px 0;" />
            <p style="color: #444; font-size: 11px; text-align: center;">Bu e-posta otomatik olarak gönderilmiştir. © M1G Arama ve Kurtarma Derneği</p>
        </div>
    `,

    customMail: (title: string, message: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050b14; color: #fff; padding: 30px; border-radius: 12px; border: 1px solid #222;">
            <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #333;">
                <h1 style="color: #ef4444; margin: 0; font-size: 22px; letter-spacing: 2px;">M1G ARAMA & KURTARMA</h1>
                <p style="color: #666; font-size: 11px; letter-spacing: 3px; margin: 4px 0 0;">OPERASYON YÖNETİM MERKEZİ</p>
            </div>
            <h2 style="color: #fff; font-size: 18px; border-left: 4px solid #ef4444; padding-left: 12px;">${title}</h2>
            <div style="color: #ccc; line-height: 1.7; font-size: 14px; margin-top: 20px; white-space: pre-wrap;">${message}</div>
            <hr style="border: 0; border-top: 1px solid #222; margin: 32px 0 24px 0;" />
            <p style="color: #444; font-size: 11px; text-align: center;">Bu e-posta otomatik olarak gönderilmiştir. © M1G Arama ve Kurtarma Derneği</p>
        </div>
    `
};

// Transporter'ı bir kez oluştur (connection pool)
function createTransporter() {
    const pass = (process.env.SMTP_PASS || '').replace(/^["']|["']$/g, ''); // Başındaki/sonundaki tırnak işaretlerini temizle

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465, // Port 465 için true, diğerleri (örn 587) için false
        requireTLS: true, // TLS şifrelemesini zorunlu kıl
        auth: {
            user: process.env.SMTP_USER || 'info@m1g.org.tr',
            pass: pass,
        },
        tls: {
            rejectUnauthorized: false, // Self-signed sertifika sorunlarını engelle
            minVersion: 'TLSv1.2',
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
    });
}

export async function sendEmail(
    to: string,
    subject: string,
    templateKey: keyof typeof MAIL_TEMPLATES,
    templateArgs: any[]
): Promise<{ success: boolean; error?: string }> {

    // SMTP şifresi yoksa simülasyon modu
    if (!process.env.SMTP_PASS) {
        console.log('\n--- 📧 E-POSTA SİMÜLASYONU (SMTP_PASS tanımlı değil) ---');
        console.log(`Kime: ${to}\nKonu: ${subject}\n`);
        return { success: true };
    }

    try {
        const transporter = createTransporter();

        // Bağlantıyı doğrula
        await transporter.verify();

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const htmlContent = MAIL_TEMPLATES[templateKey](...templateArgs);

        await transporter.sendMail({
            from: `"M1G Operasyon Merkezi" <${process.env.SMTP_USER || 'info@m1g.org.tr'}>`,
            to,
            subject,
            html: htmlContent,
        });

        return { success: true };
    } catch (error: any) {
        console.error('Email sending failed:', error);
        return { success: false, error: error.message || 'Bilinmeyen SMTP hatası' };
    }
}
