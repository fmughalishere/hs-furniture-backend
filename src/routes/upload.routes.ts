import { Router } from "express";
import multer from "multer";
import { uploadImages } from "../controllers/upload.controller";
import { protect } from "../middleware/auth.middleware";

// memoryStorage -> file arrives as a Buffer (file.buffer), which we stream to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/") && file.mimetype !== "application/pdf") {
      return cb(new Error("Only image or PDF files are allowed"));
    }
    cb(null, true);
  },
});

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload to Cloudinary
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload one or more images / PDFs to Cloudinary
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 10 files (images or PDFs), max 10MB each
 *               folder:
 *                 type: string
 *                 example: products
 *                 description: "Cloudinary folder: products | payment-proofs | custom-orders | assembly-guides | general"
 *     responses:
 *       201:
 *         description: Upload successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - https://res.cloudinary.com/your_cloud/image/upload/v1/products/abc123.jpg
 *       400:
 *         description: No files uploaded
 *       401:
 *         description: Not authenticated
 */
router.post("/", protect, upload.array("images", 10), uploadImages);

export default router;
