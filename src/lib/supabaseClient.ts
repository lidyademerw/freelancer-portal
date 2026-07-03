import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nxsuxtmtrklfvhicdjzk.supabase.co';
const supabaseAnonKey = 'sb_publishable_auBCqTTK7cZPDwWhKK_oDg_EIkc-igp';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Lazily initialized client to prevent crashing if keys are missing
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Uploads a file to Supabase Storage if configured.
 * Falls back to base64 Data URL if not configured or if upload fails.
 */
export async function uploadFileToStorage(
  bucketName: string,
  filePath: string,
  file: File
): Promise<{ url: string; error: string | null }> {
  if (!supabase) {
    return { url: '', error: 'Supabase is not configured' };
  }

  try {
    // 1. Ensure bucket exists (attempt to create it or just upload)
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return { url: '', error: uploadError.message };
    }

    // 2. Get public URL
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return { url: data.publicUrl, error: null };
  } catch (err: any) {
    return { url: '', error: err.message || 'Storage upload exception' };
  }
}
