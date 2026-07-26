import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "student-photos";
const MAX_BYTES = 8 * 1024 * 1024; // 8MB, generous headroom for a phone camera photo
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour, regenerated on each page load

/**
 * Uploads a student's photo to the private student-photos bucket. Path is
 * "<student_id>/<timestamp>.<ext>" so storage RLS can check ownership by
 * pulling student_id out of the path (see migration 0008).
 */
export async function uploadStudentPhoto(
  supabase: SupabaseClient,
  studentId: string,
  file: File
): Promise<{ path?: string; error?: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "Photo must be an image file." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Photo is too large (max 8MB)." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${studentId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { error: error.message };
  return { path };
}

export async function getStudentPhotoUrl(
  supabase: SupabaseClient,
  photoPath: string | null | undefined
): Promise<string | null> {
  if (!photoPath) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(photoPath, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data.signedUrl;
}

export async function deleteStudentPhoto(supabase: SupabaseClient, photoPath: string) {
  await supabase.storage.from(BUCKET).remove([photoPath]);
}
