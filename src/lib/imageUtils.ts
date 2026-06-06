export const compressImage = async (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
            return resolve(file);
        }

        // Eğer dosya 500KB'den küçükse hiç dokunma (Logo ve favikonların orjinalliği bozulmasın)
        if (file.size < 500 * 1024) {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(file);

                // Şeffaflığı korumak için canvas'ı temizle
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // Orijinal format PNG veya WEBP ise koru, değilse WEBP'ye çevir
                let outType = file.type;
                if (outType !== 'image/png' && outType !== 'image/webp') {
                    outType = 'image/webp';
                }

                canvas.toBlob(
                    (blob) => {
                        if (!blob) return resolve(file);
                        
                        const ext = outType === 'image/png' ? '.png' : '.webp';
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ext, {
                            type: outType, 
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    },
                    outType,
                    outType === 'image/png' ? undefined : quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};
