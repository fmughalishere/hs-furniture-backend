import { Router } from "express";
import {
  initiatePayment,
  submitBankTransferProof,
  verifyBankTransfer,
  jazzCashCallback,
  easypaisaCallback,
} from "../controllers/payment.controller";
import { protect, adminOnly } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing (bank transfer, JazzCash, Easypaisa)
 */

/**
 * @swagger
 * /api/payments/initiate:
 *   post:
 *     summary: Initiate a payment for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, method]
 *             properties:
 *               orderId:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [jazzcash, easypaisa, bank_transfer]
 *     responses:
 *       200:
 *         description: Payment initiation data (redirect URL or bank details)
 */
router.post("/initiate", protect, initiatePayment);

/**
 * @swagger
 * /api/payments/bank-transfer/proof:
 *   post:
 *     summary: Submit bank transfer screenshot for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, proofUrl]
 *             properties:
 *               orderId:
 *                 type: string
 *               proofUrl:
 *                 type: string
 *                 description: Cloudinary URL from /api/upload
 *     responses:
 *       200:
 *         description: Proof submitted, awaiting admin verification
 */
router.post("/bank-transfer/proof", protect, submitBankTransferProof);

/**
 * @swagger
 * /api/payments/{orderId}/verify:
 *   patch:
 *     summary: Admin verifies a bank transfer payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verified, order confirmed
 */
router.patch("/:orderId/verify", protect, adminOnly, verifyBankTransfer);

/**
 * @swagger
 * /api/payments/jazzcash/callback:
 *   post:
 *     summary: JazzCash payment callback webhook (called by JazzCash servers)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Callback processed
 */
router.post("/jazzcash/callback", jazzCashCallback);

/**
 * @swagger
 * /api/payments/easypaisa/callback:
 *   post:
 *     summary: Easypaisa payment callback webhook (called by Easypaisa servers)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Callback processed
 */
router.post("/easypaisa/callback", easypaisaCallback);

export default router;
