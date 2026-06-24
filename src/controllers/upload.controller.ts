import asyncHandler from "../middleware/asyncHandler";
import ApiError from "../utils/ApiError";
import cloudinary from "../config/cloudinary";
import streamifier from "streamifier";

/**
 * Uploads a single file buffer (from multer memoryStorage) to Cloudinary
 * and returns the secure URL. That URL is what gets saved in MongoDB — e.g. in
 * Product.images, Order.paymentProofUrl, or CustomOrderRequest.referenceImages.
 */
const uploadSingleFileToCloudinary = (
  file: Express.Multer.File,
  folder: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: file.mimetype === "application/pdf" ? "raw" : "image",
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

/**
 * POST /api/upload
 * Accepts one or more files under the field name "images", plus an optional
 * "folder" text field to organize uploads in Cloudinary, e.g.:
 *   folder=products        -> product gallery images
 *   folder=payment-proofs  -> bank transfer screenshots
 *   folder=custom-orders   -> custom order reference images
 *   folder=assembly-guides -> assembly manual PDFs
 * Defaults to "general" if not provided.
 */
export const uploadImages = asyncHandler(async (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (!files.length) {
    throw new ApiError(400, "No files uploaded — send them under the 'images' field");
  }

  const folder = (req.body.folder as string) || "general";

  const urls = await Promise.all(
    files.map((file) => uploadSingleFileToCloudinary(file, folder))
  );

  res.status(201).json({ success: true, urls });
});
