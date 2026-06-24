import asyncHandler from "../middleware/asyncHandler";
import ApiError from "../utils/ApiError";
import User from "../models/User.model";

// PATCH /api/users/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findById(req.user!.id);
  if (!user) throw new ApiError(404, "User not found");

  if (name) user.name = name;
  if (phone) user.phone = phone;
  await user.save();

  res.status(200).json({ success: true, user });
});

// PATCH /api/users/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    throw new ApiError(400, "Current password and a new password (min 6 chars) are required");
  }

  const user = await User.findById(req.user!.id).select("+password");
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: "Password updated successfully" });
});

// GET /api/users/addresses
export const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.id);
  res.status(200).json({ success: true, addresses: user?.addresses || [] });
});

// POST /api/users/addresses
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new ApiError(404, "User not found");

  const { label, fullName, phone, addressLine1, addressLine2, city, province, postalCode, country, isDefault } =
    req.body;

  if (!fullName || !phone || !addressLine1 || !city) {
    throw new ApiError(400, "fullName, phone, addressLine1 and city are required");
  }

  if (isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  user.addresses.push({
    label,
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    province,
    postalCode,
    country: country || "Pakistan",
    isDefault: !!isDefault,
  });

  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
});
