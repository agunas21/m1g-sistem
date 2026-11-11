import dotenv from 'dotenv';
import path from 'path';
import sharp from 'sharp';
import nodemailer from 'nodemailer';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function run() {
  const w = 1000, h = 707;
  const yPos = Math.round(h * 0.506);
  const cleanName = 'BERKAY GÜNASLAN';
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

  const certBuffer = await sharp('public/certificates/operasyon-tesekkur.jpg')
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toBuffer();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER || 'info@m1g.org.tr',
      pass: (process.env.SMTP_PASS || '').replace(/^["']|["']$/g, '')
    }
  });

  const todayFormatted = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="utf-8">
      <title>OPERASYON TEŞEKKÜR BELGESİ</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 660px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);">
        <div style="height: 6px; background: linear-gradient(90deg, #991b1b 0%, #dc2626 40%, #0f172a 100%);"></div>
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
                  AFET VE ACİL DURUM OPERASYONLARI
                </div>
              </td>
              <td valign="middle" align="right" style="width: 30%; font-size: 11px; color: #64748b; line-height: 1.5; font-family: monospace;">
                <div><strong>Tarih:</strong> ${todayFormatted}</div>
                <div><strong>Sayı:</strong> M1G-TB/2026/0438</div>
              </td>
            </tr>
          </table>
        </div>
        <div style="padding: 32px 36px 24px 36px;">
          <div style="margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 800; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase;">
              Sayın
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; margin-top: 4px; padding-bottom: 8px; border-bottom: 2px solid #0f172a; display: inline-block;">
              ${cleanName}
            </div>
          </div>
          <p style="margin: 0 0 16px 0; color: #1e293b; font-size: 15px; line-height: 1.8; text-align: justify;">
            M1G Arama ve Kurtarma Derneği bünyesinde icra edilen arama kurtarma faaliyetlerinde ekibimizin bir parçası olarak sahada fedakârca görev alarak hayat kurtarma mücadelemize sunduğunuz paha biçilemez katkılar vesilesiyle bu teşekkür belgesi tarafınıza takdim edilmiştir.
          </p>
          <p style="margin: 0 0 16px 0; color: #334155; font-size: 14.5px; line-height: 1.8; text-align: justify;">
            Arama kurtarma faaliyetleri; fiziki kabiliyetin ötesinde sarsılmaz bir vicdan, yüksek disiplin ve ekip ruhu gerektirir. Bu zorlu süreçte canla başla ortaya koyduğunuz özverili emek ve azim için şahsım, yönetim kurulumuz ve derneğimiz adına en derin şükranlarımı sunarım.
          </p>
          <div style="margin: 28px 0 20px 0; padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 10px; letter-spacing: 0.5px;">
              RESMİ DİJİTAL BELGE ASLI:
            </div>
            <img src="cid:m1g_cert_img" alt="M1G Teşekkür Belgesi" style="display: block; width: 100%; max-width: 580px; height: auto; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 4px; box-shadow: 0 4px 14px rgba(0,0,0,0.06);" />
            <div style="font-size: 11px; color: #64748b; margin-top: 8px;">
              (Belgenizin yüksek çözünürlüklü baskı kopyası işbu e-postanın ekinde de yer almaktadır.)
            </div>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
            <tr>
              <td style="width: 50%;"></td>
              <td align="center" style="width: 50%;">
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
        <div style="padding: 18px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6;">
          <div>M1G Arama ve Kurtarma Derneği Genel Merkezi • İzmir / TÜRKİYE</div>
          <div>Web: <a href="https://m1g.org.tr" style="color: #991b1b; text-decoration: none; font-weight: 600;">m1g.org.tr</a> • E-Posta: <a href="mailto:info@m1g.org.tr" style="color: #0f172a; text-decoration: none;">info@m1g.org.tr</a></div>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: '"M1G Arama ve Kurtarma Derneği" <' + (process.env.SMTP_USER || 'info@m1g.org.tr') + '>',
    to: 'gunaslanberkay@gmail.com',
    subject: 'M1G Arama ve Kurtarma Derneği — Resmi Teşekkür Belgesi Takdimi',
    html,
    attachments: [{
      filename: 'M1G-Operasyon-Tesekkur-Belgesi-Berkay-Gunaslan.jpg',
      content: certBuffer,
      contentType: 'image/jpeg',
      cid: 'm1g_cert_img'
    }]
  });

  console.log('SENT_SUCCESSFULLY_ID:', info.messageId);
}

run().catch(console.error);

