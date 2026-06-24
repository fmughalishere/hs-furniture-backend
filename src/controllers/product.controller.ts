import asyncHandler from "../middleware/asyncHandler";
import ApiError from "../utils/ApiError";
import Product from "../models/Product.model";

// GET /api/products?search=&category=&minPrice=&maxPrice=&page=&limit=&sort=
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, isCustomizable, tags, sort } = req.query;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "12", 10);

  const filter: Record<string, any> = { status: "active" };

  if (search) {
    filter.$text = { $search: search as string };
  }
  if (category) {
    filter.category = category;
  }
  if (isCustomizable !== undefined) {
    filter.isCustomizable = isCustomizable === "true";
  }
  if (tags) {
    filter.tags = { $in: (tags as string).split(",") };
  }
  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) filter.basePrice.$gte = Number(minPrice);
    if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
  }

  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === "price_asc") sortOption = { basePrice: 1 };
  if (sort === "price_desc") sortOption = { basePrice: -1 };
  if (sort === "rating") sortOption = { ratingsAverage: -1 };

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("category", "name slug")
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    products,
  });
});

// GET /api/products/assembly-guide?code=PRODUCTCODE  OR  ?title=Product Title
// Public lookup used by the "Assembly Guide Finding" flow
export const findAssemblyGuide = asyncHandler(async (req, res) => {
  const { code, title } = req.query;

  if (!code && !title) {
    throw new ApiError(400, "Provide either a product code or product title to search");
  }

  const filter: Record<string, any> = {};
  if (code) filter["assemblyGuide.productCode"] = code;
  if (title) filter.title = { $regex: title as string, $options: "i" };

  const product = await Product.findOne(filter).select("title images assemblyGuide");

  if (!product || !product.assemblyGuide) {
    throw new ApiError(404, "No assembly guide found for that product code/title");
  }

  res.status(200).json({ success: true, product });
});

// GET /api/products/:slug
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate("category", "name slug");
  if (!product) throw new ApiError(404, "Product not found");
  res.status(200).json({ success: true, product });
});

// POST /api/products (admin)
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

// PATCH /api/products/:id (admin)
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, "Product not found");
  res.status(200).json({ success: true, product });
});

// DELETE /api/products/:id (admin)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  res.status(200).json({ success: true, message: "Product deleted" });
});
