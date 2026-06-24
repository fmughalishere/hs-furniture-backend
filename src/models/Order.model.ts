import mongoose, { Document, Schema } from "mongoose";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  title: string;
  image: string;
  selectedVariations: { name: string; option: string }[];
  quantity: number;
  price: number;
}

export interface IStatusHistoryEntry {
  status: string;
  note?: string;
  date: Date;
}

export type PaymentMethod = "COD" | "BankTransfer" | "JazzCash" | "Easypaisa";
export type PaymentStatus = "pending" | "awaiting_verification" | "paid" | "failed" | "refunded";
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province?: string;
    postalCode?: string;
    country: string;
  };
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProofUrl?: string;
  orderStatus: OrderStatus;
  trackingId: string;
  courier?: string;
  statusHistory: IStatusHistoryEntry[];
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    image: { type: String },
    selectedVariations: [
      {
        name: { type: String },
        option: { type: String },
      },
    ],
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      province: { type: String },
      postalCode: { type: String },
      country: { type: String, default: "Pakistan" },
    },
    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["COD", "BankTransfer", "JazzCash", "Easypaisa"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "awaiting_verification", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentProofUrl: { type: String },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    trackingId: { type: String, unique: true },
    courier: { type: String },
    statusHistory: {
      type: [
        {
          status: { type: String },
          note: { type: String },
          date: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

orderSchema.pre("save", function (next) {
  if (!this.trackingId) {
    this.trackingId = "HSF" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 900 + 100);
  }
  if (this.isNew) {
    this.statusHistory.push({ status: this.orderStatus, date: new Date(), note: "Order placed" });
  }
  next();
});

export default mongoose.model<IOrder>("Order", orderSchema);
