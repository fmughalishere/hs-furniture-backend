import asyncHandler from "../middleware/asyncHandler";
import ApiError from "../utils/ApiError";
import Review from "../models/Review.model";
import Product from "../models/Product.model";

// GET /api/reviews/product/:productId
export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate("user", "name")
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: reviews.length, reviews });
});

// POST /api/reviews/product/:productId   { rating, comment, images }
export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment, images } = req.body;
  if (!rating || !comment) throw new ApiError(400, "rating and comment are required");

  const product = await Product.findById(req.params.productId);
  if (!product) throw new ApiError(404, "Product not found");

  const existing = await Review.findOne({ product: product._id, user: req.user!.id });
  if (existing) throw new ApiError(409, "You have already reviewed this product");

  const review = await Review.create({
    product: product._id,
    user: req.user!.id,
    rating,
    comment,
    images: images || [],
  });

  // recompute product rating stats
  const allReviews = await Review.find({ product: product._id });
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  product.ratingsAverage = Math.round(avg * 10) / 10;
  product.numReviews = allReviews.length;
  await product.save();

  res.status(201).json({ success: true, review });
});
