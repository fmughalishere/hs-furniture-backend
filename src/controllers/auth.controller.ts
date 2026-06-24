import asyncHandler from "../middleware/asyncHandler";
import ApiError from "../utils/ApiError";
import User from "../models/User.model";
import { generateToken, generateRandomToken } from "../utils/generateToken";
import { sendEmail } from "../utils/sendEmail";

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const verificationToken = generateRandomToken();

  const user = await User.create({
    name,
    email,
    password,
    phone,
    verificationToken,
  });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: "Confirm your HS Furniture account",
    html: `<p>Hi ${user.name},</p><p>Please confirm your account by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });

  const token = generateToken(user.id);

  res.status(201).json({
    success: true,
    message: "Account created. Please check your email to verify your account.",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(user.id);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// GET /api/auth/verify-email/:token
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({ verificationToken: token }).select("+verificationToken");
  if (!user) {
    throw new ApiError(400, "Invalid or expired verification link");
  }
  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  res.status(200).json({ success: true, message: "Email verified successfully. You can now log in." });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user) {
    // Don't leak whether an email exists
    res.status(200).json({ success: true, message: "If that email exists, a reset link has been sent." });
    return;
  }

  const resetToken = generateRandomToken();
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your HS Furniture password",
    html: `<p>Click below to reset your password (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  res.status(200).json({ success: true, message: "If that email exists, a reset link has been sent." });
});

// POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset link");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
});
