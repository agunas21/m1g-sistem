import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

function createTransporter() {
  const pass = (process.env.SMTP_PASS || '').replace(/^["']|["']$/g, '');
  const user = process.env.SMTP_USER || 'info@m1g.org.tr';
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';

  if (host === 'smtp.gmail.com' || user.toLowerCase().includes('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    requireTLS: true,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  });
}

interface CertificateRecipientInput {
  email: string;
  fullName: string;
  certificateDataUrl?: string;
}

function buildCertificateEmailHtml(params: {
  fullName: string;
  type: 'operasyon' | 'destekci';
  operationName?: string;
  customNote?: string;
  hasCidImage: boolean;
}) {
  const { fullName, type, operationName, customNote, hasCidImage } = params;
  const isOp = type === 'operasyon';
  const cleanUpperName = (fullName || 'DEĞERLİ GÖNÜLLÜMÜZ').toLocaleUpperCase('tr-TR');

  const subtitle = isOp
    ? operationName
      ? `${operationName} — Operasyon Teşekkür Belgesi`
      : 'Arama & Kurtarma Operasyonu Teşekkür Belgesi'
    : 'M1G Arama ve Kurtarma Derneği — Destekçi Teşekkür Belgesi';

  const bodyText = isOp
    ? `Son gerçekleştirdiğimiz <strong>${operationName || 'arama kurtarma'}</strong> operasyonunda ekibimizin bir parçası olarak sahada bizimle omuz omuza görev aldığınız için size en içten teşekkürlerimizi sunarız.<br/><br/>Arama kurtarma faaliyetleri; fiziksel gücün ötesinde büyük bir inanç, merhamet ve takım ruhu gerektirir. Siz, bu zorlu süreçte elinizi taşın altına koyarak bir cana umut, bir aileye teselli olmak için zamanınızı ve emeğinizi karşılıksız sundunuz. İyi ki varsınız.`
    : `Dayanışma, umudu büyütür.<br/><br/><strong>M1G Arama ve Kurtarma Derneği</strong>'nin yanında olarak, hem bizlere güç verdiniz hem de nice canlara umut oldunuz. Desteğiniz için kalpten teşekkür ederiz.`;

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 680px; margin: 0 auto; background-color: #050b14; color: #ffffff; padding: 28px; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="text-align: center; padding-bottom: 18px; border-bottom: 1px solid #1e293b; margin-bottom: 22px;">
        <h1 style="color: #ef4444; margin: 0; font-size: 22px; letter-spacing: 2px;">M1G ARAMA VE KURTARMA DERNEĞİ</h1>
        <p style="color: #94a3b8; font-size: 11px; letter-spacing: 2px; margin: 6px 0 0; text-transform: uppercase;">${subtitle}</p>
      </div>

      <h2 style="color: #f8fafc; font-size: 18px; text-align: center; margin-bottom: 14px;">
        SAYIN <span style="color: #ef4444;">${cleanUpperName}</span>,
      </h2>

      <p style="color: #cbd5e1; line-height: 1.75; font-size: 14px; text-align: center; margin: 0 12px 20px;">
        ${bodyText}
      </p>

      ${
        customNote
          ? `<div style="background-color: #0f172a; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 8px; margin: 16px 0 22px; color: #e2e8f0; font-size: 13px; line-height: 1.6;">
              ${customNote.replace(/\n/g, '<br/>')}
            </div>`
          : ''
      }

      ${
        hasCidImage
          ? `<div style="text-align: center; margin: 22px 0;">
              <p style="color: #94a3b8; font-size: 12px; margin-bottom: 10px;">🎖️ <strong>İsminize Özel Hazırlanan Teşekkür Belgeniz:</strong> (Ekte yüksek çözünürlüklü olarak da yer almaktadır)</p>
              <img src="cid:m1g_certificate_img" alt="M1G Teşekkür Belgesi - ${cleanUpperName}" style="max-width: 100%; height: auto; border-radius: 10px; border: 2px solid #ef4444; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
            </div>`
          : ''
      }

      <div style="text-align: center; margin-top: 24px; padding-top: 18px; border-top: 1px solid #1e293b;">
        <p style="color: #f8fafc; font-size: 13px; font-weight: bold; margin: 0;">M1G ARAMA VE KURTARMA DERNEĞİ BAŞKANI</p>
        <p style="color: #ef4444; font-size: 15px; font-weight: bold; margin: 4px 0 14px; letter-spacing: 1px;">CEM GÖRGÜL</p>
        <p style="color: #64748b; font-size: 11px; margin: 0;">© M1G Arama ve Kurtarma Derneği • Resmi Teşekkür Belgesi Bildirimi</p>
      </div>
    </div>
  `;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('m1g_session')?.value;
    const payload = token ? verifyJwt(token) : null;
    if (!payload || (!payload.isAdmin && !payload.isSuperAdmin)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const body = await req.json();
    const type: 'operasyon' | 'destekci' = body.type === 'destekci' ? 'destekci' : 'operasyon';
    const operationName: string | undefined = body.operationName;
    const customNote: string | undefined = body.customNote;

    const list: CertificateRecipientInput[] = Array.isArray(body.recipients)
      ? body.recipients
      : body.email && body.fullName
      ? [{ email: body.email, fullName: body.fullName, certificateDataUrl: body.certificateDataUrl }]
      : [];

    const validRecipients = list.filter(
      r => r && typeof r.email === 'string' && r.email.includes('@') && typeof r.fullName === 'string' && r.fullName.trim().length > 0
    );

    if (validRecipients.length === 0) {
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi ve Ad Soyad bilgisi bulunamadı.' },
        { status: 400 }
      );
    }

    const subject =
      body.subject ||
      (type === 'operasyon'
        ? `${operationName ? `${operationName} — ` : ''}Operasyon Teşekkür Belgeniz | M1G Arama ve Kurtarma Derneği`
        : 'Teşekkür Belgeniz | M1G Arama ve Kurtarma Derneği');

    // SMTP_PASS yoksa simülasyon modu
    if (!process.env.SMTP_PASS) {
      console.log('--- 🎖️ TEŞEKKÜR BELGESİ E-POSTA SİMÜLASYONU ---');
      console.log('Tür:', type, 'Alıcı Sayısı:', validRecipients.length);
      return NextResponse.json({
        success: true,
        simulated: true,
        sentCount: validRecipients.length,
        sentTo: validRecipients.map(r => `${r.fullName} (${r.email})`),
        message: `${validRecipients.length} kişiye Teşekkür Belgesi e-postası başarıyla işlendi (Simülasyon Modu).`
      });
    }

    const transporter = createTransporter();
    await transporter.verify();

    let sentCount = 0;
    const sentTo: string[] = [];
    const errors: string[] = [];

    for (const rec of validRecipients) {
      try {
        const attachments: any[] = [];
        let hasCidImage = false;

        if (rec.certificateDataUrl && rec.certificateDataUrl.startsWith('data:image/')) {
          const base64Part = rec.certificateDataUrl.split(',')[1];
          if (base64Part) {
            const safeName = rec.fullName
              .trim()
              .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s-]/g, '')
              .replace(/\s+/g, '-');
            const imgBuffer = Buffer.from(base64Part, 'base64');
            attachments.push({
              filename: `M1G-Tesekkur-Belgesi-${safeName}.jpg`,
              content: imgBuffer,
              contentType: 'image/jpeg',
              cid: 'm1g_certificate_img'
            });
            hasCidImage = true;
          }
        }

        const html = buildCertificateEmailHtml({
          fullName: rec.fullName.trim(),
          type,
          operationName,
          customNote,
          hasCidImage
        });

        await transporter.sendMail({
          from: `"M1G Arama ve Kurtarma Derneği" <${process.env.SMTP_USER || 'info@m1g.org.tr'}>`,
          to: rec.email.trim(),
          subject,
          html,
          attachments
        });

        sentCount++;
        sentTo.push(`${rec.fullName} (${rec.email})`);
      } catch (err: any) {
        console.error('Teşekkür belgesi mail hatası:', rec.email, err);
        errors.push(`${rec.fullName}: ${err.message || 'Gönderilemedi'}`);
      }
    }

    return NextResponse.json({
      success: sentCount > 0,
      sentCount,
      sentTo,
      errors,
      message:
        sentCount > 0
          ? `${sentCount} kişiye ismine özel Teşekkür Belgesi e-postası gönderildi.`
          : `E-posta gönderilemedi: ${errors.join(', ')}`
    });
  } catch (error: any) {
    console.error('Thank-you certificate API error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata') },
      { status: 500 }
    );
  }
}

