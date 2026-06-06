export const compressImage = async (file: File, maxWidth = 1920, quality = 0.7): Promise<File> => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            return resolve(file); // Only compress images
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
                if (!ctx) {
                    return resolve(file);
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) return resolve(file);
                        
                        // Preserve transparency by using webp (or png if preferred, but webp is much smaller)
                        // webp supports both transparency and lossy compression!
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                            type: 'image/webp', 
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};
