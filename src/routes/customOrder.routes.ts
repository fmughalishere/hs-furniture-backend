import { Router } from "express";
import {
  createCustomOrderRequest,
  getCustomOrderRequests,
  updateCustomOrderStatus,
} from "../controllers/customOrder.controller";
import { protect, adminOnly, optionalAuth } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Custom Orders
 *   description: Custom furniture order requests
 */

/**
 * @swagger
 * /api/custom-orders:
 *   post:
 *     summary: Submit a custom order request (public, auth optional)
 *     tags: [Custom Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description, contactName, contactPhone]
 *             properties:
 *               description:
 *                 type: string
 *               contactName:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               referenceImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Cloudinary URLs from /api/upload
 *               budget:
 *                 type: number
 *     responses:
 *       201:
 *         description: Custom order submitted
 *   get:
 *     summary: Get all custom order requests (admin only)
 *     tags: [Custom Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of custom order requests
 */
router.post("/", optionalAuth, createCustomOrderRequest);
router.get("/", protect, adminOnly, getCustomOrderRequests);

/**
 * @swagger
 * /api/custom-orders/{id}:
 *   patch:
 *     summary: Update custom order status (admin only)
 *     tags: [Custom Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, reviewing, quoted, accepted, rejected, completed]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/:id", protect, adminOnly, updateCustomOrderStatus);

export default router;
