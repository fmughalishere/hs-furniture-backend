import jwt from "jsonwebtoken";
import asyncHandler from "./asyncHandler";
import ApiError from "../utils/ApiError";
import User from "../models/User.model";

interface DecodedToken {
  id: string;
}

export const protect = asyncHandler(async (req, res, next) => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, "Not authorized — no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, "User belonging to this token no longer exists");
    }
    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, "Not authorized — invalid or expired token");
  }
});

// Optional auth — attaches user if token present, but doesn't block the request if absent.
// Used for routes like order tracking that work both logged-in and as a guest.
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
});

export const adminOnly = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }
  next();
};
