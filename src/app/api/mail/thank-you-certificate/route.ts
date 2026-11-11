import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import sharp from 'sharp';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

async function renderServerCertificateBuffer(
  type: 'operasyon' | 'destekci',
  fullName: string
): Promise<Buffer> {
  const isOp = type === 'operasyon';
  const filePath = path.join(
    process.cwd(),
    'public',
    'certificates',
    isOp ? 'operasyon-tesekkur.jpg' : 'destekci-tesekkur.jpg'
  );
  const meta = await sharp(filePath).metadata();
  const w = meta.width || 1000;
  const h = meta.height || 707;
  const yRatio = isOp ? 0.506 : 0.532;
  const yPos = Math.round(h * yRatio);
  const cleanName = (fullName || 'DEĞERLİ GÖNÜLLÜMÜZ')
    .trim()
    .toLocaleUpperCase('tr-TR')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const fontSize = Math.round(w * 0.027);

  const svgOverlay = Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .recipient {
          fill: #0f172a;
          font-size: ${fontSize}px;
          font-weight: 800;
          letter-spacing: 2.5px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
      </style>
      <text x="${Math.round(w / 2)}" y="${yPos}" text-anchor="middle" dominant-baseline="middle" class="recipient">${cleanName}</text>
    </svg>
  `);

  return sharp(filePath)
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toBuffer();
}

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
  const todayFormatted = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  const docRef = `M1G-TB/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

  const docTitle = isOp ? 'OPERASYON TEŞEKKÜR BELGESİ' : 'KURUMSAL DESTEKÇİ TEŞEKKÜR BELGESİ';
  const docContext = isOp
    ? (operationName ? `${operationName.toLocaleUpperCase('tr-TR')} OPERASYONU` : 'ARAMA KURTARMA OPERASYONU')
    : 'İNSANİ YARDIM VE AFET DESTEK PROTOKOLÜ';

  const bodyParagraphs = isOp
    ? `
      <p style="margin: 0 0 16px 0; color: #1e293b; font-size: 15px; line-height: 1.8; text-align: justify;">
        M1G Arama ve Kurtarma Derneği bünyesinde icra edilen <strong>${operationName || 'Arama Kurtarma'}</strong> operasyonunda ekibimizin bir parçası olarak sahada fedakârca görev alarak hayat kurtarma mücadelemize sunduğunuz paha biçilemez katkılar vesilesiyle bu teşekkür belgesi tarafınıza takdim edilmiştir.
      </p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 14.5px; line-height: 1.8; text-align: justify;">
        Arama kurtarma faaliyetleri; fiziki kabiliyetin ötesinde sarsılmaz bir vicdan, yüksek disiplin ve ekip ruhu gerektirir. Bu zorlu süreçte canla başla ortaya koyduğunuz özverili emek ve azim için şahsım, yönetim kurulumuz ve derneğimiz adına en derin şükranlarımı sunarım.
      </p>
    `
    : `
      <p style="margin: 0 0 16px 0; color: #1e293b; font-size: 15px; line-height: 1.8; text-align: justify;">
        M1G Arama ve Kurtarma Derneği&rsquo;nin afet müdahale, teknik hazırlık ve insani yardım hedeflerine duyduğunuz inanç ve sağladığınız kıymetli destekler vesilesiyle bu kurumsal teşekkür belgesi tarafınıza takdim edilmiştir.
      </p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 14.5px; line-height: 1.8; text-align: justify;">
        Dayanışma ve karşılıksız destek, afet sahasında nice hayata uzanan umut zincirinin en sağlam halkasıdır. Yanımızda durarak gücümüze güç kattığınız ve insan hayatına değer verdiğiniz için yönetim kurulumuz ve tüm gönüllülerimiz adına kalpten teşekkür ederiz.
      </p>
    `;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${docTitle}</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <div style="max-width: 660px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);">
        
        <!-- Üst Kurumsal Kırmızı & Lacivert Çift Şerit -->
        <div style="height: 6px; background: linear-gradient(90deg, #991b1b 0%, #dc2626 40%, #0f172a 100%);"></div>

        <!-- Başlık & Kurum Bilgisi Anteti -->
        <div style="padding: 28px 36px 20px 36px; border-bottom: 1px solid #f1f5f9;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="middle" align="left" style="width: 70%;">
                <div style="font-size: 15px; font-weight: 900; letter-spacing: 1.2px; color: #0f172a; text-transform: uppercase;">
                  M1G ARAMA VE KURTARMA DERNEĞİ
                </div>
                <div style="font-size: 11px; font-weight: 700; color: #991b1b; letter-spacing: 1.5px; margin-top: 3px; text-transform: uppercase;">
                  GENEL MERKEZ YÖNETİM KURULU BAŞKANLIĞI
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                  ${docContext}
                </div>
              </td>
              <td valign="middle" align="right" style="width: 30%; font-size: 11px; color: #64748b; line-height: 1.5; font-family: monospace;">
                <div><strong>Tarih:</strong> ${todayFormatted}</div>
                <div><strong>Sayı:</strong> ${docRef}</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Mektup Gövdesi -->
        <div style="padding: 32px 36px 24px 36px;">
          
          <div style="margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 800; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase;">
              Sayın
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; margin-top: 4px; padding-bottom: 8px; border-bottom: 2px solid #0f172a; display: inline-block;">
              ${cleanUpperName}
            </div>
          </div>

          ${bodyParagraphs}

          ${
            customNote
              ? `
              <div style="margin: 20px 0; padding: 14px 18px; background-color: #f8fafc; border-left: 3px solid #991b1b; border-radius: 4px; color: #334155; font-size: 13.5px; line-height: 1.7; font-style: italic;">
                ${customNote.replace(/\n/g, '<br/>')}
              </div>
              `
              : ''
          }

          <!-- Belge Görseli Çerçevesi (Temiz & Şık) -->
          ${
            hasCidImage
              ? `
              <div style="margin: 28px 0 20px 0; padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
                <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 10px; letter-spacing: 0.5px;">
                  RESMİ DİJİTAL BELGE ASLI:
                </div>
                <img src="cid:m1g_certificate_img" alt="M1G Teşekkür Belgesi - ${cleanUpperName}" style="display: block; width: 100%; max-width: 580px; height: auto; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 4px; box-shadow: 0 4px 14px rgba(0,0,0,0.06);" />
                <div style="font-size: 11px; color: #64748b; margin-top: 8px;">
                  (Belgenizin yüksek çözünürlüklü baskı kopyası işbu e-postanın ekinde de yer almaktadır.)
                </div>
              </div>
              `
              : ''
          }

          <!-- İmza Bloğu (Kurumsal Sağ Hizalama) -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
            <tr>
              <td style="width: 50%;"></td>
              <td align="center" style="width: 50%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">
                  M1G ARAMA VE KURTARMA DERNEĞİ
                </div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 2px;">
                  YÖNETİM KURULU BAŞKANI
                </div>
                <div style="font-size: 16px; font-weight: 900; color: #991b1b; letter-spacing: 1px; margin-top: 8px;">
                  CEM GÖRGÜL
                </div>
              </td>
            </tr>
          </table>

        </div>

        <!-- Alt Bilgi / Kurumsal Footer -->
        <div style="padding: 18px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6;">
          <div>M1G Arama ve Kurtarma Derneği Genel Merkezi • İzmir / TÜRKİYE</div>
          <div>Web: <a href="https://m1g.org.tr" style="color: #991b1b; text-decoration: none; font-weight: 600;">m1g.org.tr</a> • E-Posta: <a href="mailto:info@m1g.org.tr" style="color: #0f172a; text-decoration: none;">info@m1g.org.tr</a></div>
          <div style="margin-top: 4px; font-size: 10px; color: #94a3b8;">
            Bu belge resmi bildirim niteliğinde olup sistem tarafından oluşturulmuştur.
          </div>
        </div>

      </div>
    </body>
    </html>
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

        let imgBuffer: Buffer | null = null;
        if (rec.certificateDataUrl && rec.certificateDataUrl.startsWith('data:image/')) {
          const base64Part = rec.certificateDataUrl.split(',')[1];
          if (base64Part) {
            imgBuffer = Buffer.from(base64Part, 'base64');
          }
        } else {
          imgBuffer = await renderServerCertificateBuffer(type, rec.fullName);
        }

        if (imgBuffer) {
          const safeName = rec.fullName
            .trim()
            .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s-]/g, '')
            .replace(/\s+/g, '-');
          attachments.push({
            filename: `M1G-Tesekkur-Belgesi-${safeName}.jpg`,
            content: imgBuffer,
            contentType: 'image/jpeg',
            cid: 'm1g_certificate_img'
          });
          hasCidImage = true;
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

