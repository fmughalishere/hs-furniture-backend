import { Router } from "express";
import { createContactMessage, getContactMessages, updateContactStatus } from "../controllers/contact.controller";
import { protect, adminOnly } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Customer support / contact form
 */

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a contact message (public)
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message submitted
 *   get:
 *     summary: Get all contact messages (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contact messages
 */
router.post("/", createContactMessage);
router.get("/", protect, adminOnly, getContactMessages);

/**
 * @swagger
 * /api/contact/{id}:
 *   patch:
 *     summary: Update contact message status (admin only)
 *     tags: [Contact]
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
 *                 enum: [new, read, resolved]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/:id", protect, adminOnly, updateContactStatus);

export default router;
