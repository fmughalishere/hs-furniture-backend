import asyncHandler from "../middleware/asyncHandler";
import ApiError from "../utils/ApiError";
import Order from "../models/Order.model";
import Cart from "../models/Cart.model";
import Product from "../models/Product.model";

// POST /api/orders  { shippingAddress, paymentMethod }
// Builds the order from the user's current cart
export const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress || !paymentMethod) {
    throw new ApiError(400, "shippingAddress and paymentMethod are required");
  }
  if (!["COD", "BankTransfer", "JazzCash", "Easypaisa"].includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method");
  }

  const cart = await Cart.findOne({ user: req.user!.id }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  const items = cart.items.map((item: any) => ({
    product: item.product._id,
    title: item.product.title,
    image: item.product.images?.[0] || "",
    selectedVariations: item.selectedVariations,
    quantity: item.quantity,
    price: item.price,
  }));

  const totalAmount = items.reduce((sum: number, it: any) => sum + it.price * it.quantity, 0);

  const order = await Order.create({
    user: req.user!.id,
    items,
    shippingAddress,
    totalAmount,
    paymentMethod,
    paymentStatus: "pending",
    orderStatus: "pending",
  });

  // clear the cart after order is placed
  cart.items = [] as any;
  await cart.save();

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    order,
  });
});

// GET /api/orders/my-orders
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user!.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: orders.length, orders });
});

// GET /api/orders/track/:trackingId  — PUBLIC, no login required
export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ trackingId: req.params.trackingId }).select(
    "trackingId orderStatus paymentStatus courier statusHistory items totalAmount createdAt"
  );
  if (!order) {
    throw new ApiError(404, "No order found with that tracking ID");
  }
  res.status(200).json({ success: true, order });
});

// GET /api/orders/:id
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");

  // customers can only view their own orders; admins can view any
  if (req.user!.role !== "admin" && order.user.toString() !== req.user!.id) {
    throw new ApiError(403, "You are not allowed to view this order");
  }

  res.status(200).json({ success: true, order });
});

// PATCH /api/orders/:id/status (admin)  { orderStatus, courier, trackingNote }
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, courier, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");

  if (orderStatus) order.orderStatus = orderStatus;
  if (courier) order.courier = courier;

  order.statusHistory.push({
    status: orderStatus || order.orderStatus,
    note: note || `Status updated to ${orderStatus}`,
    date: new Date(),
  });

  await order.save();
  res.status(200).json({ success: true, order });
});

// admin: list all orders
// GET /api/orders (admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: orders.length, orders });
});
