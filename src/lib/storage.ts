import { v2 as cloudinary } from "cloudinary"

// Cloudinary-backed file storage for uploaded CV files. When the environment is
// not configured, uploads are skipped gracefully (the resume row is still
// created from the extracted text) so the app works without storage credentials.
const hasCloudinary =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

export const storageConfigured = hasCloudinary

/**
 * Upload a CV file buffer to Cloudinary. Returns the secure URL, or null when
 * storage is not configured or the upload fails (non-fatal — the resume is
 * still created from its extracted text).
 */
export async function uploadCvFile(
  buffer: Buffer,
  fileName: string,
  userId: string
): Promise<string | null> {
  if (!hasCloudinary) return null

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "raw",
            folder: `tailorcv/${userId}`,
            public_id: `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`,
            use_filename: true,
          },
          (error, uploaded) => {
            if (error || !uploaded) reject(error ?? new Error("Upload failed"))
            else resolve(uploaded as { secure_url: string })
          }
        )
        .end(buffer)
    })
    return result.secure_url
  } catch (err) {
    console.error("Cloudinary upload error:", err)
    return null
  }
}
