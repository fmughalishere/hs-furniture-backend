import asyncHandler from "../middleware/asyncHandler";
import ApiError from "../utils/ApiError";
import ContactMessage from "../models/ContactMessage.model";

// POST /api/contact — public
export const createContactMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message, channel } = req.body;
  if (!name || !email || !message) {
    throw new ApiError(400, "name, email and message are required");
  }

  const contact = await ContactMessage.create({
    name,
    email,
    phone,
    subject,
    message,
    channel: channel || "website_form",
  });

  res.status(201).json({
    success: true,
    message: "Thanks for reaching out — we'll get back to you shortly.",
    contact,
  });
});

// GET /api/contact (admin)
export const getContactMessages = asyncHandler(async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: messages.length, messages });
});

// PATCH /api/contact/:id (admin)  { status }
export const updateContactStatus = asyncHandler(async (req, res) => {
  const contact = await ContactMessage.findById(req.params.id);
  if (!contact) throw new ApiError(404, "Message not found");

  contact.status = req.body.status || contact.status;
  await contact.save();

  res.status(200).json({ success: true, contact });
});
