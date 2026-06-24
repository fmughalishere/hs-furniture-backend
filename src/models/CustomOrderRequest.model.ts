import mongoose, { Document, Schema } from "mongoose";

export interface ICustomOrderRequest extends Document {
  user?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  description: string;
  referenceImages: string[];
  budgetRange?: string;
  status: "new" | "in_review" | "quoted" | "accepted" | "rejected";
}

const customOrderRequestSchema = new Schema<ICustomOrderRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    description: { type: String, required: true },
    referenceImages: { type: [String], default: [] },
    budgetRange: { type: String },
    status: {
      type: String,
      enum: ["new", "in_review", "quoted", "accepted", "rejected"],
      default: "new",
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICustomOrderRequest>("CustomOrderRequest", customOrderRequestSchema);
