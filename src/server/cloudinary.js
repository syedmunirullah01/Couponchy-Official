import "server-only";
import { supabase } from "@/lib/supabase";

/**
 * Uploads an image buffer to Supabase Storage.
 * Retains the Cloudinary function name to avoid breaking file imports elsewhere.
 * 
 * @param {Buffer} buffer - The image file buffer.
 * @param {Object} options - Options containing folder, public_id, and contentType.
 * @returns {Promise<Object>} Object containing public_id and secure_url.
 */
export async function uploadImageBuffer(buffer, options = {}) {
  const bucketName = "couponchy";

  // 1. Ensure the public bucket exists
  try {
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket(bucketName);
    if (bucketError || !bucket) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
      });
    }
  } catch (err) {
    // Ignore error if bucket creation fails/already exists
    console.warn("Bucket verification/creation skipped or failed:", err.message);
  }

  // 2. Build file path within bucket
  const folder = options.folder || "uploads";
  const filename = options.public_id || `image-${Date.now()}`;
  const filePath = `${folder}/${filename}`.replace(/\/+/g, "/");

  // 3. Upload buffer to Supabase Storage
  const contentType = options.contentType || "image/png";
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, {
      contentType: contentType,
      upsert: true,
      cacheControl: "31536000",
    });

  if (uploadError) {
    throw uploadError;
  }

  // 4. Retrieve Public URL
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return {
    public_id: filePath,
    secure_url: urlData.publicUrl,
  };
}
