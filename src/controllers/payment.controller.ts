import asyncHandler from "../middleware/asyncHandler";
import ApiError from "../utils/ApiError";
import Order from "../models/Order.model";

/**
 * POST /api/payments/initiate   { orderId }
 *
 * Looks at the order's paymentMethod and returns whatever the client needs next:
 *  - COD            -> nothing else to do, order is already confirmed for delivery-time payment
 *  - BankTransfer    -> our bank account details so the customer can transfer & upload proof
 *  - JazzCash/Easypaisa -> a redirect/checkout payload (stubbed until live merchant keys exist)
 */
export const initiatePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) throw new ApiError(400, "orderId is required");

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  if (req.user!.role !== "admin" && order.user.toString() !== req.user!.id) {
    throw new ApiError(403, "Not allowed to pay for this order");
  }

  switch (order.paymentMethod) {
    case "COD": {
      // Nothing to collect upfront — courier collects cash at delivery
      order.paymentStatus = "pending";
      await order.save();
      return res.status(200).json({
        success: true,
        method: "COD",
        message: "Cash on Delivery confirmed. Pay the courier when your order arrives.",
      });
    }

    case "BankTransfer": {
      order.paymentStatus = "awaiting_verification";
      await order.save();
      return res.status(200).json({
        success: true,
        method: "BankTransfer",
        message: "Transfer the order total to the account below, then upload your payment proof.",
        bankDetails: {
          accountTitle: process.env.BANK_ACCOUNT_TITLE,
          bankName: process.env.BANK_NAME,
          accountNumber: process.env.BANK_ACCOUNT_NUMBER,
          iban: process.env.BANK_IBAN,
          amount: order.totalAmount,
          reference: order.trackingId,
        },
      });
    }

    case "JazzCash": {
      // TODO (once merchant account is approved): build the real JazzCash hosted-checkout
      // payload here using JAZZCASH_MERCHANT_ID / JAZZCASH_PASSWORD / JAZZCASH_INTEGRITY_SALT
      // from .env, generate the pp_SecureHash (HMAC-SHA256), and return the redirect URL/fields.
      if (!process.env.JAZZCASH_MERCHANT_ID) {
        return res.status(200).json({
          success: true,
          method: "JazzCash",
          sandbox: true,
          message:
            "JazzCash merchant credentials are not configured yet. Add JAZZCASH_MERCHANT_ID / JAZZCASH_PASSWORD / JAZZCASH_INTEGRITY_SALT to .env once your merchant account is approved.",
        });
      }
      // Real implementation goes here once credentials exist.
      return res.status(200).json({ success: true, method: "JazzCash", message: "Redirecting to JazzCash..." });
    }

    case "Easypaisa": {
      // TODO (once merchant account is approved): build the real Easypaisa payment request
      // using EASYPAISA_STORE_ID / EASYPAISA_HASH_KEY from .env, sign the request, and return
      // the redirect URL/fields for the hosted checkout.
      if (!process.env.EASYPAISA_STORE_ID) {
        return res.status(200).json({
          success: true,
          method: "Easypaisa",
          sandbox: true,
          message:
            "Easypaisa merchant credentials are not configured yet. Add EASYPAISA_STORE_ID / EASYPAISA_HASH_KEY to .env once your merchant account is approved.",
        });
      }
      // Real implementation goes here once credentials exist.
      return res.status(200).json({ success: true, method: "Easypaisa", message: "Redirecting to Easypaisa..." });
    }

    default:
      throw new ApiError(400, "Unsupported payment method");
  }
});

// POST /api/payments/bank-transfer/proof   { orderId, proofImageUrl }
export const submitBankTransferProof = asyncHandler(async (req, res) => {
  const { orderId, proofImageUrl } = req.body;
  if (!orderId || !proofImageUrl) {
    throw new ApiError(400, "orderId and proofImageUrl are required");
  }

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.user.toString() !== req.user!.id) {
    throw new ApiError(403, "Not allowed to update this order");
  }

  order.paymentProofUrl = proofImageUrl;
  order.paymentStatus = "awaiting_verification";
  await order.save();

  res.status(200).json({
    success: true,
    message: "Payment proof submitted. We'll confirm your order once it's verified (usually within a few hours).",
    order,
  });
});

// PATCH /api/payments/:orderId/verify (admin)  { approve: boolean }
export const verifyBankTransfer = asyncHandler(async (req, res) => {
  const { approve } = req.body;
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new ApiError(404, "Order not found");

  if (approve) {
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.statusHistory.push({ status: "confirmed", note: "Bank transfer verified by admin", date: new Date() });
  } else {
    order.paymentStatus = "failed";
    order.statusHistory.push({ status: order.orderStatus, note: "Bank transfer rejected by admin", date: new Date() });
  }

  await order.save();
  res.status(200).json({ success: true, order });
});

// POST /api/payments/jazzcash/callback — webhook stub for JazzCash to call after a transaction
export const jazzCashCallback = asyncHandler(async (req, res) => {
  // TODO: verify req.body.pp_SecureHash against JAZZCASH_INTEGRITY_SALT before trusting this payload.
  console.log("JazzCash callback received:", req.body);
  res.status(200).json({ success: true });
});

// POST /api/payments/easypaisa/callback — webhook stub for Easypaisa to call after a transaction
export const easypaisaCallback = asyncHandler(async (req, res) => {
  // TODO: verify the signed response (merchantHashedResp) against EASYPAISA_HASH_KEY before trusting this payload.
  console.log("Easypaisa callback received:", req.body);
  res.status(200).json({ success: true });
});
