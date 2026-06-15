/**
 * uploadDirect — Tarayıcıdan doğrudan Cloudinary'e yükleme
 *
 * Vercel origin'i BYPASSlayarak çalışır.
 * Browser → Cloudinary CDN (hiç Vercel sunucusuna uğramaz)
 *
 * Gereksinimler:
 *   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (env)
 *   - NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET (env, unsigned preset)
 *
 * Cloudinary'de preset oluşturmak için:
 *   Settings → Upload → Upload Presets → Add upload preset
 *   Mode: Unsigned, Folder: m1g_uploads
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Dosyayı doğrudan Cloudinary'e yükler.
 * @param file - File nesnesi (input[type=file]'dan gelen)
 * @param folder - Cloudinary klasörü (varsayılan: m1g_uploads)
 * @param onProgress - İlerleme callback'i (0-100)
 */
export async function uploadDirect(
  file: File,
  folder = 'm1g_uploads',
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary env değişkenleri eksik: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ve NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET'
    );
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // İlerleme takibi
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
        });
      } else {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err?.error?.message || 'Cloudinary yükleme hatası'));
      }
    };

    xhr.onerror = () => reject(new Error('Ağ hatası — yükleme tamamlanamadı'));

    xhr.open('POST', url);
    xhr.send(formData);
  });
}
