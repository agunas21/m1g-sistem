import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Public client (client-side safe)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client (server-side only — Storage uploads, bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

/**
 * Hasar fotoğrafı Supabase Storage'a yükler.
 * Returns the public URL.
 */
export async function uploadDamagePhoto(
    file: File | Blob,
    itemId: string,
    operationId: string
): Promise<string | null> {
    try {
        const timestamp = Date.now()
        const ext = file instanceof File ? file.name.split('.').pop() ?? 'jpg' : 'jpg'
        const path = `damage-photos/${operationId}/${itemId}_${timestamp}.${ext}`

        const { error } = await supabaseAdmin.storage
            .from('m1g-assets')
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file instanceof File ? file.type : 'image/jpeg'
            })

        if (error) {
            console.error('Storage upload error:', error.message)
            return null
        }

        const { data } = supabaseAdmin.storage
            .from('m1g-assets')
            .getPublicUrl(path)

        return data.publicUrl
    } catch (e) {
        console.error('uploadDamagePhoto error:', e)
        return null
    }
}

/**
 * Herhangi bir dosyayı Storage'a yükler.
 */
export async function uploadToStorage(
    buffer: Buffer | Blob,
    path: string,
    contentType = 'application/octet-stream'
): Promise<string | null> {
    try {
        const { error } = await supabaseAdmin.storage
            .from('m1g-assets')
            .upload(path, buffer, { contentType, upsert: true })

        if (error) return null

        const { data } = supabaseAdmin.storage
            .from('m1g-assets')
            .getPublicUrl(path)

        return data.publicUrl
    } catch {
        return null
    }
}
