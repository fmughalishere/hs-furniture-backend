import asyncHandler from "../middleware/asyncHandler";
import ApiError from "../utils/ApiError";
import Cart from "../models/Cart.model";
import Product from "../models/Product.model";

const computeItemPrice = (
  basePrice: number,
  product: any,
  selectedVariations: { name: string; option: string }[],
) => {
  let price = basePrice;
  for (const sel of selectedVariations || []) {
    const variation = product.variations.find((v: any) => v.name === sel.name);
    const option = variation?.options.find((o: any) => o.label === sel.option);
    if (option) price += option.priceModifier;
  }
  return price;
};

// GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user!.id }).populate(
    "items.product",
    "title images basePrice slug",
  );
  if (!cart) {
    cart = await Cart.create({ user: req.user!.id, items: [] });
  }
  res.status(200).json({ success: true, cart });
});

// POST /api/cart  { productId, selectedVariations, quantity }
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, selectedVariations = [], quantity = 1 } = req.body;
  if (!productId) throw new ApiError(400, "productId is required");

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  const price = computeItemPrice(
    product.basePrice,
    product,
    selectedVariations,
  );

  let cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) {
    cart = await Cart.create({ user: req.user!.id, items: [] });
  }

  const existingItem = cart.items.find(
    (item) =>
      item.product.toString() === productId &&
      JSON.stringify(item.selectedVariations) ===
        JSON.stringify(selectedVariations),
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: product._id as any,
      selectedVariations,
      quantity,
      price,
    });
  }

  await cart.save();
  res.status(200).json({ success: true, cart });
});

// PATCH /api/cart/:itemId  { quantity }
export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1)
    throw new ApiError(400, "quantity must be at least 1");

  const cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) throw new ApiError(404, "Cart not found");

  const item = cart.items.find((i) => i._id?.toString() === req.params.itemId);
  if (!item) throw new ApiError(404, "Cart item not found");

  item.quantity = quantity;
  await cart.save();
  res.status(200).json({ success: true, cart });
});

// DELETE /api/cart/:itemId
export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.items = cart.items.filter(
    (i) => i._id?.toString() !== req.params.itemId,
  ) as any;
  await cart.save();
  res.status(200).json({ success: true, cart });
});
