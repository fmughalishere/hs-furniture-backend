import asyncHandler from "../middleware/asyncHandler";
import ApiError from "../utils/ApiError";
import CustomOrderRequest from "../models/CustomOrderRequest.model";

// POST /api/custom-orders — public (works for guests and logged-in users)
export const createCustomOrderRequest = asyncHandler(async (req, res) => {
  const { name, email, phone, description, referenceImages, budgetRange } = req.body;
  if (!name || !email || !phone || !description) {
    throw new ApiError(400, "name, email, phone and description are required");
  }

  const request = await CustomOrderRequest.create({
    user: req.user?.id,
    name,
    email,
    phone,
    description,
    referenceImages: referenceImages || [],
    budgetRange,
  });

  res.status(201).json({
    success: true,
    message: "Custom order request submitted. Our team will get back to you with a quote.",
    request,
  });
});

// GET /api/custom-orders (admin)
export const getCustomOrderRequests = asyncHandler(async (req, res) => {
  const requests = await CustomOrderRequest.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: requests.length, requests });
});

// PATCH /api/custom-orders/:id (admin)  { status }
export const updateCustomOrderStatus = asyncHandler(async (req, res) => {
  const request = await CustomOrderRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "Request not found");

  request.status = req.body.status || request.status;
  await request.save();

  res.status(200).json({ success: true, request });
});
