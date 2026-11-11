export type CertificateType = 'operasyon' | 'destekci';

export const CERTIFICATE_TEMPLATES: Record<
  CertificateType,
  {
    src: string;
    label: string;
    nameYRatio: number; // Y coordinate ratio (0..1) right below "SAYIN" and above the divider line
    defaultSubject: string;
  }
> = {
  operasyon: {
    src: '/certificates/operasyon-tesekkur.jpg',
    label: 'Operasyon Teşekkür Belgesi (Saha Görevlisi / Gönüllü)',
    nameYRatio: 0.506, // Exact center between SAYIN (0.458) and top line (0.553)
    defaultSubject: 'Operasyon Teşekkür Belgeniz — M1G Arama ve Kurtarma Derneği'
  },
  destekci: {
    src: '/certificates/destekci-tesekkur.jpg',
    label: 'Destekçi Teşekkür Belgesi (Bağışçı / Kurum / Gönüllü Destekçi)',
    nameYRatio: 0.532, // Exact center between SAYIN (0.458) and top line (0.608)
    defaultSubject: 'Teşekkür Belgeniz — M1G Arama ve Kurtarma Derneği'
  }
};

export async function generateCertificateDataUrl(
  type: CertificateType,
  fullName: string
): Promise<string> {
  if (typeof window === 'undefined') return '';
  const config = CERTIFICATE_TEMPLATES[type] || CERTIFICATE_TEMPLATES.operasyon;
  const cleanName = (fullName || 'DEĞERLİ GÖNÜLLÜMÜZ').trim().toLocaleUpperCase('tr-TR');

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || 1000;
        const h = img.naturalHeight || 707;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context oluşturulamadı'));
          return;
        }

        // 1. Orijinal belge şablonunu çiz
        ctx.drawImage(img, 0, 0, w, h);

        // 2. SAYIN yazısının hemen altındaki boşluğa (diğer yazıları ezmeden) ismi yerleştir
        const baseFontSize = Math.round(w * 0.028); // 1000px genişlikte ~28px
        const maxTextWidth = w * 0.58; // Kenar süslerine ve çizgi dışına taşmasın

        let fontSize = baseFontSize;
        ctx.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`;
        while (ctx.measureText(cleanName).width > maxTextWidth && fontSize > 14) {
          fontSize -= 1;
          ctx.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`;
        }

        const x = w / 2;
        const y = h * config.nameYRatio;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#111827';
        ctx.fillText(cleanName, x, y);

        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Sertifika şablon görseli yüklenemedi'));
    img.src = config.src;
  });
}

export async function downloadCertificateImage(
  type: CertificateType,
  fullName: string
): Promise<void> {
  const dataUrl = await generateCertificateDataUrl(type, fullName);
  if (!dataUrl) return;
  const safeSlug = (fullName || 'belge')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-z0-9ğüşıöç]/gi, '-')
    .replace(/-+/g, '-');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `M1G-Tesekkur-Belgesi-${safeSlug}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

