import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a base64 Data URI to Cloudinary.
 * Applies f_auto (auto format like webp) and q_auto (auto quality compression).
 */
export async function uploadToCloudinary(dataUri: string, folder: string = "m1g_uploads"): Promise<string> {
    const result = await cloudinary.uploader.upload(dataUri, {
        folder: folder,
        fetch_format: "auto", // Automatically format to WebP/AVIF if supported
        quality: "auto",      // Automatically optimize quality (massive bandwidth savings)
    });
    return result.secure_url;
}

export { cloudinary };
