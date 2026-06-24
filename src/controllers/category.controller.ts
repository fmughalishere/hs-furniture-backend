import asyncHandler from "../middleware/asyncHandler";
import ApiError from "../utils/ApiError";
import Category from "../models/Category.model";

// GET /api/categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.status(200).json({ success: true, count: categories.length, categories });
});

// POST /api/categories (admin)
export const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, description, parentCategory } = req.body;
  if (!name) throw new ApiError(400, "Category name is required");

  const category = await Category.create({ name, icon, description, parentCategory: parentCategory || null });
  res.status(201).json({ success: true, category });
});

// PATCH /api/categories/:id (admin)
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  const { name, icon, description, parentCategory } = req.body;
  if (name) category.name = name;
  if (icon !== undefined) category.icon = icon;
  if (description !== undefined) category.description = description;
  if (parentCategory !== undefined) category.parentCategory = parentCategory;

  await category.save();
  res.status(200).json({ success: true, category });
});

// DELETE /api/categories/:id (admin)
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");
  res.status(200).json({ success: true, message: "Category deleted" });
});
