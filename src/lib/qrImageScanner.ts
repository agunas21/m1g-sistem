import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

/**
 * High-performance QR Code reader from image files (Gallery photos).
 * Handles high-resolution mobile photos (12MP+) by downscaling to max 1000px
 * on an offscreen HTML5 canvas to prevent ZXing matrix timeouts and memory issues.
 */
export async function scanQRFromFile(file: File): Promise<string> {
    if (!file) throw new Error("Dosya seçilmedi.");

    // Ensure a temporary DOM element exists for Html5Qrcode
    let tempDiv = document.getElementById("temp-qr-file-container");
    if (!tempDiv) {
        tempDiv = document.createElement("div");
        tempDiv.id = "temp-qr-file-container";
        tempDiv.style.display = "none";
        document.body.appendChild(tempDiv);
    }

    const tempScanner = new Html5Qrcode("temp-qr-file-container");

    // Helper: Clean up temporary scanner
    const cleanup = async () => {
        try {
            await tempScanner.clear();
        } catch {}
    };

    // 1. Try scanning original file directly
    try {
        const directResult = await tempScanner.scanFile(file, false);
        await cleanup();
        if (directResult) return directResult;
    } catch (e) {
        // Direct scan failed (likely high resolution photo or contrast issue), proceed to preprocessing
    }

    // 2. Preprocess & downscale high-resolution photo on Canvas
    try {
        const resizedBlob = await resizeImageForQR(file, 1000);
        const resizedFile = new File([resizedBlob], "qr_processed.jpg", { type: "image/jpeg" });
        
        const resizedResult = await tempScanner.scanFile(resizedFile, false);
        await cleanup();
        if (resizedResult) return resizedResult;
    } catch (e) {
        // Resized scan failed
    }

    // 3. Try fallback with higher contrast enhancement at 800px
    try {
        const contrastBlob = await resizeImageForQR(file, 800, true);
        const contrastFile = new File([contrastBlob], "qr_contrast.jpg", { type: "image/jpeg" });

        const contrastResult = await tempScanner.scanFile(contrastFile, false);
        await cleanup();
        if (contrastResult) return contrastResult;
    } catch (e) {
        await cleanup();
        throw new Error("QR kod okunamadı. Lütfen daha net ve dik çekilmiş bir fotoğraf yükleyin.");
    }

    await cleanup();
    throw new Error("QR kod bulunamadı.");
}

/**
 * Resizes an image file to maxDimension and optionally applies contrast enhancement.
 */
function resizeImageForQR(file: File, maxDimension: number, applyContrast = false): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            let width = img.width;
            let height = img.height;

            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                reject(new Error("Canvas context oluşturulamadı."));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            if (applyContrast) {
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                // Increase contrast & greyscale
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    const v = avg > 128 ? Math.min(255, avg * 1.2) : Math.max(0, avg * 0.8);
                    data[i] = v;     // R
                    data[i + 1] = v; // G
                    data[i + 2] = v; // B
                }
                ctx.putImageData(imageData, 0, 0);
            }

            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Canvas blob oluşturulamadı."));
                },
                "image/jpeg",
                0.92
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Görsel yüklenemedi."));
        };

        img.src = url;
    });
}
